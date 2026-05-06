# CineSentiment

Movie review sentiment analysis with a fine-tuned DistilBERT model, served behind a FastAPI sidecar and consumed by a Hono + tRPC backend that powers a React VHS-themed UI.

## What this is

An academic project that:

1. **Fine-tunes** `distilbert-base-uncased` on the IMDB 50k reviews dataset (Colab T4, ~14 minutes, accuracy 0.9151).
2. **Hosts** the trained weights on Hugging Face Hub at [`ethsmaa/cinesentiment-distilbert-imdb`](https://huggingface.co/ethsmaa/cinesentiment-distilbert-imdb).
3. **Serves** predictions over HTTP from a Python FastAPI service that loads the model on startup (`/predict`, `/predict/batch`, `/health`).
4. **Bridges** to the existing 3-class UI through a Hono client that maps the binary IMDB output to positive / neutral / negative via a confidence-band threshold (`p_positive ≥ 0.65` / `≤ 0.35`).
5. **Visualizes** model metrics (accuracy, F1, per-class breakdown, confusion matrix, top words) directly from `ml/metrics.json` — the same file the training notebook produces.

## Repo layout

```
movie-sentiment/
├── apps/
│   ├── api/                  Hono + tRPC backend (apps/api/README.md)
│   └── web/                  React + Vite + Tailwind frontend
├── services/
│   └── sentiment/            FastAPI Python sidecar (services/sentiment/README.md)
├── ml/                       Training notebook + metrics.json (ml/README.md)
├── packages/
│   └── shared/               Shared types and Zod schemas
└── docker-compose.yml        Postgres for local dev
```

## Quick start

You need: Docker (or OrbStack), Node 20+, pnpm, Python 3.9+.

```bash
# 1. Postgres
docker compose up -d postgres

# 2. Install Node deps + seed DB
pnpm install
pnpm --filter @movie-sentiment/api exec prisma migrate deploy
pnpm --filter @movie-sentiment/api exec prisma db seed

# 3. Pull the trained model from Hugging Face Hub
cd services/sentiment
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements-download.txt
python3 scripts/download_model.py
pip install -r requirements.txt
cd ../..

# 4. Start everything (separate terminals)
# Terminal 1 — sentiment service
cd services/sentiment && source .venv/bin/activate && uvicorn main:app --port 8000

# Terminal 2 — API
SENTIMENT_SERVICE_URL=http://127.0.0.1:8000 pnpm --filter @movie-sentiment/api dev

# Terminal 3 — Web
pnpm --filter @movie-sentiment/web dev
```

Open http://localhost:5173.

## ML pipeline

```
ml/train_distilbert.ipynb          ┐
  ├─ load IMDB 50k                  │
  ├─ tokenize (DistilBERT, max=256) │  Colab T4
  ├─ fine-tune 3 epochs             │  ~14 min
  └─ eval → metrics.json + topWords ┘
                  │
                  └──► huggingface.co/ethsmaa/cinesentiment-distilbert-imdb
                              │
                              └──► services/sentiment/scripts/download_model.py
                                              │
                                              └──► FastAPI /predict/batch
                                                            │
                                                            └──► apps/api bert-client.ts
                                                                          │  (3-class threshold mapping)
                                                                          └──► tRPC sentiment.* → React UI
```

The training metrics flow into the UI through a separate path: `ml/metrics.json` is committed to the repo, read by `apps/api/src/services/training-metrics.ts` at module load, and surfaced to the frontend through the `sentiment.modelMetrics` tRPC procedure.

To retrain:

1. Open `ml/train_distilbert.ipynb` in Colab on a T4 runtime.
2. Add `HF_TOKEN` to Colab secrets (write scope).
3. Run all cells. The notebook pushes the new model to HF Hub and downloads `metrics.json` for you to commit.
4. From the repo root:
   ```bash
   mv ~/Downloads/metrics.json ml/metrics.json
   cd services/sentiment && python3 scripts/download_model.py
   pnpm --filter @movie-sentiment/api exec tsx scripts/reanalyze-movie.ts --all
   ```

## Tests

| Layer | Command | Coverage |
|---|---|---|
| Hono / tRPC backend (Vitest) | `pnpm --filter @movie-sentiment/api test` | 40 tests across simulator, bert-client, sentiment service, movie service |
| FastAPI sidecar (pytest) | `cd services/sentiment && pytest` | 11 tests covering the HTTP surface with a stubbed model |
| Web UI (Playwright) | `pnpm --filter @movie-sentiment/web exec playwright test` | E2E happy path |

## Architecture notes

**Why a Python sidecar?** The trained model is a PyTorch artifact. Running PyTorch in Node is possible (`transformers.js`, ONNX Runtime) but the developer experience is rough and the cold-start cost on Mac MPS / CUDA isn't worth it for an academic project. A separate FastAPI service is the cleanest split.

**Why threshold mapping for 3-class?** The training set is binary (IMDB pos/neg). The UI was designed against a 3-class taxonomy. Rather than retrain on a hand-labeled neutral set or invent ground truth, the API uses confidence-band thresholds (`POSITIVE_THRESHOLD=0.65`, `NEGATIVE_THRESHOLD=0.35`) to derive the neutral bucket from the binary model's `p_positive`. This is explicitly heuristic, not learned — see `apps/api/src/services/bert-client.ts`.

**Why graceful fallback?** If the FastAPI sidecar is down, `apps/api/src/services/sentiment.service.ts` falls back to the original lexicon-based simulator and logs a warning. The UI never breaks during local dev when someone forgets to start the Python service.

## Project status

All 6 phases of the ML pipeline milestone are complete:

| # | Phase | PR |
|---|---|---|
| 1 | Train DistilBERT on IMDB | [#11](https://github.com/ethsmaa/movie-sentiment/pull/11) |
| 2 | Host model on HF Hub + download script | [#12](https://github.com/ethsmaa/movie-sentiment/pull/12) |
| 3 | FastAPI sentiment service | [#13](https://github.com/ethsmaa/movie-sentiment/pull/13) |
| 4 | Hono client with fallback | [#14](https://github.com/ethsmaa/movie-sentiment/pull/14) |
| 5 | Real metrics in ModelMetricsPage | [#15](https://github.com/ethsmaa/movie-sentiment/pull/15) |
| 5b | Handbook polish | [#16](https://github.com/ethsmaa/movie-sentiment/pull/16) |
| 6 | Tests + docs | this PR |

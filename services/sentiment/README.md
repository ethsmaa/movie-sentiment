# Sentiment Service

Python sidecar that loads the fine-tuned DistilBERT model and exposes sentiment predictions to the Hono backend over HTTP.

## Quick start

### 1. Download the model

First-time setup. From the repo root:

```bash
cd services/sentiment
python3 -m venv .venv
source .venv/bin/activate
pip install -r scripts/requirements-download.txt
python3 scripts/download_model.py
```

The download is ~270 MB and takes well under a minute on a normal connection.

### 2. Install runtime dependencies

```bash
pip install -r requirements.txt
```

This pulls in `torch`, `transformers`, `fastapi`, and `uvicorn`. ~150 MB on first install, mostly Torch.

### 3. Run the FastAPI server

```bash
uvicorn main:app --reload --port 8000
```

The server boots in 1–2 seconds (model load is the slowest step). On Apple Silicon it auto-selects MPS; on machines with CUDA it picks GPU; otherwise CPU.

### 4. Smoke-test

```bash
curl -s http://127.0.0.1:8000/health
curl -s -X POST http://127.0.0.1:8000/predict \
  -H 'Content-Type: application/json' \
  -d '{"text":"Absolutely brilliant film, one of the best I have seen."}'
```

Expected `/predict` response:

```json
{
  "label": "positive",
  "confidence": 0.998,
  "p_positive": 0.998,
  "p_negative": 0.002
}
```

## Endpoints

| Method | Path | Body | Response |
|---|---|---|---|
| `GET` | `/health` | — | model status, device, uptime |
| `POST` | `/predict` | `{ "text": string }` | `{ label, confidence, p_positive, p_negative }` |
| `POST` | `/predict/batch` | `{ "texts": string[] }` (max 64) | `{ "predictions": Prediction[] }` |

`p_positive` is what the Hono backend uses for the 3-class threshold mapping
(`>= 0.65` positive, `<= 0.35` negative, otherwise neutral) in Phase 4.

## Configuration

## Configuration

All env vars are optional. Set them via your shell or a `services/sentiment/.env` file you keep out of git (see `.env.example`).

| Variable | Default | When you need it |
|---|---|---|
| `HF_REPO_ID` | `ethsmaa/cinesentiment-distilbert-imdb` | Override to use a different model |
| `HF_TOKEN` | (none) | Only if the HF repo is private |
| `MODEL_DIR` | `services/sentiment/model` | Override the local model path |
| `DEVICE` | auto (`cuda` → `mps` → `cpu`) | Force a specific torch device |

The default repo is **public** so first-time setup needs no auth.

## Re-downloading

The script is idempotent — re-running it overwrites local files with whatever is on the Hub. Use this when:

- You retrain the model and push a new version
- You suspect local files are corrupt
- You're switching `HF_REPO_ID` to a different model

```bash
python3 scripts/download_model.py
```

## Troubleshooting

| Error | Fix |
|---|---|
| `huggingface_hub not installed` | `pip install -r scripts/requirements-download.txt` |
| `Repo '...' not found or you lack access` | Repo went private — set `HF_TOKEN` in your shell or `.env` |
| `required files missing after download` | Hub repo is incomplete; re-train and re-push (Phase 1 notebook) |
| Slow download (~kbps) | HF is rate-limiting unauthenticated traffic; set `HF_TOKEN` for higher quota |

## How the rest of the stack uses this

The Hono backend (`apps/api`) reads `SENTIMENT_SERVICE_URL` (default `http://127.0.0.1:8000`) and routes every `sentiment.analyze` tRPC call through `apps/api/src/services/bert-client.ts`, which:

- Hashes each text with sha256 and caches results in-memory (cap 5000) — so repeated reviews don't hit this service twice.
- Chunks any batch over 64 texts into sequential `/predict/batch` calls.
- Maps the binary `p_positive` from this service onto the existing 3-class UI via `POSITIVE_THRESHOLD = 0.65` / `NEGATIVE_THRESHOLD = 0.35`.
- Falls back to a local lexicon-based simulator with a logged warning if this service is unreachable, so the UI never breaks during local dev.

## Tests

```bash
source .venv/bin/activate
pip install -r tests/requirements-test.txt
pytest tests/ -v
```

11 tests cover the HTTP surface (validation, label mapping, batch order, 503 fallback, probability normalization). The model itself is stubbed — accuracy is measured at training time and frozen in `ml/metrics.json`.

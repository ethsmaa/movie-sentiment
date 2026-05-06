# Sentiment Service

Python sidecar that loads the fine-tuned DistilBERT model and exposes sentiment predictions to the Hono backend.

This folder is built across two phases:

- **Phase 2 (this PR):** Model download script — pulls weights from Hugging Face Hub.
- **Phase 3 (issue #7):** FastAPI server with `/predict`, `/predict/batch`, `/health`.

## Quick start (Phase 2)

### 1. Create a virtual environment

From the repo root:

```bash
cd services/sentiment
python3 -m venv .venv
source .venv/bin/activate
```

### 2. Install download dependencies

```bash
pip install -r scripts/requirements-download.txt
```

### 3. Download the model

```bash
python3 scripts/download_model.py
```

Expected output:

```
Downloading ethsmaa/cinesentiment-distilbert-imdb
        →   /Users/.../services/sentiment/model
Done. 271.0 MB across 7 files.
Files: ['config.json', 'model.safetensors', 'special_tokens_map.json', 'tokenizer.json', 'tokenizer_config.json', 'training_args.bin', 'vocab.txt']
```

The download takes ~30 seconds on a normal connection.

## Configuration

The download script reads two optional environment variables (see `.env.example`):

| Variable | Default | When you need it |
|---|---|---|
| `HF_REPO_ID` | `ethsmaa/cinesentiment-distilbert-imdb` | Override to use a different model |
| `HF_TOKEN` | (none) | Only if the HF repo is private |

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

## What's next (Phase 3)

The next phase adds:

- `services/sentiment/main.py` — FastAPI app
- `services/sentiment/requirements.txt` — full runtime deps (fastapi, uvicorn, transformers, torch)
- `services/sentiment/Dockerfile` (optional)

Phase 3 will reuse the downloaded `model/` directory.

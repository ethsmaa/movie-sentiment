# ML Pipeline — DistilBERT Sentiment Fine-tuning

This folder contains the training pipeline for the CineSentiment sentiment analysis model.
The notebook fine-tunes `distilbert-base-uncased` on the IMDB 50k reviews dataset and
produces a model + `metrics.json` that the rest of the stack consumes.

## What gets produced

| Artifact | Where it lives | Committed? |
|---|---|---|
| Fine-tuned model weights (~250 MB) | `model/` (locally) and Hugging Face Hub | No (gitignored) |
| Tokenizer config | `model/` and HF Hub | No (gitignored) |
| `metrics.json` (accuracy, F1, confusion matrix, top words) | `ml/metrics.json` | Yes |

## Quick start (Colab — recommended)

### 1. Open the notebook in Colab

1. Open https://colab.research.google.com/
2. `File → Upload notebook` → choose `ml/train_distilbert.ipynb`
3. `Runtime → Change runtime type → T4 GPU` → Save

> Verify GPU is active by running cell 2 — you should see `cuda: True` and a Tesla T4.

### 2. Add your Hugging Face token (optional but recommended)

You need an HF token only if you want to push the trained model to the Hub
(the FastAPI service in Phase 3 expects it there).

In Colab, click the **🔑 key icon** in the left sidebar → "Add new secret":
- Name: `HF_TOKEN`
- Value: `hf_xxxxxxxx...` (the write token from https://huggingface.co/settings/tokens)
- Toggle "Notebook access" ON

The notebook reads the token via `google.colab.userdata.get('HF_TOKEN')`.

### 3. Run the notebook top to bottom

- Total runtime on a free T4: **45–75 minutes** (mostly training)
- The notebook saves checkpoints every epoch in case Colab disconnects
- Final cell auto-downloads `metrics.json` to your machine

### 4. Bring `metrics.json` back into the repo

After the download, move the file:

```bash
mv ~/Downloads/metrics.json /Users/esmaoruc/movie-sentiment/ml/metrics.json
git add ml/metrics.json
git commit -m "chore(ml): commit metrics from training run YYYY-MM-DD"
```

## Configuration

The notebook exposes a `CONFIG` dict near the top. Defaults:

| Key | Default | Meaning |
|---|---|---|
| `model_name` | `distilbert-base-uncased` | Pre-trained base model |
| `max_length` | `256` | Token cap per review (covers ~99% of IMDB reviews fully) |
| `batch_size` | `16` | Per-device batch size; T4 handles this comfortably |
| `learning_rate` | `2e-5` | Standard DistilBERT fine-tuning rate |
| `epochs` | `3` | More than this overfits IMDB |
| `seed` | `42` | Reproducibility |

## Why these choices?

- **DistilBERT over BERT-base:** 60% fewer parameters, ~95% of accuracy, runs on CPU at inference
- **Binary classification:** IMDB labels are pos/neg only. The 3-class UI gets neutral via threshold mapping in Phase 4 (`POSITIVE_THRESHOLD = 0.65`, `NEGATIVE_THRESHOLD = 0.35`).
- **Max length 256:** Most IMDB reviews fit. Longer truncates the tail; sentiment is usually established by token 256.

## Expected results

A successful run produces:

- **Test accuracy:** 0.90–0.93
- **Weighted F1:** 0.90–0.93
- **Per-class F1:** ≥ 0.89 for both classes
- **Training time:** 35–55 min on T4

If your numbers are below this, something is wrong — check the eval cell output for label distribution.

## Troubleshooting

| Problem | Fix |
|---|---|
| `RuntimeError: CUDA out of memory` | Lower `batch_size` to 8 in `CONFIG` |
| Colab disconnects mid-training | The Trainer saves a checkpoint per epoch; re-run from "Resume from checkpoint" cell |
| `metrics.json` download fails | Right-click `metrics.json` in Colab's Files pane → Download |
| HF push fails with 403 | Token isn't `write` scope or `HF_TOKEN` secret not enabled for this notebook |

## Next phases

Phase 1 (this folder) only produces the model + metrics. The rest of the pipeline:

- **Phase 2 (#6):** Push model to HF Hub, document `download_model.sh`
- **Phase 3 (#7):** FastAPI sidecar that loads the model and exposes `/predict`
- **Phase 4 (#8):** Hono switches from simulator to FastAPI client
- **Phase 5 (#9):** ModelMetricsPage reads `metrics.json` instead of mock data
- **Phase 6 (#10):** Tests + cross-stack docs

"""Build train_distilbert.ipynb from inline cell content.

Run from repo root:
    python3 ml/scripts/build_notebook.py

Idempotent: overwrites ml/train_distilbert.ipynb every time.
"""

import json
from pathlib import Path

cells = []


def md(text: str) -> None:
    cells.append({
        "cell_type": "markdown",
        "metadata": {},
        "source": text.splitlines(keepends=True),
    })


def code(text: str) -> None:
    cells.append({
        "cell_type": "code",
        "metadata": {},
        "execution_count": None,
        "outputs": [],
        "source": text.splitlines(keepends=True),
    })


md("""# CineSentiment — DistilBERT Fine-tuning on IMDB

Fine-tunes `distilbert-base-uncased` on the IMDB 50k reviews dataset and produces:

- `model/` — saved weights + tokenizer (also pushed to HF Hub if `HF_TOKEN` is set)
- `metrics.json` — accuracy, F1, confusion matrix, top words

**Before you run anything:**
1. `Runtime → Change runtime type → T4 GPU` (verify in cell 2)
2. Optional: add an `HF_TOKEN` Colab secret (🔑 sidebar) to push the model to Hugging Face Hub at the end

Expected total runtime on a free T4: **45–75 minutes**.
""")


code("""!pip install -q transformers==4.44.2 datasets==3.0.0 accelerate==0.34.2 evaluate==0.4.3 scikit-learn==1.5.2 huggingface_hub==0.25.1
""")


code("""import torch

print(f"CUDA available: {torch.cuda.is_available()}")
if torch.cuda.is_available():
    print(f"Device: {torch.cuda.get_device_name(0)}")
    print(f"VRAM:   {torch.cuda.get_device_properties(0).total_memory / 1e9:.1f} GB")
else:
    print("WARNING: No GPU detected. Training will take 24+ hours on CPU.")
    print("Go to Runtime → Change runtime type → T4 GPU.")
""")


code("""import json
import random
import time
from datetime import datetime, timezone
from pathlib import Path

import numpy as np
import matplotlib.pyplot as plt
from datasets import load_dataset
from sklearn.feature_extraction.text import TfidfVectorizer
from sklearn.metrics import (
    accuracy_score,
    confusion_matrix,
    precision_recall_fscore_support,
)
from transformers import (
    AutoModelForSequenceClassification,
    AutoTokenizer,
    DataCollatorWithPadding,
    Trainer,
    TrainingArguments,
)
""")


md("""## 1. Configuration

Centralized hyperparameters. Tweak `batch_size` down to 8 if you hit OOM.
""")


code("""CONFIG = {
    "model_name":     "distilbert-base-uncased",
    "max_length":     256,
    "batch_size":     16,
    "learning_rate":  2e-5,
    "epochs":         3,
    "weight_decay":   0.01,
    "seed":           42,
    "output_dir":     "model",
    "checkpoint_dir": "checkpoints",
    "labels":         ["negative", "positive"],
}

random.seed(CONFIG["seed"])
np.random.seed(CONFIG["seed"])
torch.manual_seed(CONFIG["seed"])
if torch.cuda.is_available():
    torch.cuda.manual_seed_all(CONFIG["seed"])

print(json.dumps(CONFIG, indent=2))
""")


md("""## 2. Load IMDB

The dataset is 25k train + 25k test, balanced 50/50 between positive (label=1) and negative (label=0). First load downloads ~80 MB.
""")


code("""raw = load_dataset("imdb")
print(raw)
print("\\nSample review:")
print(raw["train"][0]["text"][:300], "...")
print("Label:", raw["train"][0]["label"])
""")


md("""## 3. Tokenize

DistilBERT WordPiece tokenizer. Max length 256 covers ~99% of IMDB reviews; longer ones get truncated.
""")


code("""tokenizer = AutoTokenizer.from_pretrained(CONFIG["model_name"])


def tokenize_fn(batch):
    return tokenizer(
        batch["text"],
        truncation=True,
        max_length=CONFIG["max_length"],
    )


tokenized = raw.map(tokenize_fn, batched=True, remove_columns=["text"])
data_collator = DataCollatorWithPadding(tokenizer=tokenizer)

print(tokenized)
""")


md("""## 4. Model + Trainer

Sequence classification head on DistilBERT, 2 output classes.
""")


code("""model = AutoModelForSequenceClassification.from_pretrained(
    CONFIG["model_name"],
    num_labels=2,
    id2label={0: "negative", 1: "positive"},
    label2id={"negative": 0, "positive": 1},
)
""")


code("""def compute_metrics(eval_pred):
    logits, labels = eval_pred
    preds = np.argmax(logits, axis=-1)
    accuracy = accuracy_score(labels, preds)
    precision, recall, f1, _ = precision_recall_fscore_support(
        labels, preds, average="weighted", zero_division=0
    )
    return {
        "accuracy":  accuracy,
        "f1":        f1,
        "precision": precision,
        "recall":    recall,
    }


training_args = TrainingArguments(
    output_dir=CONFIG["checkpoint_dir"],
    num_train_epochs=CONFIG["epochs"],
    per_device_train_batch_size=CONFIG["batch_size"],
    per_device_eval_batch_size=CONFIG["batch_size"] * 2,
    learning_rate=CONFIG["learning_rate"],
    weight_decay=CONFIG["weight_decay"],
    eval_strategy="epoch",
    save_strategy="epoch",
    logging_strategy="steps",
    logging_steps=200,
    load_best_model_at_end=True,
    metric_for_best_model="f1",
    greater_is_better=True,
    save_total_limit=2,
    seed=CONFIG["seed"],
    report_to="none",
    fp16=torch.cuda.is_available(),
)

trainer = Trainer(
    model=model,
    args=training_args,
    train_dataset=tokenized["train"],
    eval_dataset=tokenized["test"],
    tokenizer=tokenizer,
    data_collator=data_collator,
    compute_metrics=compute_metrics,
)
""")


md("""## 5. Train

This is the slow part — **35–55 minutes on a T4**. The Trainer logs loss every 200 steps and evaluates after each epoch. Best checkpoint by F1 is automatically reloaded at the end.
""")


code("""start = time.time()
train_result = trainer.train()
training_time_seconds = time.time() - start

print(f"\\nTraining complete in {training_time_seconds / 60:.1f} minutes")
print(f"Final training loss: {train_result.training_loss:.4f}")
""")


md("""## 6. Evaluate on test set

Re-run prediction on the full test set so we capture the per-class breakdown the rest of the stack consumes.
""")


code("""predictions = trainer.predict(tokenized["test"])
y_true = predictions.label_ids
y_pred = np.argmax(predictions.predictions, axis=-1)

accuracy = accuracy_score(y_true, y_pred)
precision, recall, f1, support = precision_recall_fscore_support(
    y_true, y_pred, labels=[0, 1], zero_division=0
)
weighted_p, weighted_r, weighted_f1, _ = precision_recall_fscore_support(
    y_true, y_pred, average="weighted", zero_division=0
)
cm = confusion_matrix(y_true, y_pred, labels=[0, 1])

class_metrics = [
    {
        "label":     CONFIG["labels"][i],
        "precision": float(precision[i]),
        "recall":    float(recall[i]),
        "f1":        float(f1[i]),
        "support":   int(support[i]),
    }
    for i in range(2)
]

print(f"Accuracy:    {accuracy:.4f}")
print(f"Weighted F1: {weighted_f1:.4f}")
print()
for m in class_metrics:
    print(f"  {m['label']:9s}  P={m['precision']:.3f}  R={m['recall']:.3f}  F1={m['f1']:.3f}  n={m['support']}")
print()
print("Confusion matrix [rows=actual, cols=predicted]:")
print(f"          {CONFIG['labels'][0]:>9s}  {CONFIG['labels'][1]:>9s}")
for i, row in enumerate(cm):
    print(f"  {CONFIG['labels'][i]:9s}  {row[0]:9d}  {row[1]:9d}")
""")


code("""fig, ax = plt.subplots(figsize=(5, 5))
im = ax.imshow(cm, cmap="Blues")
ax.set_xticks([0, 1], CONFIG["labels"])
ax.set_yticks([0, 1], CONFIG["labels"])
ax.set_xlabel("Predicted")
ax.set_ylabel("Actual")
ax.set_title(f"Confusion Matrix (accuracy = {accuracy:.3f})")
for i in range(2):
    for j in range(2):
        ax.text(
            j, i, str(cm[i][j]),
            ha="center", va="center",
            color="white" if cm[i][j] > cm.max() / 2 else "black",
            fontsize=14,
        )
fig.colorbar(im)
plt.tight_layout()
plt.show()
""")


md("""## 7. TF-IDF top words per class

Corpus-level signal: which words are most distinctive for positive vs. negative reviews? Used by `TopWordsPanel` in the UI (Phase 5).
""")


code("""train_texts = raw["train"]["text"]
train_labels_arr = np.array(raw["train"]["label"])

vectorizer = TfidfVectorizer(
    max_features=20000,
    ngram_range=(1, 1),
    stop_words="english",
    min_df=10,
    sublinear_tf=True,
)
tfidf = vectorizer.fit_transform(train_texts)
vocab = np.array(vectorizer.get_feature_names_out())

mean_pos = np.asarray(tfidf[train_labels_arr == 1].mean(axis=0)).flatten()
mean_neg = np.asarray(tfidf[train_labels_arr == 0].mean(axis=0)).flatten()

diff_pos = mean_pos - mean_neg
diff_neg = mean_neg - mean_pos

TOP_N = 15
top_pos_idx = np.argsort(diff_pos)[::-1][:TOP_N]
top_neg_idx = np.argsort(diff_neg)[::-1][:TOP_N]

top_words = {
    "positive": [
        {"word": str(vocab[i]), "score": float(diff_pos[i])}
        for i in top_pos_idx
    ],
    "negative": [
        {"word": str(vocab[i]), "score": float(diff_neg[i])}
        for i in top_neg_idx
    ],
}

print("Top POSITIVE words:")
for w in top_words["positive"]:
    print(f"  {w['word']:20s}  {w['score']:.4f}")
print("\\nTop NEGATIVE words:")
for w in top_words["negative"]:
    print(f"  {w['word']:20s}  {w['score']:.4f}")
""")


md("""## 8. Save `metrics.json`

This file is **the contract** between the trained model and the rest of the stack. It mirrors the existing `ModelMetricsDTO` shape so Phase 5 only needs to swap the data source.
""")


code("""metrics_payload = {
    "model": {
        "base":                  CONFIG["model_name"],
        "trained_on":            "imdb",
        "num_labels":            2,
        "labels":                CONFIG["labels"],
        "max_length":            CONFIG["max_length"],
        "epochs":                CONFIG["epochs"],
        "batch_size":            CONFIG["batch_size"],
        "learning_rate":         CONFIG["learning_rate"],
        "trained_at":            datetime.now(timezone.utc).isoformat(),
        "training_time_seconds": round(training_time_seconds, 1),
    },
    "eval": {
        "accuracy":          float(accuracy),
        "weightedF1":        float(weighted_f1),
        "weightedPrecision": float(weighted_p),
        "weightedRecall":    float(weighted_r),
        "sampleSize":        int(len(y_true)),
        "totalReviews":      int(len(y_true)),
        "classMetrics":      class_metrics,
        "confusionMatrix": {
            "matrix": cm.tolist(),
            "labels": CONFIG["labels"],
        },
    },
    "topWords": top_words,
}

with open("metrics.json", "w") as f:
    json.dump(metrics_payload, f, indent=2)

print("Wrote metrics.json")
print(json.dumps(metrics_payload["eval"], indent=2))
""")


code("""# Auto-download metrics.json to your local machine.
# After download, move it to ml/metrics.json in the repo and commit.
from google.colab import files

files.download("metrics.json")
""")


md("""## 9. Save model locally

The Trainer already saved checkpoints during training. This cell consolidates the best checkpoint into a single `model/` directory.
""")


code("""output_path = Path(CONFIG["output_dir"])
output_path.mkdir(exist_ok=True)

trainer.save_model(str(output_path))
tokenizer.save_pretrained(str(output_path))

print(f"Model saved to {output_path.resolve()}")
print("Files:", sorted(p.name for p in output_path.iterdir()))
""")


md("""## 10. Push to Hugging Face Hub (optional)

Reads `HF_TOKEN` from Colab secrets. Skipped automatically if not set.

The model goes to a **private** repo so you control access.
""")


code("""HF_REPO = "ethsmaa/cinesentiment-distilbert-imdb"

hf_token = None
try:
    from google.colab import userdata
    hf_token = userdata.get("HF_TOKEN")
except Exception:
    import os
    hf_token = os.environ.get("HF_TOKEN")

if not hf_token:
    print("HF_TOKEN not set — skipping push.")
    print("To push: add HF_TOKEN via the 🔑 sidebar (Colab secrets) and re-run this cell.")
else:
    from huggingface_hub import HfApi, login

    login(token=hf_token, add_to_git_credential=False)
    api = HfApi()
    api.create_repo(HF_REPO, private=True, exist_ok=True)

    trainer.model.push_to_hub(HF_REPO, private=True)
    tokenizer.push_to_hub(HF_REPO, private=True)

    api.upload_file(
        path_or_fileobj="metrics.json",
        path_in_repo="metrics.json",
        repo_id=HF_REPO,
    )
    print(f"Pushed to https://huggingface.co/{HF_REPO}")
""")


md("""## Done

Phase 1 deliverables:

1. ✅ `metrics.json` — downloaded; move to `ml/metrics.json` in the repo and commit
2. ✅ `model/` — saved in this Colab session (lost when session ends)
3. ✅ Pushed to `ethsmaa/cinesentiment-distilbert-imdb` if `HF_TOKEN` was set

Phase 2 (issue #6) downloads the model from HF Hub into the FastAPI service.

You can close this notebook now.
""")


notebook = {
    "cells": cells,
    "metadata": {
        "accelerator": "GPU",
        "colab": {
            "gpuType":    "T4",
            "provenance": [],
        },
        "kernelspec": {
            "display_name": "Python 3",
            "language":     "python",
            "name":         "python3",
        },
        "language_info": {
            "name": "python",
        },
    },
    "nbformat":       4,
    "nbformat_minor": 0,
}


out_path = Path(__file__).resolve().parent.parent / "train_distilbert.ipynb"
out_path.write_text(json.dumps(notebook, indent=1) + "\n")
print(f"Wrote {out_path} ({len(cells)} cells)")

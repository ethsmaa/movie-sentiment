# PART 5 — Implementation

> Plain text. 7 sub-sections. Two screenshots suggested.

---

WORD HEADING 1: 4. Implementation

---

WORD HEADING 2: 4.1 Dataset

We use the IMDB Large Movie Review Dataset (Maas et al., 2011), which contains 50,000 reviews divided equally into 25,000 training reviews and 25,000 test reviews. Both splits are balanced: 50 percent positive and 50 percent negative. Reviews vary in length from a single sentence to several paragraphs.

We tokenize the text using DistilBERT's WordPiece tokenizer with a maximum sequence length of 256 tokens. This length keeps over 90 percent of reviews un-truncated while keeping memory use small enough to train on a single T4 GPU.

---

📸 Screenshot suggestion for this section:

Take a screenshot of REEL ONE — THE DATA section on the http://localhost:5173/the-model page. It shows the IMDB dataset card with sample positive and negative reviews.

Caption: Figure 4: IMDB 50k dataset card on the Model page.

---

WORD HEADING 2: 4.2 Model and Training Configuration

The base model is distilbert-base-uncased (Sanh et al., 2019). It is a 6-layer transformer encoder with 12 attention heads and 66 million parameters, pre-trained on English Wikipedia and the BookCorpus. We add a single linear classification head on top of the [CLS] token to produce two output values for the binary positive and negative task.

The training hyperparameters are listed in the table below. We did not run any hyperparameter search; we only verified that the validation loss decreased smoothly across all three epochs. (Paste this as a Word table.)

| Hyperparameter             | Value                                  |
| -------------------------- | -------------------------------------- |
| Base model                 | distilbert-base-uncased                |
| Number of labels           | 2 (negative, positive)                 |
| Maximum sequence length    | 256 tokens                             |
| Epochs                     | 3                                      |
| Per-device batch size      | 16                                     |
| Learning rate              | 2e-5                                   |
| Optimizer                  | AdamW (default)                        |
| Mixed precision            | FP16                                   |
| Hardware                   | NVIDIA T4 (Google Colab)               |
| Total training time        | 858.6 seconds (~14.3 minutes)          |

After training, the notebook pushes the trained weights to the Hugging Face Hub. It also writes a full evaluation report — accuracy, weighted precision, recall, F1, per-class metrics, and the confusion matrix — into the file ml/metrics.json. This same JSON file is committed to the repository and read by the application server, so the numbers shown in the user interface are exactly the numbers reported by the training run.

---

WORD HEADING 2: 4.3 Inference Service

The FastAPI sidecar (services/sentiment) is a thin wrapper around the Hugging Face AutoModelForSequenceClassification class. On startup, it does three things:

1. Reads the configuration values HF_REPO_ID, MODEL_DIR, and DEVICE from the environment.
2. Loads the tokenizer and model into the chosen device. The selection order is CUDA first, then Apple MPS for Apple Silicon Macs, and finally CPU as a last resort.
3. Runs one warm-up forward pass with a dummy input.

The HTTP interface is intentionally small. There are only three endpoints:

- GET /health returns the model status, the device in use, and the uptime.
- POST /predict takes a single text and returns label, confidence, p_positive, and p_negative.
- POST /predict/batch takes up to 64 texts at once and returns a list of predictions.

---

WORD HEADING 2: 4.4 Three-Class Threshold Mapping

The trained model is binary, but the user interface needs three classes (positive, neutral, negative). Instead of training a new 3-class model on a hand-labelled neutral dataset (which would have introduced our own labelling bias), we derive the neutral class from the binary positive probability p+ using a confidence threshold:

- If p+ is greater than or equal to 0.65, the prediction is positive.
- If p+ is less than or equal to 0.35, the prediction is negative.
- Otherwise, the prediction is neutral.

This is clearly a heuristic, not a learned classifier. We say so explicitly both in the source code and in the in-app model card. The threshold values (0.65 and 0.35) were chosen so that the neutral bucket contains the model's least confident predictions, which is exactly where real ambiguity tends to appear.

---

📸 Screenshot suggestion for this section (optional):

Take a screenshot of REEL FOUR — DIRECTOR'S COMMENTARY on the Model page. It explains the threshold mapping decision in plain language as a Q&A card.

Caption: Figure 5: Threshold mapping rationale shown as a director's commentary card.

---

WORD HEADING 2: 4.5 Strict Mode

Early in the development, we noticed that when the FastAPI sidecar was unreachable, the application server quietly fell back to a simple lexicon-based method (it just looked for positive or negative words in the text). This was useful for local development, but it is not acceptable for an academic project: every prediction shown in the interface must really come from the trained model.

To fix this, we added an environment variable BERT_STRICT (default value: true). When BERT_STRICT is true, an unreachable FastAPI sidecar produces a clear, immediate error instead of a quiet fallback. The lexicon method is kept only for the unit-test harness (where deterministic offline behaviour is useful) and is enabled only by setting BERT_STRICT to false.

As a result, every analysis stored in the database carries the model version distilbert-imdb-v1. We confirmed this by running a SQL aggregation against the production database after re-analysing all 30 movies in the catalogue.

---

WORD HEADING 2: 4.6 Persistence and Caching

The application server uses Prisma over PostgreSQL with a small four-table schema:

- movies — basic information about each film.
- reviews — individual user reviews attached to a movie.
- sentiment_analyses — the per-review prediction (label, confidence, model version).
- movie_sentiment_summaries — pre-computed aggregates for fast page loads.

The first three tables are populated during seeding from a curated catalogue of 30 critically acclaimed films (for example, The Shawshank Redemption, Parasite, Spirited Away). Each film has between 8 and 25 hand-collected user reviews, totalling 346 reviews.

The fourth table caches per-movie aggregates. This means that when a user opens a film page, the system does not need to re-run inference for every review every time. A re-analysis script (apps/api/scripts/reanalyze-movie.ts) runs every review through the model again whenever needed; under strict mode this script will fail loudly if the FastAPI sidecar is not reachable, which is the desired behaviour.

---

WORD HEADING 2: 4.7 Frontend

The React frontend is a single-page application built with Vite and Tailwind CSS. We deliberately chose a "video-club paper" visual style — paper-coloured backgrounds, serif and display fonts — to keep the visual focus on the data rather than on decorative chrome. The main screens of the application are:

- Catalogue. A grid of films showing poster, title, year, and overall hype score.
- Movie detail. A per-film dashboard with the hype meter, sentiment distribution chart, confidence gauge, and the top positive and top negative review cards (with per-word lexicon highlighting).
- Analyser. A free-form input field where the user can type any sentence and get a live prediction. The page also shows a token-by-token playback of the model's prediction trajectory.
- Model metrics. A page that shows the accuracy, weighted F1, per-class precision and recall, and the confusion matrix, all read directly from ml/metrics.json through the application server.
- The Model. A methodology page that documents the dataset, the architecture, the training hyperparameters, and the threshold mapping in a lab-sheet style.

---

When you finish pasting Part 5 into Word, say "devam" for Part 6 (Results and Discussion — this includes the main accuracy numbers and the confusion matrix table).

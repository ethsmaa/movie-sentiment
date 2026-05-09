# CineSentiment: A Fine-Tuned DistilBERT Pipeline for Movie Review Sentiment Analysis

**CMP 4418 — Final Project Report**

**Authors:** Esma Oruç (2022510140), Ayan Abasova (2022510014)

**Date:** May 2026

---

## Abstract

This report presents **CineSentiment**, an end-to-end sentiment analysis platform for movie reviews built around a fine-tuned DistilBERT classifier. The model was trained on the IMDB 50k labelled reviews dataset for three epochs on a Google Colab T4 GPU, achieving a test accuracy of **0.9151** and a weighted F1-score of **0.9151**. The trained weights are hosted on the Hugging Face Hub and consumed at inference time by a Python FastAPI service, which is in turn invoked over HTTP by a TypeScript Hono + tRPC backend behind a React user interface. We document the deviation from our original Assignment Part 1 plan — which targeted live Twitter (X) data — and the rationale for pivoting to the IMDB benchmark, namely access restrictions imposed on the Twitter API after 2024 and the absence of ground-truth labels in raw streamed tweets. Beyond reporting the standard quantitative metrics (accuracy, F1, per-class precision/recall, confusion matrix), we discuss the engineering safeguards that guarantee every prediction surfaced through the user interface is produced by the trained transformer rather than by a fallback heuristic.

---

## Table of Contents

1. [Introduction](#1-introduction)
2. [Literature Review (Summary)](#2-literature-review-summary)
3. [Project Definition](#3-project-definition)
4. [Implementation](#4-implementation)
5. [Results and Discussion](#5-results-and-discussion)
6. [Conclusion](#6-conclusion)
7. [References](#7-references)

---

## 1. Introduction

Public sentiment toward films is one of the most studied open problems in opinion mining, both because labelled corpora are widely available and because the domain combines challenges typical of natural language understanding: subjective tone, sarcasm, comparative statements, and a long-tail vocabulary of titles, actors, and genres.

Our project takes the following stance: rather than treat sentiment classification as an isolated notebook experiment, we build a small but realistic deployment around it. The model is trained, versioned on a public model registry, served as a stand-alone microservice, consumed by a typed application server, and visualized in an interactive web interface. Each layer is built with the tooling that a real production system would use, so that the academic exercise also surfaces the practical concerns of moving a deep learning artifact from a notebook to a running service.

### 1.1 Pivot from Twitter to IMDB

In Assignment Part 1, we proposed to compare three movies using a live stream of Twitter (X) sentiment. During implementation we encountered two structural obstacles. First, Twitter's free API tier was retired in early 2023, and the paid Basic tier (USD 100/month) is incompatible with an undergraduate timeline. Second, raw tweets carry no ground-truth labels, which would have forced us to either label tweets manually (introducing rater variance) or trust a third-party labelling service (introducing an opaque oracle).

We therefore pivoted to the IMDB 50k movie reviews benchmark of Maas et al. (2011), which provides 25,000 train and 25,000 test reviews with balanced binary labels. The pivot keeps the high-level objective intact — fine-grained sentiment analysis of free-form film commentary — while substituting a noisy, unlabelled stream with a curated benchmark. The implication is that our reported metrics are directly comparable with prior work on IMDB, and our model's confidence scores are calibrated against a ground truth.

### 1.2 Contributions

The contributions of this work are:

- A fine-tuned DistilBERT checkpoint for movie sentiment, published on the Hugging Face Hub at `huggingface.co/ethsmaa/cinesentiment-distilbert-imdb`.
- A FastAPI inference service that loads the checkpoint on startup and exposes a typed JSON interface for single and batch prediction, including a hardware-aware backend selection (CUDA → MPS → CPU).
- A TypeScript application server (Hono + tRPC) that bridges the binary IMDB labels to a 3-class taxonomy (positive / neutral / negative) through a confidence-band threshold and persists the resulting analyses in PostgreSQL.
- A React + Vite frontend with two complementary interaction modes: pre-computed sentiment dashboards for catalogue movies, and a free-form analyser that issues a live request to the model on every input.
- A *strict mode* guarantee that the application refuses to fall back to any heuristic stand-in when the model service is unreachable, eliminating silent regressions in displayed sentiment.

### 1.3 Document Structure

Section 2 briefly summarizes the literature review submitted in Assignment Part 1 and indicates how the present implementation realizes its conclusions. Section 3 defines the project: its aim, modules, data flow, and tech stack. Section 4 reports the implementation details that warrant being recorded for reproducibility. Section 5 presents quantitative and qualitative results. Section 6 concludes and lists future work.

---

## 2. Literature Review (Summary)

A detailed literature review accompanied this project as Assignment Part 1. We restate only the conclusions that directly informed the present implementation.

### 2.1 From Shallow to Transformer-Based Sentiment Analysis

Yadav and Vishwakarma (2020) survey the trajectory of sentiment models from Naïve Bayes and Support Vector Machines, through CNN- and LSTM-based deep architectures, to attention-based transformer models. They report consistent gains as models acquire the ability to represent bidirectional context. Albladi et al. (2025) reach the same conclusion in a more recent IEEE Access review specifically focused on Twitter data, identifying transformer encoders as the current state of the art on noisy short-text inputs.

### 2.2 Why DistilBERT

Sanh et al. (2019) introduce DistilBERT as a 40%-smaller, 60%-faster distillation of BERT (Devlin et al., 2019) that retains roughly 97% of the teacher's downstream performance. Both the original BERT paper (Devlin et al., 2019) and Vaswani et al. (2017) establish the architectural foundations: multi-head self-attention, positional encoding, and a deep stack of identical encoder layers. Chintalapudi et al. (2021) demonstrate that BERT-class models reach ≥ 90% accuracy on Twitter sentiment with comparatively modest fine-tuning effort, and Tan et al. (2022) report further gains by composing transformers with recurrent layers, suggesting that the family of attention-based encoders has become the default rather than an experimental option.

### 2.3 Implementation Implications

The literature points uniformly to a fine-tuned DistilBERT as the most cost-effective starting point: the latency profile is compatible with interactive web requests on commodity hardware, the parameter count fits comfortably in 2–4 GB of GPU memory, and the published benchmarks on IMDB and SST-2 sit in the same accuracy band as the larger BERT-base. Our implementation choices in Section 3 follow this guidance directly.

---

## 3. Project Definition

### 3.1 Aim

CineSentiment aims to convert unstructured movie commentary into structured sentiment signals that can be inspected, sliced, and explored by a human user. Concretely, the system answers the following questions for any movie in its catalogue:

- What fraction of reviews are positive, negative, or neutral?
- How confident is the model in each individual prediction?
- Which words in a review carry the polarity signal?
- What is the aggregate "hype score" for the movie, expressed on a [-1, +1] scale derived from the class distribution?

It also exposes a free-form analyser where a user can type any sentence and obtain a prediction in real time, bypassing the catalogue entirely.

### 3.2 Functional Requirements

We organize functionality along four axes:

1. **Modelling.** Fine-tune a pretrained transformer on a labelled review corpus and persist the resulting weights in a versioned registry.
2. **Serving.** Expose the trained model behind a stable HTTP interface with single and batch endpoints and a health probe.
3. **Application.** Wrap the inference service in a typed application server that handles input validation, threshold mapping, persistence, and caching.
4. **Visualization.** Render the analyses through an accessible web user interface that distinguishes pre-computed catalogue analyses from live single-shot inferences.

### 3.3 System Architecture

The four layers of the system and the data flow between them are summarized below:

```
  ┌──────────────────┐      ┌──────────────────────┐      ┌───────────────────┐
  │   TRAIN          │      │   STORE              │      │   SERVE           │
  │ Google Colab     │ ───▶ │ Hugging Face Hub     │ ───▶ │ FastAPI Sidecar   │
  │ T4 GPU · ~14 min │      │ cinesentiment-       │      │ Apple MPS · ~50ms │
  │ 3 epochs         │      │ distilbert-imdb      │      │ port 8001         │
  └──────────────────┘      └──────────────────────┘      └───────────┬───────┘
                                                                       │
                                                                       │ HTTP
                                                                       ▼
                                                         ┌──────────────────────┐
                                                         │   CONSUME            │
                                                         │ Hono API + tRPC      │
                                                         │ port 3001            │
                                                         └───────────┬──────────┘
                                                                     │
                                              ┌──────────────────────┴──────┐
                                              ▼                             ▼
                                      ┌────────────────┐            ┌────────────────┐
                                      │ PostgreSQL     │            │ React + Vite   │
                                      │ (cache + data) │            │ port 5173      │
                                      └────────────────┘            └────────────────┘
```

Training, hosting, serving, and consumption are deliberately separated so that each layer can be replaced independently.

### 3.4 Modules

| Module             | Technology                                                  | Responsibility                                                                  |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Training notebook  | Python, PyTorch, Hugging Face Transformers                  | Fine-tune DistilBERT on IMDB; emit weights and evaluation metrics.              |
| Model registry     | Hugging Face Hub                                            | Versioned, public hosting of the trained checkpoint.                            |
| Inference sidecar  | Python, FastAPI, Uvicorn, PyTorch                           | Load the checkpoint at startup, expose `/predict`, `/predict/batch`, `/health`. |
| Application server | TypeScript, Hono, tRPC, Zod, Prisma                         | Validate input, map binary → 3-class, persist analyses, cache, enforce strict mode. |
| Database           | PostgreSQL 16, Prisma                                       | Persist movies, reviews, sentiment analyses, summaries.                         |
| Frontend           | TypeScript, React, Vite, Tailwind, Zustand, tRPC client     | Render catalogue, analysis dashboards, model card, free-form analyser.          |
| Test suite         | Vitest, React Testing Library, Playwright, pytest           | 108 unit/component tests across the workspace + HTTP-level FastAPI tests.       |

### 3.5 Data Flow

Request lifecycle for a catalogue movie:

```
1. User selects movie → 2. UI calls tRPC → 3. API checks cache
                                             │
                                             ├─ Cache hit:  return DTO
                                             │
                                             └─ Cache miss: batch reviews
                                                              │
                                                              ▼
                                                4. POST FastAPI /predict/batch
                                                              │
                                                              ▼
                                                5. Tokenize → DistilBERT forward pass
                                                              │
                                                              ▼
                                                6. Map binary → 3-class threshold
                                                              │
                                                              ▼
                                                7. Persist + return DTO
```

The free-form analyser follows the same pipeline but skips the cache and persistence steps.

---

## 4. Implementation

### 4.1 Dataset

We use the IMDB Large Movie Review Dataset (Maas et al., 2011), which comprises 50,000 reviews split evenly into a 25,000-review training set and a 25,000-review test set. Each split is balanced (50% positive, 50% negative). Reviews vary in length from a single sentence to several paragraphs; we apply DistilBERT's WordPiece tokenizer with a maximum sequence length of 256 tokens, which empirically captures over 90% of reviews without truncation while keeping memory usage tractable on a single T4 GPU.

### 4.2 Model and Training Configuration

The model is `distilbert-base-uncased` (Sanh et al., 2019), a 6-layer, 12-head, 66M-parameter transformer encoder pretrained on English Wikipedia and the BookCorpus. We attach a single linear classification head on top of the `[CLS]` token to produce two logits for the binary positive / negative task.

Training hyperparameters:

| Hyperparameter             | Value                                  |
| -------------------------- | -------------------------------------- |
| Base model                 | `distilbert-base-uncased`              |
| Number of labels           | 2 (negative, positive)                 |
| Maximum sequence length    | 256 tokens                             |
| Epochs                     | 3                                      |
| Per-device batch size      | 16                                     |
| Learning rate              | 2 × 10⁻⁵                               |
| Optimizer                  | AdamW (default)                        |
| Mixed precision            | FP16                                   |
| Hardware                   | NVIDIA T4 (Google Colab)               |
| Wall-clock training time   | 858.6 s (≈ 14.3 minutes)               |

Hyperparameters are intentionally close to the defaults recommended in the Hugging Face Transformers library (Wolf et al., 2020); we did not perform hyperparameter search beyond verifying that the validation loss decreased monotonically across epochs.

After training, the notebook pushes the weights to the Hugging Face Hub and dumps an evaluation report — accuracy, weighted precision/recall/F1, per-class metrics, and the confusion matrix — to `ml/metrics.json`. The same JSON file is then committed to the repository and consumed by the application server to power the in-app model metrics page, ensuring the values shown in the user interface are exactly the values reported by the training run.

### 4.3 Inference Service

The FastAPI sidecar (`services/sentiment`) is a thin wrapper around the Hugging Face `AutoModelForSequenceClassification` class. On startup it (i) reads `HF_REPO_ID`, `MODEL_DIR`, and `DEVICE` from the environment, (ii) loads the tokenizer and model into the selected device (CUDA, then MPS on Apple Silicon, then CPU as a final fallback), and (iii) warms the pipeline with a single dummy forward pass.

The HTTP surface is intentionally small:

- `GET /health` — liveness, model load status, device, uptime.
- `POST /predict` — single-text prediction; returns `label`, `confidence`, `p_positive`, `p_negative`.
- `POST /predict/batch` — bounded-batch prediction (max 64 texts) using the same tokenizer pipeline.

### 4.4 Three-Class Threshold Mapping

Although the trained model is binary, the user interface operates on three classes (positive, neutral, negative). Rather than retrain on a hand-labelled neutral set — which would have introduced our own annotator bias and overlapped poorly with IMDB's distribution — we derive the neutral bucket through a confidence-band threshold over the binary positive probability *p⁺*:

```
ŷ = positive   if p⁺ ≥ 0.65
ŷ = negative   if p⁺ ≤ 0.35
ŷ = neutral    otherwise
```

This is explicitly a heuristic, not a learned classifier, and we describe it as such both in the codebase and in the in-app *model card*. The thresholds (0.65 and 0.35) were chosen so that the neutral bucket contains the model's least confident predictions, which is where genuine ambiguity tends to concentrate in practice.

### 4.5 Strict Mode

Early in development we observed that the application server would silently fall back to a lexicon-based stand-in whenever the FastAPI sidecar was unreachable. While convenient for local development, this behaviour is unacceptable for an academic project: any prediction surfaced through the user interface should be unambiguously attributable to the trained model. We therefore added a `BERT_STRICT` environment flag (default `true`) that converts a sidecar outage into a loud, immediate error rather than a quiet fallback. The lexicon stand-in is preserved only for the unit-test harness, where deterministic offline behaviour is desirable, and is gated behind `BERT_STRICT=false`. As a consequence, every analysis persisted in the database carries the model version `distilbert-imdb-v1`; we verified this directly with a SQL aggregation against the production schema.

### 4.6 Persistence and Caching

The application server uses Prisma over PostgreSQL with a small four-table schema: `movies`, `reviews`, `sentiment_analyses`, and `movie_sentiment_summaries`. The first three tables are populated during seeding from a curated mock catalogue of 30 critically acclaimed films (e.g., *The Shawshank Redemption*, *Parasite*, *Spirited Away*) with 8–25 hand-collected user reviews each, totalling 346 reviews. The fourth table caches per-movie aggregates so that re-rendering a film page does not re-run inference.

A re-analysis script (`apps/api/scripts/reanalyze-movie.ts`) re-runs every review through the model and updates the database; under strict mode this script will fail loudly if the sidecar is not reachable, which is the desired behaviour when refreshing analyses.

### 4.7 Frontend

The React frontend is a single-page application built with Vite and Tailwind. We deliberately chose a typographic "video-club paper" aesthetic to keep visual emphasis on the data rather than on chrome. The primary screens are:

- **Catalogue.** A grid of films with poster, title, year, and aggregate hype score.
- **Movie detail.** Per-film dashboard with hype meter, distribution chart, confidence gauge, top-positive and top-negative review cards with per-word lexicon highlighting.
- **Analyser.** A free-form input that issues a live request to the model on every submission and renders a token-by-token playback of the prediction trajectory.
- **Model metrics.** Accuracy, weighted F1, per-class precision/recall, and the confusion matrix, all sourced from `ml/metrics.json` via the application server.
- **The Model.** A methodology page that documents the dataset, the architecture, the training hyperparameters, and the threshold mapping, written in the lab-sheet idiom of an academic methods section.

---

## 5. Results and Discussion

### 5.1 Quantitative Evaluation

The model's performance on the held-out IMDB test set (25,000 reviews):

| Metric              | Value      |
| ------------------- | ---------- |
| Accuracy            | 0.9151     |
| Weighted F1         | 0.9151     |
| Weighted Precision  | 0.9151     |
| Weighted Recall     | 0.9151     |
| Test set size       | 25,000     |

The accuracy of 0.9151 exceeds the 85% target laid out in Assignment Part 1 by more than six percentage points and is consistent with published DistilBERT baselines on IMDB.

Per-class breakdown:

| Class    | Precision | Recall | F1    | Support |
| -------- | --------- | ------ | ----- | ------- |
| Negative | 0.918     | 0.912  | 0.915 | 12,500  |
| Positive | 0.912     | 0.919  | 0.915 | 12,500  |

Both classes perform within a single F1 percentage point of each other, indicating that the binary classifier is well-balanced and that no further class re-weighting is warranted.

Confusion matrix:

|                       | Predicted Negative | Predicted Positive |
| --------------------- | ------------------ | ------------------ |
| **Actual Negative**   | 11,394             | 1,106              |
| **Actual Positive**   | 1,017              | 11,483             |

The confusion matrix confirms the symmetric error structure: false positives and false negatives are within 90 reviews of each other.

### 5.2 Qualitative Inspection of the 3-Class Mapping

Applying the threshold mapping to the catalogue's 346 reviews produces the per-film distributions shown in the application's hype dashboard. Aggregated across the catalogue, the distribution is approximately 70% positive, 17% neutral, and 13% negative. The neutral bucket is dominated by short reviews of the form "It was okay," "Worth a watch but not memorable," and "Mixed feelings about this one," all of which the model assigns probabilities in the [0.35, 0.65] band — behaviour that matches the linguistic intuition behind the mapping.

### 5.3 Latency

On Apple Silicon (M-series GPU, MPS backend) the median single-text inference latency is approximately 50 ms. Batch inference at the maximum batch size of 64 reviews completes in approximately 380 ms, an effective per-review cost of roughly 6 ms once warm. These numbers are well within the budgets typical of an interactive web request and confirm the practical motivation for choosing a distilled model over the full BERT-base.

### 5.4 Discussion

**The threshold mapping is the weakest link.** Our binary classifier achieves 91.5% accuracy on a held-out, labelled test set, but the 3-class output that the user actually sees is generated by a heuristic threshold. The threshold values (0.65 / 0.35) were not learned, and we have no labelled neutral set on which to evaluate them. A more principled treatment would either (a) collect a small neutral-labelled set and tune the thresholds on it, or (b) abandon the binary base and fine-tune on a 3-class corpus such as SST-5 instead. We document this limitation explicitly in the in-app model card.

**Strict mode pays off in deployment hygiene.** Switching from a permissive fallback to a strict-error model surfaced exactly one outage during the development period: a stale uvicorn process held port 8001 long enough that a fresh `pnpm dev` invocation could not bind. Without strict mode this would have silently produced lexicon-based labels for several hours of catalogue browsing. The lesson generalizes: in any pipeline that reads from a network dependency, distinguishing "unreachable" from "it returned something" should be enforced at the type level if the downstream consumer cannot tolerate degraded input.

**Reproducibility.** Every quantitative claim in this section is generated by `ml/train_distilbert.ipynb` and stored in `ml/metrics.json`. Re-running the notebook on a Colab T4 with `HF_TOKEN` configured produces a new model version, a new `metrics.json`, and a new in-app metrics dashboard without any other code changes.

---

## 6. Conclusion

We presented CineSentiment, a small but complete sentiment analysis platform organized around a fine-tuned DistilBERT classifier. The model achieves 0.9151 accuracy and 0.9151 weighted F1 on the IMDB 50k test set, surpassing the 85% target stated in our project proposal. The classifier is hosted on the Hugging Face Hub, served by a FastAPI sidecar with hardware-aware backend selection, mediated by a typed Hono + tRPC application server, and visualized through a React frontend that distinguishes pre-computed catalogue analyses from live single-shot inferences.

Beyond the metric, the project's contribution is methodological. We pivoted publicly from the original Twitter (X) plan to the IMDB benchmark, justifying the change by reference to data labelling concerns rather than convenience. We made the academic integrity of the predictions an explicit engineering concern by introducing strict-mode enforcement against silent fallbacks, and we surfaced the binary-to-three-class mapping in plain language inside the application itself rather than burying it in code.

### 6.1 Limitations

The system is English-only, the catalogue is small (30 movies, 346 reviews), the threshold mapping is a heuristic rather than a learned classifier, and the sidecar runs on a single host without horizontal scaling.

### 6.2 Future Work

Three directions seem promising:

1. Fine-tuning a 3-class model on a corpus that natively carries a neutral label (SST-5 or GoEmotions reduced to valence) would replace the threshold heuristic with a learned decision boundary.
2. The pivot to IMDB does not preclude returning to social-media data: with a paid Twitter API key or an alternative such as Reddit `r/movies`, the same inference service could ingest live commentary and produce time-series dashboards similar to those sketched in Assignment Part 1.
3. Deploying the FastAPI sidecar to a managed inference platform (Hugging Face Inference Endpoints, Modal, or Replicate) would remove the local-host coupling and enable multi-user evaluation.

---

## 7. References

Albladi, A., Islam, M., & Seals, C. (2025). Sentiment Analysis of Twitter Data Using NLP Models: A Comprehensive Review. *IEEE Access*, PP, 1–1. https://doi.org/10.1109/ACCESS.2025.3541494

Chintalapudi, N., Battineni, G., & Amenta, F. (2021). Sentiment Analysis of Twitter Data Using Bidirectional Encoder Representations from Transformers (BERT). *Scientific Reports*, 11(1), 8031.

Devlin, J., Chang, M.-W., Lee, K., & Toutanova, K. (2019). BERT: Pre-training of Deep Bidirectional Transformers for Language Understanding. In *Proceedings of NAACL-HLT 2019* (pp. 4171–4186).

Maas, A. L., Daly, R. E., Pham, P. T., Huang, D., Ng, A. Y., & Potts, C. (2011). Learning Word Vectors for Sentiment Analysis. In *Proceedings of the 49th Annual Meeting of the Association for Computational Linguistics: Human Language Technologies* (pp. 142–150). Association for Computational Linguistics.

Sanh, V., Debut, L., Chaumond, J., & Wolf, T. (2019). DistilBERT, a Distilled Version of BERT: Smaller, Faster, Cheaper and Lighter. *arXiv preprint arXiv:1910.01108*.

Tan, K. L., Lee, C.-P., Anbananthen, K., & Lim, K. M. (2022). RoBERTa-LSTM: A Hybrid Model for Sentiment Analysis with Transformers and Recurrent Neural Network. *IEEE Access*, 10, 1–1. https://doi.org/10.1109/ACCESS.2022.3152828

Vaswani, A., Shazeer, N., Parmar, N., Uszkoreit, J., Jones, L., Gomez, A. N., Kaiser, L., & Polosukhin, I. (2017). Attention Is All You Need. In *Advances in Neural Information Processing Systems* (Vol. 30).

Wolf, T., Debut, L., Sanh, V., Chaumond, J., Delangue, C., Moi, A., Cistac, P., Rault, T., Louf, R., Funtowicz, M., Davison, J., Shleifer, S., von Platen, P., Ma, C., Jernite, Y., Plu, J., Xu, C., Le Scao, T., Gugger, S., Drame, M., Lhoest, Q., & Rush, A. M. (2020). Transformers: State-of-the-Art Natural Language Processing. In *Proceedings of the 2020 Conference on Empirical Methods in Natural Language Processing: System Demonstrations* (pp. 38–45).

Yadav, A., & Vishwakarma, D. K. (2020). Sentiment Analysis Using Deep Learning Architectures: A Review. *Artificial Intelligence Review*, 53(6), 4335–4385.

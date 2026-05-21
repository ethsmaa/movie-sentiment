# PART 2 — Introduction

> Plain text only — no bold, no markdown formatting in the paragraphs.
> When you paste into Word, just apply Heading 1 / Heading 2 styles yourself.

---

WORD HEADING 1: 1. Introduction

(paste the paragraphs below under this heading)

Movie reviews are one of the most studied topics in opinion mining. Many labelled datasets are available, and the language used in reviews shows the typical challenges of natural language understanding: subjective tone, sarcasm, comparative statements, and a long list of titles, actors, and genres.

In this project, we did not want to treat sentiment classification as just a notebook experiment. Instead, we built a small but realistic system around it. The model is trained, saved on a public model registry, served as a separate microservice, used by a typed application server, and shown in an interactive web interface. Each layer was built with the kind of tools used in real production systems, so the project also shows the practical side of taking a deep learning model from a notebook into a running service.

---

WORD HEADING 2: 1.1 Pivot from Twitter to IMDB

In Assignment Part 1, we planned to compare three movies using a live stream of Twitter (X) sentiment. While building the system, we ran into two big problems. First, Twitter's free API was closed in early 2023, and the cheapest paid plan (USD 100 per month) was too expensive for a student project. Second, raw tweets do not come with sentiment labels, so we would have had to label them ourselves (which adds rater bias) or use a third-party labelling service (which we cannot fully verify).

Because of these problems, we decided to use the IMDB 50k movie reviews dataset by Maas et al. (2011) instead. This dataset has 25,000 training reviews and 25,000 test reviews, all balanced and labelled. The change keeps the main idea of the project the same — sentiment analysis of movie reviews — but replaces a noisy, unlabelled stream with a clean, well-known benchmark. As a result, our metrics can be compared with previous work on IMDB, and our model's confidence values are calibrated against real ground truth.

---

WORD HEADING 2: 1.2 Contributions

The main contributions of our project are listed below. (You can paste this as a normal bullet list in Word.)

A fine-tuned DistilBERT model for movie review sentiment, published on the Hugging Face Hub at huggingface.co/ethsmaa/cinesentiment-distilbert-imdb.

A FastAPI inference service that loads the model on startup and exposes JSON endpoints for single and batch predictions. It selects the best available hardware automatically (CUDA, then Apple MPS, then CPU).

A TypeScript application server (Hono + tRPC) that maps the model's binary output (positive / negative) into a 3-class output (positive / neutral / negative) using a confidence-based threshold, and stores the analyses in a PostgreSQL database.

A React + Vite frontend with two main modes: pre-computed sentiment dashboards for catalogue movies, and a free-form analyser that calls the model live for any input text.

A "strict mode" rule that prevents the system from silently using a backup method when the model service is unavailable. This guarantees that every result shown in the interface really comes from the trained model.

---

WORD HEADING 2: 1.3 Document Structure

Section 2 gives a short summary of the literature review we already submitted in Assignment Part 1, and explains how the conclusions in that review are reflected in our actual implementation. Section 3 defines the project: its goal, modules, data flow, and technology stack. Section 4 describes the implementation details that are needed for reproducibility. Section 5 presents the quantitative and qualitative results. Section 6 closes with the conclusion and future work.

---

📸 Screenshot suggestion (optional): a high-level architecture diagram or the home page screenshot can be placed at the end of Section 1, before Section 2 starts.

---

When you finish pasting Part 2 into Word, say "devam" for Part 3 (Literature Review summary).

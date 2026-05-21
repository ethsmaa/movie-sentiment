# PART 1 — Title Page + Abstract

> Open this file in VS Code or any text editor. Select paragraphs and paste into your Word document.

---

## Title Page (paste at the very top of the document)

CineSentiment: Movie Review Sentiment Analysis with Fine-Tuned DistilBERT

CMP 4418 — Final Project Report

Authors:
- Esma Oruç — 2022510140
- Ayan Abasova — 2022510014

Date: May 2026

---

## Abstract (paste under the title)

This report explains **CineSentiment**, a sentiment analysis system we built for movie reviews. Our system uses a fine-tuned DistilBERT model that was trained on the IMDB 50,000 reviews dataset on a Google Colab T4 GPU. After three training epochs, the model reached a test accuracy of **91.51%** and a weighted F1-score of **0.9151**. The trained model is hosted on the Hugging Face Hub and runs inside a Python FastAPI service. A TypeScript Hono + tRPC backend connects this service to a React-based web interface.

We also explain why we changed our project from live Twitter data (our original plan in Assignment Part 1) to the IMDB dataset — mainly because Twitter's API became expensive in 2024, and tweets do not come with sentiment labels for evaluation. Beyond the standard metrics (accuracy, F1, precision, recall, confusion matrix), we describe how our system makes sure every prediction shown to the user really comes from the trained model and not from a backup method.

---

## 📸 Screenshot to add here

After the abstract, leave one screenshot:

**Caption:** *Figure 1: Main interface of CineSentiment.*

Suggestion: take a screenshot of the home page (movie grid) at `http://localhost:5173`.

---

When you're done pasting Part 1 into Word, say **"devam"** to get Part 2 (Introduction).

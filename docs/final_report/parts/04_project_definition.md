# PART 4 — Project Definition

> Plain text. This is the longest section. It has 5 sub-sections.
> Take your time pasting each sub-section in order.

---

WORD HEADING 1: 3. Project Definition

---

WORD HEADING 2: 3.1 Aim

CineSentiment turns unstructured movie comments into structured sentiment data that a person can explore in a web interface. For any movie in our catalogue, the system answers four questions:

- What percentage of reviews are positive, negative, or neutral?
- How confident is the model in each prediction?
- Which words in a review carry the strongest sentiment signal?
- What is the overall "hype score" of the movie, on a scale from -1 (very negative) to +1 (very positive), based on the class distribution?

The system also has a free-form analyser, where a user can type any sentence and get a real-time sentiment prediction without going through the catalogue at all.

---

WORD HEADING 2: 3.2 Functional Requirements

We organize the project's functions into four groups:

1. Modelling. Fine-tune a pre-trained transformer on a labelled review dataset and save the resulting weights in a versioned model registry.

2. Serving. Make the trained model available through a stable HTTP interface, with single and batch prediction endpoints and a health check endpoint.

3. Application. Wrap the inference service in a typed application server that handles input validation, threshold mapping, persistence, and caching.

4. Visualization. Display the sentiment analyses in a clear web interface that separates pre-computed catalogue analyses from live one-shot predictions.

---

WORD HEADING 2: 3.3 System Architecture

The system has four main layers. The diagram below shows how they connect to each other and where the data flows.

(Paste the diagram below as a code block / monospace text in Word, OR replace it with a screenshot of the "The Model" page in our app, which shows the architecture as a visual diagram.)

```
TRAIN                STORE                  SERVE                   CONSUME
+---------+        +-------------+        +----------------+      +------------+
| Google  |        | Hugging     |        | FastAPI        |      | Hono +     |
| Colab   | -----> | Face Hub    | -----> | Sidecar        | ---> | tRPC API   |
| T4 GPU  | push   | model card  |  pull  | Apple MPS GPU  | HTTP | port 3001  |
| 14 min  |        |             |        | port 8001      |      |            |
+---------+        +-------------+        +----------------+      +-----+------+
                                                                        |
                                                  +---------------------+----------+
                                                  v                                v
                                           +---------------+                +-----------------+
                                           | PostgreSQL    |                | React + Vite UI |
                                           | (cache + data)|                | port 5173       |
                                           +---------------+                +-----------------+
```

The training, hosting, serving, and consumption layers are deliberately separated. This means each layer can be replaced independently without breaking the others. For example, we can move the FastAPI sidecar to a cloud GPU later without changing any code in the application server or the frontend.

---

📸 Screenshot suggestion for this section:

Take a screenshot of the "The Model" page in the running app at http://localhost:5173/the-model. It already shows a similar diagram in a more visual style.

Caption: Figure 2: System architecture of CineSentiment. Each layer can be replaced or scaled independently.

---

WORD HEADING 2: 3.4 Modules and Technology Stack

The system is built from the following modules. (Paste this as a Word table.)

| Module             | Technology                                                  | Responsibility                                                                  |
| ------------------ | ----------------------------------------------------------- | ------------------------------------------------------------------------------- |
| Training notebook  | Python, PyTorch, Hugging Face Transformers                  | Fine-tune DistilBERT on IMDB; save weights and evaluation metrics.              |
| Model registry     | Hugging Face Hub                                            | Version-controlled, public hosting of the trained model.                        |
| Inference sidecar  | Python, FastAPI, Uvicorn, PyTorch                           | Load the model on startup; expose /predict, /predict/batch, /health.            |
| Application server | TypeScript, Hono, tRPC, Zod, Prisma                         | Validate input, map binary to 3-class, persist results, cache, enforce strict mode. |
| Database           | PostgreSQL 16, Prisma                                       | Store movies, reviews, sentiment analyses, summaries.                           |
| Frontend           | TypeScript, React, Vite, Tailwind, Zustand, tRPC client     | Render the catalogue, dashboards, model page, and free-form analyser.           |
| Test suite         | Vitest, React Testing Library, Playwright, pytest           | 108 unit/component tests across the workspace; HTTP-level FastAPI tests.        |

---

WORD HEADING 2: 3.5 Data Flow

When a user opens a movie page, the request goes through the following steps:

1. The user clicks on a movie in the grid.
2. The React frontend calls the application server through tRPC.
3. The application server first checks if a sentiment summary is already cached in the database.
4. If yes (cache hit), it returns the cached result immediately.
5. If not (cache miss), it loads all reviews for that movie and sends them as a batch to the FastAPI sidecar.
6. The FastAPI sidecar tokenizes the reviews and runs them through DistilBERT on the GPU.
7. The application server maps the binary output (positive / negative) to 3-class output (positive / neutral / negative) using a confidence threshold.
8. The result is saved to the database and returned to the frontend.

The free-form analyser follows the same pipeline but skips the cache (step 3 to 4) and the persistence (step 8).

---

📸 Optional second screenshot for this section:

Take a screenshot of any movie detail page (for example, http://localhost:5173/movies/inception) showing the hype meter, distribution chart, and confidence gauge.

Caption: Figure 3: Movie detail page with sentiment dashboard.

---

When you finish pasting Part 4 into Word, say "devam" for Part 5 (Implementation — dataset, model, training, threshold mapping).

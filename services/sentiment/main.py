"""FastAPI sentiment analysis service.

Loads the fine-tuned DistilBERT model from `services/sentiment/model/`
(populated by `scripts/download_model.py`) and serves predictions over HTTP.

Run from the repo root:

    cd services/sentiment
    source .venv/bin/activate
    uvicorn main:app --reload --port 8000

The service exposes:
    GET  /health         — model status
    POST /predict        — single-text inference
    POST /predict/batch  — multi-text inference (preferred for review lists)
"""

from __future__ import annotations

import os
import time
from contextlib import asynccontextmanager
from pathlib import Path
from typing import List, Optional

import torch
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, ConfigDict, Field
from transformers import AutoModelForSequenceClassification, AutoTokenizer

SERVICE_DIR = Path(__file__).resolve().parent
DEFAULT_MODEL_DIR = SERVICE_DIR / "model"
DEFAULT_MODEL_ID = "ethsmaa/cinesentiment-distilbert-imdb"

LABELS = ("negative", "positive")
MAX_INPUT_TOKENS = 256
MAX_BATCH_SIZE = 64
MAX_TEXT_CHARS = 10_000
PROGRESSIVE_MAX_STEPS = 30

# When LOG_INFERENCE is set the service prints a detailed line per inference
# (text preview, token count, raw logits, softmax probs, winner, latency) so a
# thesis demo can show what the model is "thinking" in real time. Off by
# default — keep production logs quiet.
LOG_INFERENCE = os.environ.get("LOG_INFERENCE", "").lower() in ("1", "true", "yes")
LOG_TEXT_PREVIEW = 80


class InferenceCounter:
    """Monotonic request counter for log correlation."""

    _value = 0

    @classmethod
    def next(cls) -> int:
        cls._value += 1
        return cls._value


class ModelState:
    """Holds loaded model artifacts. Populated by `lifespan` on startup."""

    model: Optional[AutoModelForSequenceClassification] = None
    tokenizer: Optional[AutoTokenizer] = None
    device: Optional[torch.device] = None
    model_id: Optional[str] = None
    model_dir: Optional[str] = None
    loaded_at: Optional[float] = None


state = ModelState()


def select_device() -> torch.device:
    override = os.environ.get("DEVICE", "").strip().lower()
    if override:
        return torch.device(override)
    if torch.cuda.is_available():
        return torch.device("cuda")
    if torch.backends.mps.is_available():
        return torch.device("mps")
    return torch.device("cpu")


def load_model() -> None:
    model_dir = Path(os.environ.get("MODEL_DIR", str(DEFAULT_MODEL_DIR)))
    if not model_dir.exists():
        raise RuntimeError(
            f"Model directory not found: {model_dir}. "
            f"Run `python3 scripts/download_model.py` from services/sentiment/ first."
        )

    device = select_device()
    print(f"[sentiment] Loading model from {model_dir} on device={device}")
    started = time.time()

    tokenizer = AutoTokenizer.from_pretrained(str(model_dir))
    model = AutoModelForSequenceClassification.from_pretrained(str(model_dir))
    model.to(device)
    model.eval()

    state.model = model
    state.tokenizer = tokenizer
    state.device = device
    state.model_id = os.environ.get("HF_REPO_ID", DEFAULT_MODEL_ID)
    state.model_dir = str(model_dir)
    state.loaded_at = time.time()
    print(f"[sentiment] Model ready in {time.time() - started:.2f}s")


@asynccontextmanager
async def lifespan(_app: FastAPI):
    load_model()
    yield


app = FastAPI(title="CineSentiment", version="1.0.0", lifespan=lifespan)


class PredictRequest(BaseModel):
    text: str = Field(..., min_length=1, max_length=MAX_TEXT_CHARS)


class PredictBatchRequest(BaseModel):
    texts: List[str] = Field(..., min_length=1, max_length=MAX_BATCH_SIZE)


class Prediction(BaseModel):
    label: str
    confidence: float
    p_positive: float
    p_negative: float


class PredictBatchResponse(BaseModel):
    predictions: List[Prediction]


class ProgressiveStep(BaseModel):
    step: int
    token_index: int
    prefix_text: str
    p_positive: float
    p_negative: float
    label: str
    confidence: float


class ProgressiveResponse(BaseModel):
    total_tokens: int
    max_input_tokens: int
    steps: List[ProgressiveStep]


class HealthResponse(BaseModel):
    # `model_*` fields collide with Pydantic's protected namespace; opt out.
    model_config = ConfigDict(protected_namespaces=())

    status: str
    model_loaded: bool
    model_id: Optional[str]
    model_dir: Optional[str]
    device: Optional[str]
    uptime_seconds: Optional[float]


@torch.no_grad()
def run_inference(texts: List[str]) -> List[Prediction]:
    if state.model is None or state.tokenizer is None or state.device is None:
        raise RuntimeError("Model not loaded yet")

    for i, text in enumerate(texts):
        if len(text) > MAX_TEXT_CHARS:
            raise ValueError(f"texts[{i}] exceeds {MAX_TEXT_CHARS} chars")

    started = time.perf_counter()
    inputs = state.tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=MAX_INPUT_TOKENS,
        return_tensors="pt",
    ).to(state.device)

    logits = state.model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).cpu().numpy()
    raw_logits = logits.detach().cpu().numpy()
    elapsed_ms = (time.perf_counter() - started) * 1000

    predictions: List[Prediction] = []
    for row in probs:
        winner = int(row.argmax())
        predictions.append(
            Prediction(
                label=LABELS[winner],
                confidence=float(row[winner]),
                p_negative=float(row[0]),
                p_positive=float(row[1]),
            )
        )

    if LOG_INFERENCE:
        req_id = InferenceCounter.next()
        # `input_ids` is a torch tensor of shape (batch, seq_len). The
        # attention_mask tells us how many tokens were *real* (not padding)
        # for each text — that is the count we want to surface.
        token_counts = inputs["attention_mask"].sum(dim=1).tolist()
        for i, text in enumerate(texts):
            preview = text.replace("\n", " ").strip()
            if len(preview) > LOG_TEXT_PREVIEW:
                preview = preview[:LOG_TEXT_PREVIEW] + "…"
            pred = predictions[i]
            logit_neg, logit_pos = float(raw_logits[i][0]), float(raw_logits[i][1])
            print(
                f"[infer] req#{req_id} batch={len(texts)} item={i + 1}/{len(texts)}"
                f"  in {elapsed_ms:.1f}ms\n"
                f"        text     : \"{preview}\"\n"
                f"        tokens   : {token_counts[i]} (max {MAX_INPUT_TOKENS})\n"
                f"        logits   : negative={logit_neg:+.3f}  positive={logit_pos:+.3f}\n"
                f"        probs    : negative={pred.p_negative:.5f} positive={pred.p_positive:.5f}\n"
                f"        decision : {pred.label}  (conf {pred.confidence * 100:.2f}%)",
                flush=True,
            )

    return predictions


@app.get("/health", response_model=HealthResponse)
async def health() -> HealthResponse:
    return HealthResponse(
        status="ok" if state.model is not None else "loading",
        model_loaded=state.model is not None,
        model_id=state.model_id,
        model_dir=state.model_dir,
        device=str(state.device) if state.device else None,
        uptime_seconds=time.time() - state.loaded_at if state.loaded_at else None,
    )


@app.post("/predict", response_model=Prediction)
async def predict(req: PredictRequest) -> Prediction:
    try:
        return run_inference([req.text])[0]
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))


@app.post("/predict/batch", response_model=PredictBatchResponse)
async def predict_batch(req: PredictBatchRequest) -> PredictBatchResponse:
    try:
        predictions = run_inference(req.texts)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))
    return PredictBatchResponse(predictions=predictions)


@torch.no_grad()
def _run_progressive(text: str) -> ProgressiveResponse:
    """Run inference on every prefix of the tokenized review.

    Tokenizes once, picks ≤ PROGRESSIVE_MAX_STEPS evenly spaced checkpoint
    lengths across the sequence, batches the prefix tensors into a single
    forward pass on the model, and returns one ProgressiveStep per checkpoint.

    This is deliberately *prediction trajectory*, not attention. We want to
    show 'what the model would have decided after reading this much' rather
    than 'which tokens the model attended to'. Cheaper, more intuitive UI,
    honest framing.
    """
    if state.model is None or state.tokenizer is None or state.device is None:
        raise RuntimeError("Model not loaded yet")

    encoded = state.tokenizer(
        text,
        truncation=True,
        max_length=MAX_INPUT_TOKENS,
        return_tensors="pt",
    )
    full_ids = encoded["input_ids"][0].tolist()
    n_tokens = len(full_ids)
    if n_tokens < 2:
        raise ValueError("Text is too short to visualize a trajectory")

    # Need at least the [CLS] + 1 real token at every checkpoint.
    if n_tokens <= PROGRESSIVE_MAX_STEPS + 1:
        checkpoint_lens = list(range(2, n_tokens + 1))
    else:
        # Distribute checkpoints evenly across [2, n_tokens]; always include the
        # full sequence so the trajectory ends on the canonical prediction.
        step = max(1, (n_tokens - 1) // PROGRESSIVE_MAX_STEPS)
        checkpoint_lens = list(range(2, n_tokens + 1, step))
        if checkpoint_lens[-1] != n_tokens:
            checkpoint_lens.append(n_tokens)

    pad_id = state.tokenizer.pad_token_id or 0
    max_len = checkpoint_lens[-1]

    input_ids = torch.tensor(
        [full_ids[:k] + [pad_id] * (max_len - k) for k in checkpoint_lens],
        device=state.device,
    )
    attention_mask = torch.tensor(
        [[1] * k + [0] * (max_len - k) for k in checkpoint_lens],
        device=state.device,
    )

    started = time.perf_counter()
    logits = state.model(input_ids=input_ids, attention_mask=attention_mask).logits
    probs = torch.softmax(logits, dim=-1).cpu().numpy()
    elapsed_ms = (time.perf_counter() - started) * 1000

    steps: List[ProgressiveStep] = []
    for i, (k, prob) in enumerate(zip(checkpoint_lens, probs)):
        prefix_text = state.tokenizer.decode(full_ids[:k], skip_special_tokens=True)
        winner = int(prob.argmax())
        steps.append(
            ProgressiveStep(
                step=i,
                token_index=k,
                prefix_text=prefix_text,
                p_positive=float(prob[1]),
                p_negative=float(prob[0]),
                label=LABELS[winner],
                confidence=float(prob[winner]),
            )
        )

    if LOG_INFERENCE:
        req_id = InferenceCounter.next()
        print(
            f"[infer] req#{req_id} progressive  in {elapsed_ms:.1f}ms  "
            f"steps={len(steps)} tokens={n_tokens}\n"
            f"        text     : \"{text[:LOG_TEXT_PREVIEW]}{'…' if len(text) > LOG_TEXT_PREVIEW else ''}\"\n"
            f"        final    : {steps[-1].label}  (conf {steps[-1].confidence * 100:.2f}%)",
            flush=True,
        )

    return ProgressiveResponse(
        total_tokens=n_tokens,
        max_input_tokens=MAX_INPUT_TOKENS,
        steps=steps,
    )


@app.post("/predict/progressive", response_model=ProgressiveResponse)
async def predict_progressive(req: PredictRequest) -> ProgressiveResponse:
    try:
        return _run_progressive(req.text)
    except RuntimeError as exc:
        raise HTTPException(status_code=503, detail=str(exc))
    except ValueError as exc:
        raise HTTPException(status_code=400, detail=str(exc))

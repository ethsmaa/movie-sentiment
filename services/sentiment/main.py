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

    inputs = state.tokenizer(
        texts,
        padding=True,
        truncation=True,
        max_length=MAX_INPUT_TOKENS,
        return_tensors="pt",
    ).to(state.device)

    logits = state.model(**inputs).logits
    probs = torch.softmax(logits, dim=-1).cpu().numpy()

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

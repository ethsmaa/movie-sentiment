"""Pytest fixtures for the sentiment service.

The model itself is mocked out — these tests cover the HTTP surface (validation,
error mapping, batch shape), not inference accuracy. Real-model accuracy is
already covered by the ml/metrics.json eval at training time.
"""

from __future__ import annotations

import os
import sys
from pathlib import Path
from unittest.mock import MagicMock

import pytest

SERVICE_DIR = Path(__file__).resolve().parent.parent
sys.path.insert(0, str(SERVICE_DIR))


class FakePredictions:
    """Stub for `model(**inputs).logits`.

    Returns logits where the positive class wins iff the input texts contain
    the substring 'good', otherwise the negative class wins. This is enough
    for tests to assert on labels without touching torch internals beyond
    `torch.softmax`.
    """

    def __init__(self, batch_size: int, prefer_positive: list[bool]):
        import torch

        rows = []
        for is_pos in prefer_positive:
            if is_pos:
                rows.append([0.0, 5.0])
            else:
                rows.append([5.0, 0.0])
        self.logits = torch.tensor(rows)


@pytest.fixture(autouse=True)
def _reset_model_state():
    """Ensure each test starts with a clean ModelState."""
    yield
    import main

    main.state.model = None
    main.state.tokenizer = None
    main.state.device = None
    main.state.model_id = None
    main.state.model_dir = None
    main.state.loaded_at = None


@pytest.fixture
def loaded_app(monkeypatch):
    """FastAPI app with the model swapped for a deterministic stub.

    Yields a TestClient configured exactly as the production app would be at
    runtime — startup lifespan has already populated `state` with the stub.
    """
    import torch
    from fastapi.testclient import TestClient

    import main

    fake_tokenizer = MagicMock()

    def fake_tokenize(texts, **_kwargs):
        return MagicMock(to=lambda _device: {
            "_texts": texts,
            "_token_count": len(texts),
        })

    fake_tokenizer.side_effect = fake_tokenize

    fake_model = MagicMock()

    def fake_forward(**inputs):
        texts = inputs["_texts"]
        prefer_positive = ["good" in t.lower() for t in texts]
        return FakePredictions(len(texts), prefer_positive)

    fake_model.side_effect = fake_forward

    monkeypatch.setattr(main, "load_model", lambda: None)
    main.state.model = fake_model
    main.state.tokenizer = fake_tokenizer
    main.state.device = torch.device("cpu")
    main.state.model_id = "test/stub"
    main.state.model_dir = str(SERVICE_DIR / "model")
    import time
    main.state.loaded_at = time.time()

    with TestClient(main.app) as client:
        yield client


@pytest.fixture
def unloaded_app(monkeypatch):
    """FastAPI app where startup never loads a model.

    Used to verify the 503 path on `/predict*` when inference isn't available.
    """
    from fastapi.testclient import TestClient

    import main

    monkeypatch.setattr(main, "load_model", lambda: None)

    with TestClient(main.app) as client:
        yield client

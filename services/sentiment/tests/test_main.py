"""HTTP surface tests for the sentiment FastAPI service.

These tests use a stubbed model (see conftest.py). They guarantee:
- Validation rejects bad payloads
- /predict and /predict/batch return predictions in the correct shape
- /health reports model state honestly
- 503 is returned when inference is unavailable
"""


def test_health_reports_loaded_model(loaded_app):
    response = loaded_app.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "ok"
    assert body["model_loaded"] is True
    assert body["model_id"] == "test/stub"
    assert body["device"] == "cpu"
    assert body["uptime_seconds"] >= 0


def test_health_reports_unloaded_model(unloaded_app):
    response = unloaded_app.get("/health")
    assert response.status_code == 200
    body = response.json()
    assert body["status"] == "loading"
    assert body["model_loaded"] is False
    assert body["model_id"] is None


def test_predict_positive(loaded_app):
    response = loaded_app.post("/predict", json={"text": "this movie is good"})
    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "positive"
    assert body["p_positive"] > body["p_negative"]
    assert 0.0 <= body["confidence"] <= 1.0


def test_predict_negative(loaded_app):
    response = loaded_app.post("/predict", json={"text": "terrible"})
    assert response.status_code == 200
    body = response.json()
    assert body["label"] == "negative"
    assert body["p_negative"] > body["p_positive"]


def test_predict_rejects_empty_text(loaded_app):
    response = loaded_app.post("/predict", json={"text": ""})
    assert response.status_code == 422


def test_predict_rejects_overlong_text(loaded_app):
    huge = "a" * 10_001
    response = loaded_app.post("/predict", json={"text": huge})
    assert response.status_code == 422


def test_predict_returns_503_when_model_not_loaded(unloaded_app):
    response = unloaded_app.post("/predict", json={"text": "anything"})
    assert response.status_code == 503


def test_predict_batch_preserves_order(loaded_app):
    response = loaded_app.post(
        "/predict/batch",
        json={"texts": ["good film", "awful", "good vibes", "boring"]},
    )
    assert response.status_code == 200
    predictions = response.json()["predictions"]
    assert len(predictions) == 4
    assert predictions[0]["label"] == "positive"
    assert predictions[1]["label"] == "negative"
    assert predictions[2]["label"] == "positive"
    assert predictions[3]["label"] == "negative"


def test_predict_batch_rejects_empty(loaded_app):
    response = loaded_app.post("/predict/batch", json={"texts": []})
    assert response.status_code == 422


def test_predict_batch_rejects_oversize(loaded_app):
    response = loaded_app.post(
        "/predict/batch",
        json={"texts": ["good"] * 65},
    )
    assert response.status_code == 422


def test_predict_returns_normalized_probabilities(loaded_app):
    response = loaded_app.post("/predict", json={"text": "good"})
    body = response.json()
    total = body["p_positive"] + body["p_negative"]
    assert abs(total - 1.0) < 1e-4

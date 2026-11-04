import pytest
from unittest.mock import patch
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.database.seed import seed_demo_data

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


@pytest.fixture(autouse=True)
def isolate_network_gemini(monkeypatch):
    """Ensure automated tests never make external network calls to Gemini unless mocked."""
    monkeypatch.setattr("app.core.config.settings.GEMINI_API_KEY", "")


def test_explain_field_endpoint():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
    }
    response = client.post("/api/ai/explain-field", json=payload)
    assert response.status_code == 200
    data = response.json()

    # Validate strict response schema
    assert "summary" in data and len(data["summary"]) > 0
    assert "possible_reasons" in data and isinstance(data["possible_reasons"], list)
    assert "protected_regions" in data and isinstance(data["protected_regions"], list)
    assert "potentially_exposed_regions" in data and isinstance(data["potentially_exposed_regions"], list)
    assert "supporting_evidence" in data and isinstance(data["supporting_evidence"], list)
    assert "assumptions" in data and isinstance(data["assumptions"], list)
    assert "limitations" in data and isinstance(data["limitations"], list)
    assert "confidence_label" in data

    # Grounding check: Check that facts reference real match records
    evidence_str = " ".join(data["supporting_evidence"])
    assert "Coastal Mavericks" in evidence_str or "Apex Titans" in evidence_str
    assert "Aravind Nair" in evidence_str or "Over 19" in evidence_str


def test_explain_field_with_focus_fielder():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
        "fielder_id": "ply-titan-11",  # Deep Backward Point
    }
    response = client.post("/api/ai/explain-field", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["possible_reasons"]) > 0


def test_explain_field_change_endpoint():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b2",
        "previous_delivery_id": "del-demo-inn2-ov19-b1",
    }
    response = client.post("/api/ai/explain-change", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert len(data["possible_reasons"]) > 0
    assert len(data["supporting_evidence"]) > 0


def test_ask_tactical_question_endpoint():
    questions = [
        "Why did the captain move mid-off to long-off?",
        "What is the bowler trying to achieve with this field?",
        "Which scoring areas are being protected?",
        "What areas appear relatively exposed?",
    ]

    for q in questions:
        payload = {
            "match_id": "demo-t20-m01",
            "delivery_id": "del-demo-inn2-ov19-b2",
            "question": q,
        }
        response = client.post("/api/ai/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["query"] == q
        assert len(data["possible_reasons"]) > 0
        assert len(data["limitations"]) > 0


def test_explain_missing_match_returns_404():
    payload = {
        "match_id": "non-existent-match-999",
        "delivery_id": "del-demo-inn2-ov19-b1",
    }
    response = client.post("/api/ai/explain-field", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_explain_missing_delivery_returns_404():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "non-existent-delivery-999",
    }
    response = client.post("/api/ai/explain-field", json=payload)
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_gemini_api_mock_successful_response():
    mock_gemini_json = {
        "summary": "Mock tactical reasoning with off-side reinforcement.",
        "possible_reasons": [
            "Protecting the shorter boundary against the wide yorker plan.",
            "Inducing a mistimed lofted drive over extra cover.",
        ],
        "protected_regions": ["Third Man", "Backward Point", "Long-off"],
        "potentially_exposed_regions": ["Deep Mid-Wicket", "Fine Leg"],
        "supporting_evidence": ["Bumrah bowled 144 kph yorker outside off."],
        "assumptions": ["Assumes bowler executes 6th-stump line."],
        "limitations": ["Captain's internal thoughts are inferred, not verified."],
        "confidence_label": "High analytical plausibility",
    }

    with patch("app.services.ai_service.AIService._call_gemini_api", return_value=mock_gemini_json):
        payload = {
            "match_id": "demo-t20-m01",
            "delivery_id": "del-demo-inn2-ov19-b1",
        }
        response = client.post("/api/ai/explain-field", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["summary"] == mock_gemini_json["summary"]
        assert data["is_ai_generated"] is True
        assert data["confidence_label"] == "High analytical plausibility"


def test_gemini_api_timeout_or_error_fallback():
    # Simulate Gemini API failure / timeout returning None
    with patch("app.services.ai_service.AIService._call_gemini_api", return_value=None):
        payload = {
            "match_id": "demo-t20-m01",
            "delivery_id": "del-demo-inn2-ov19-b1",
            "question": "What is the tactical purpose here?",
        }
        response = client.post("/api/ai/ask", json=payload)
        assert response.status_code == 200
        data = response.json()
        assert data["is_ai_generated"] is False
        assert data["model_used"] == "grounded-tactical-engine"
        assert len(data["possible_reasons"]) > 0
        assert "The available ball-by-ball record does not capture the captain's explicit verbal instructions" in data["limitations"][0]


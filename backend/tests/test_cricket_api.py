import pytest
from fastapi.testclient import TestClient
from app.main import app
from app.database.session import SessionLocal
from app.database.seed import seed_demo_data
from app.models.field import Fielder

client = TestClient(app)


@pytest.fixture(scope="module", autouse=True)
def setup_database():
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


def test_get_matches_list():
    response = client.get("/api/matches")
    assert response.status_code == 200
    data = response.json()
    assert isinstance(data, list)
    assert len(data) >= 1
    match = data[0]
    assert match["id"] == "demo-t20-m01"
    assert match["is_demo"] is True
    assert match["team_a"] == "Apex Titans"
    assert match["team_b"] == "Coastal Mavericks"
    assert match["total_deliveries_tracked"] == 6


def test_get_match_detail():
    response = client.get("/api/matches/demo-t20-m01")
    assert response.status_code == 200
    data = response.json()
    assert data["id"] == "demo-t20-m01"
    assert len(data["deliveries"]) == 6
    first_deliv = data["deliveries"][0]
    assert first_deliv["over_number"] == 19
    assert first_deliv["ball_number"] == 1
    assert first_deliv["bowler_name"] == "Aravind Nair"
    assert first_deliv["batter_name"] == "Vikramaditya Roy"


def test_get_match_context():
    response = client.get("/api/matches/demo-t20-m01/context")
    assert response.status_code == 200
    data = response.json()
    assert data["match_id"] == "demo-t20-m01"
    assert data["current_over"] == 19
    assert data["current_batter"] == "Vikramaditya Roy"
    assert data["current_bowler"] == "Aravind Nair"
    assert data["is_demo_dataset"] is True
    assert data["target_runs"] == 172


def test_get_match_deliveries():
    response = client.get("/api/matches/demo-t20-m01/deliveries")
    assert response.status_code == 200
    deliveries = response.json()
    assert len(deliveries) == 6
    assert [d["ball_number"] for d in deliveries] == [1, 2, 3, 4, 5, 6]
    assert deliveries[2]["wickets"] == 1  # Ball 3 was clean bowled


def test_get_player_profile():
    response = client.get("/api/players/ply-titan-02")
    assert response.status_code == 200
    player = response.json()
    assert player["id"] == "ply-titan-02"
    assert player["name"] == "Aravind Nair"
    assert player["team"] == "Apex Titans"
    assert player["role"] == "Bowler"
    assert player["bowling_style"] == "Right-arm fast"


def test_get_player_stats():
    response = client.get("/api/players/ply-titan-02/stats")
    assert response.status_code == 200
    stats = response.json()
    assert stats["player_id"] == "ply-titan-02"
    assert stats["name"] == "Aravind Nair"
    assert stats["wickets_taken"] == 68
    assert stats["is_demo_data"] is True


def test_get_delivery_field_configuration():
    response = client.get("/api/matches/demo-t20-m01/field/del-demo-inn2-ov19-b1")
    assert response.status_code == 200
    field_data = response.json()
    
    # Must contain exactly 9 fielders, excluding the wicketkeeper
    assert field_data["total_fielders_count"] == 9
    assert len(field_data["fielders"]) == 9
    assert field_data["has_wicketkeeper"] is True
    assert field_data["wicketkeeper"]["fielding_position"] == "Wicketkeeper"
    assert field_data["wicketkeeper"]["is_wicketkeeper"] is True

    # Validate coordinate conventions
    for fielder in field_data["fielders"]:
        assert fielder["is_wicketkeeper"] is False
        assert -1.2 <= fielder["x"] <= 1.2
        assert -1.2 <= fielder["y"] <= 1.2


def test_compare_field_configurations():
    # Compare Ball 1 (6-3 off-side) with Ball 2 (Mid-off dropped to Long-off)
    response = client.get(
        "/api/matches/demo-t20-m01/field/compare?delivery_a_id=del-demo-inn2-ov19-b1&delivery_b_id=del-demo-inn2-ov19-b2"
    )
    assert response.status_code == 200
    comp = response.json()
    assert comp["match_id"] == "demo-t20-m01"
    assert comp["delivery_a_id"] == "del-demo-inn2-ov19-b1"
    assert comp["delivery_b_id"] == "del-demo-inn2-ov19-b2"
    assert comp["total_shifted_fielders"] >= 1
    
    # Verify Kavish Patel's shift from Mid-off to Long-off
    shifts = comp["movement_differences"]
    kavish_shift = next((s for s in shifts if s["player_id"] == "ply-titan-04"), None)
    assert kavish_shift is not None
    assert kavish_shift["from_position"] == "Mid-off (Ring)"
    assert kavish_shift["to_position"] == "Long-off"
    assert kavish_shift["displacement_normalized"] > 0.2


def test_invalid_match_id():
    response = client.get("/api/matches/non-existent-match-999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_invalid_player_id():
    response = client.get("/api/players/non-existent-player-999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_invalid_delivery_id():
    response = client.get("/api/matches/demo-t20-m01/field/invalid-delivery-999")
    assert response.status_code == 404
    data = response.json()
    assert data["error"]["code"] == "RESOURCE_NOT_FOUND"


def test_missing_fielders_validation():
    # Create an artificially corrupted delivery with only 8 fielders
    db = SessionLocal()
    try:
        # Delete 1 fielder from Ball 1 to test validation
        fielder_to_delete = db.query(Fielder).filter(
            Fielder.delivery_id == "del-demo-inn2-ov19-b1",
            Fielder.is_wicketkeeper == False
        ).first()
        saved_id = fielder_to_delete.id
        saved_player_id = fielder_to_delete.player_id
        saved_pos = fielder_to_delete.fielding_position
        saved_x = fielder_to_delete.x
        saved_y = fielder_to_delete.y
        db.delete(fielder_to_delete)
        db.commit()

        # Request field - should trigger 422 Unprocessable Entity
        response = client.get("/api/matches/demo-t20-m01/field/del-demo-inn2-ov19-b1")
        assert response.status_code == 422
        data = response.json()
        assert data["error"]["code"] == "INVALID_FIELDER_COUNT"
        assert "exactly 9 fielders" in data["error"]["message"]

        # Restore the deleted fielder
        restored = Fielder(
            id=saved_id,
            player_id=saved_player_id,
            fielding_position=saved_pos,
            x=saved_x,
            y=saved_y,
            is_wicketkeeper=False,
            delivery_id="del-demo-inn2-ov19-b1",
        )
        db.add(restored)
        db.commit()
    finally:
        db.close()


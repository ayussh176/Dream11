import pytest
from shapely.geometry import LineString
from app.simulator.geometry_engine import GeometrySimulationEngine, SCENARIO_CONFIGS
from fastapi.testclient import TestClient
from app.main import app

client = TestClient(app)


@pytest.fixture(autouse=True)
def isolate_network_gemini(monkeypatch):
    """Ensure automated simulation tests do not make live external API calls unless mocked."""
    monkeypatch.setattr("app.core.config.settings.GEMINI_API_KEY", "")


SAMPLE_FIELDERS = [
    {"id": "f1", "x": 0.82, "y": 0.05, "is_wicketkeeper": False},
    {"id": "f2", "x": 0.65, "y": -0.45, "is_wicketkeeper": False},
    {"id": "f3", "x": 0.42, "y": 0.30, "is_wicketkeeper": False},
    {"id": "f4", "x": 0.45, "y": 0.55, "is_wicketkeeper": False},
    {"id": "f5", "x": 0.18, "y": 0.60, "is_wicketkeeper": False},
    {"id": "f6", "x": 0.86, "y": 0.40, "is_wicketkeeper": False},
    {"id": "f7", "x": -0.25, "y": 0.85, "is_wicketkeeper": False},
    {"id": "f8", "x": -0.35, "y": 0.30, "is_wicketkeeper": False},
    {"id": "f9", "x": -0.78, "y": 0.38, "is_wicketkeeper": False},
    {"id": "wk", "x": 0.00, "y": -0.22, "is_wicketkeeper": True},
]


def test_moving_fielder_closer_does_not_reduce_reachability():
    # In cover scenario, move f3 (Cover Point at 0.42, 0.30) right into the cover trajectory at (0.50, 0.55)
    baseline_fielders = [dict(f) for f in SAMPLE_FIELDERS]
    closer_fielders = [dict(f) for f in SAMPLE_FIELDERS]
    closer_fielders[2] = {"id": "f3", "x": 0.50, "y": 0.55, "is_wicketkeeper": False}

    res = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=baseline_fielders,
        custom_fielders=closer_fielders,
        reaction_time_sec=0.40,
        fielder_speed_mps=6.0,
        ball_speed_mps=28.0,
    )

    # Moving a fielder directly into the target corridor must not reduce coverage
    assert res["custom_coverage_pct"] >= res["original_coverage_pct"]


def test_moving_all_fielders_away_does_not_increase_coverage():
    # Move all off-side fielders deep into the leg-side
    baseline_fielders = [dict(f) for f in SAMPLE_FIELDERS]
    away_fielders = []
    for f in SAMPLE_FIELDERS:
        if not f["is_wicketkeeper"]:
            # Shift away to fine leg / deep square leg
            away_fielders.append({"id": f["id"], "x": -0.85, "y": -0.10, "is_wicketkeeper": False})
        else:
            away_fielders.append(dict(f))

    res = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=baseline_fielders,
        custom_fielders=away_fielders,
    )

    assert res["custom_coverage_pct"] <= res["original_coverage_pct"]


def test_overlapping_fielder_coverage_does_not_double_count():
    # Place 3 fielders at the exact same coordinate
    single_fielder = [
        {"id": "f1", "x": 0.45, "y": 0.50, "is_wicketkeeper": False},
    ]
    triple_fielders = [
        {"id": "f1", "x": 0.45, "y": 0.50, "is_wicketkeeper": False},
        {"id": "f2", "x": 0.45, "y": 0.50, "is_wicketkeeper": False},
        {"id": "f3", "x": 0.45, "y": 0.50, "is_wicketkeeper": False},
    ]

    points = [(0.45, 0.50), (0.46, 0.51), (0.47, 0.52)]
    traj = LineString([(0.0, 0.0), (0.50, 0.55)])

    res1 = GeometrySimulationEngine.evaluate_points(
        points=points,
        fielders=single_fielder,
        trajectory=traj,
        corridor_width_m=10.0,
        reaction_time_sec=0.4,
        fielder_speed_mps=6.0,
        ball_speed_mps=28.0,
    )

    res2 = GeometrySimulationEngine.evaluate_points(
        points=points,
        fielders=triple_fielders,
        trajectory=traj,
        corridor_width_m=10.0,
        reaction_time_sec=0.4,
        fielder_speed_mps=6.0,
        ball_speed_mps=28.0,
    )

    # Number of covered points must be identical; no double counting
    assert len(res1["covered_points"]) == len(res2["covered_points"])
    assert res1["coverage_pct"] == res2["coverage_pct"]


def test_ball_speed_variation_affects_coverage():
    # Faster ball speed allows less time for fielders to arrive -> lower coverage
    res_slow = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=SAMPLE_FIELDERS,
        custom_fielders=SAMPLE_FIELDERS,
        ball_speed_mps=18.0,  # Slow ball
    )

    res_fast = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=SAMPLE_FIELDERS,
        custom_fielders=SAMPLE_FIELDERS,
        ball_speed_mps=36.0,  # Fast ball
    )

    assert res_slow["custom_coverage_pct"] >= res_fast["custom_coverage_pct"]


def test_reaction_time_variation_affects_coverage():
    # Faster reaction time (e.g. 0.2s) should give equal or better coverage than delayed reaction (0.8s)
    res_quick = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=SAMPLE_FIELDERS,
        custom_fielders=SAMPLE_FIELDERS,
        reaction_time_sec=0.20,
    )

    res_slow = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=SAMPLE_FIELDERS,
        custom_fielders=SAMPLE_FIELDERS,
        reaction_time_sec=0.80,
    )

    assert res_quick["custom_coverage_pct"] >= res_slow["custom_coverage_pct"]


def test_api_evaluate_simulation_success():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
        "scenario": "cover",
        "original_fielders": [
            {"id": f["id"], "player_id": f["id"], "fielding_position": "Pos", "x": f["x"], "y": f["y"], "is_wicketkeeper": f["is_wicketkeeper"]}
            for f in SAMPLE_FIELDERS
        ],
        "custom_fielders": [
            {"id": f["id"], "player_id": f["id"], "fielding_position": "Pos", "x": f["x"], "y": f["y"], "is_wicketkeeper": f["is_wicketkeeper"]}
            for f in SAMPLE_FIELDERS
        ],
        "assumptions": {
            "reaction_time_sec": 0.40,
            "fielder_speed_mps": 6.0,
            "ball_speed_mps": 28.0,
            "grid_spacing_m": 2.5,
        },
    }

    response = client.post("/api/simulator/evaluate", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert data["scenario_key"] == "cover"
    assert data["model_type"] == "GEOMETRY_BASED_ESTIMATE"
    assert "original_coverage_pct" in data
    assert "custom_coverage_pct" in data
    assert "zone_comparisons" in data
    assert len(data["zone_comparisons"]) >= 2
    assert "covered_points" in data
    assert "exposed_points" in data
    assert "limitations" in data


def test_api_evaluate_simulation_invalid_assumptions():
    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
        "scenario": "cover",
        "original_fielders": [
            {"id": f["id"], "player_id": f["id"], "fielding_position": "Pos", "x": f["x"], "y": f["y"], "is_wicketkeeper": f["is_wicketkeeper"]}
            for f in SAMPLE_FIELDERS
        ],
        "custom_fielders": [
            {"id": f["id"], "player_id": f["id"], "fielding_position": "Pos", "x": f["x"], "y": f["y"], "is_wicketkeeper": f["is_wicketkeeper"]}
            for f in SAMPLE_FIELDERS
        ],
        "assumptions": {
            "reaction_time_sec": -0.5,  # Negative invalid
            "fielder_speed_mps": 6.0,
            "ball_speed_mps": 28.0,
            "grid_spacing_m": 2.5,
        },
    }

    response = client.post("/api/simulator/evaluate", json=payload)
    assert response.status_code == 422


def test_api_evaluate_simulation_invalid_fielder_count():
    # Only 8 fielders
    corrupted_fielders = [
        {"id": f["id"], "player_id": f["id"], "fielding_position": "Pos", "x": f["x"], "y": f["y"], "is_wicketkeeper": f["is_wicketkeeper"]}
        for f in SAMPLE_FIELDERS[:8]
    ]

    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
        "scenario": "cover",
        "original_fielders": corrupted_fielders,
        "custom_fielders": corrupted_fielders,
    }

    response = client.post("/api/simulator/evaluate", json=payload)
    assert response.status_code == 422


def test_api_explain_tradeoffs():
    sim_eval_res = GeometrySimulationEngine.evaluate_field_scenario(
        scenario_key="cover",
        original_fielders=SAMPLE_FIELDERS,
        custom_fielders=SAMPLE_FIELDERS,
    )

    payload = {
        "match_id": "demo-t20-m01",
        "delivery_id": "del-demo-inn2-ov19-b1",
        "simulation_result": sim_eval_res,
    }

    response = client.post("/api/simulator/explain-tradeoffs", json=payload)
    assert response.status_code == 200
    data = response.json()
    assert "summary" in data
    assert "improvements" in data
    assert "trade_offs" in data
    assert "disclaimer" in data


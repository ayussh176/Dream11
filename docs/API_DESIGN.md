# DugoutAI — REST API Design & Contracts

---

## 1. API Architecture & Standards

- **Base URL:** `/api`
- **Protocol:** HTTP/1.1 and HTTP/2 over TLS; JSON payloads.
- **Error Standard:** Centralized RFC 7807 problem details:
```json
{
  "error": {
    "code": "RESOURCE_NOT_FOUND",
    "message": "Match with identifier 'demo-t20-m01' was not found.",
    "path": "/api/matches/demo-t20-m01"
  }
}
```

---

## 2. Coordinate System Specification

Field positions are stored in normalized physical coordinates relative to the batter:
- **Origin `(0, 0)`:** Center of batting stance at batting crease.
- **Lateral Axis ($X$):**
  - **$+X$ (Positive):** Off-side (e.g., Cover, Point, Fly Slip).
  - **$-X$ (Negative):** Leg-side (e.g., Mid-Wicket, Square Leg, Fine Leg).
- **Longitudinal Axis ($Y$):**
  - **$+Y$ (Positive):** Toward the bowler and outfield boundary ($0$ to $+1.0$).
  - **$-Y$ (Negative):** Behind the batter toward the wicketkeeper and fine boundary ($0$ to $-0.5$).
- **Normal Range:** $x \in [-1.05, 1.05], y \in [-0.60, 1.05]$. Bounds validation enforces $[-1.2, 1.2]$.

---

## 3. Implemented Endpoints Catalog

```
/api
├── /health
│   └── GET /                          # Backend health, SQLite connection & runtime
├── /matches
│   ├── GET /                          # List all matches with tracking metadata
│   ├── GET /{match_id}                # Full match details and delivery summaries
│   ├── GET /{match_id}/context        # Live situational context (RRR, scores, duels)
│   ├── GET /{match_id}/deliveries     # Delivery sequence for match
│   ├── GET /{match_id}/field/{del_id} # 9 fielders (+ wicketkeeper) for delivery
│   └── GET /{match_id}/field/compare  # Delta comparison between two field settings
├── /players
│   ├── GET /{player_id}               # Player role, batting style, bowling style
│   └── GET /{player_id}/stats         # Demonstration career stats & strike rate
├── /ai
│   ├── POST /explain-field            # Structured tactical analysis of field placement
│   ├── POST /explain-change           # Rationale behind movements between deliveries
│   └── POST /ask                      # Conversational Q&A grounded in SQLite telemetry
└── /simulator
    ├── POST /evaluate                 # Deterministic NumPy/Shapely spatial coverage engine
    └── POST /explain-tradeoffs        # Grounded AI critique of spatial coverage deltas
```

---

## 4. Endpoint Specifications & Examples

### 4.1 Matches

#### `GET /api/matches`
List all matches currently in the database.

**Response `200 OK`:**
```json
[
  {
    "id": "demo-t20-m01",
    "match_name": "Apex Titans vs Coastal Mavericks (Tactical Demo T20)",
    "tournament": "DugoutAI Invitational Cup (Demonstration Dataset)",
    "venue": "Apex Grand Stadium, Neo Delhi",
    "match_date": "2026-06-15",
    "team_a": "Apex Titans",
    "team_b": "Coastal Mavericks",
    "batting_team": "Coastal Mavericks",
    "bowling_team": "Apex Titans",
    "current_innings": 2,
    "match_status": "Demo Live (Innings 2, Over 19)",
    "total_overs": 20,
    "target_runs": 172,
    "is_demo": true,
    "total_deliveries_tracked": 6
  }
]
```

---

#### `GET /api/matches/{match_id}/context`
Live situational scoreboard telemetry and pressure metrics for the match.

**Response `200 OK`:**
```json
{
  "match_id": "demo-t20-m01",
  "match_name": "Apex Titans vs Coastal Mavericks (Tactical Demo T20)",
  "tournament": "DugoutAI Invitational Cup (Demonstration Dataset)",
  "venue": "Apex Grand Stadium, Neo Delhi",
  "current_innings": 2,
  "batting_team": "Coastal Mavericks",
  "bowling_team": "Apex Titans",
  "current_over": 19,
  "total_runs_scored": 3,
  "total_wickets_lost": 1,
  "target_runs": 172,
  "runs_needed": 19,
  "balls_remaining": 6,
  "required_run_rate": 19.0,
  "current_run_rate": 3.0,
  "current_batter": "Vikramaditya Roy",
  "current_bowler": "Aravind Nair",
  "last_completed_delivery_id": "del-demo-inn2-ov19-b6",
  "is_demo_dataset": true,
  "notice": "Demonstration tactical sequence: Apex Titans defending in the 19th over."
}
```

---

#### `GET /api/matches/{match_id}/field/{delivery_id}`
Retrieve the exact 9-fielder configuration (+ 1 wicketkeeper) for a specific delivery.

**Validation Constraints:**
- Must contain **exactly 9 fielders** where `is_wicketkeeper == false`.
- Must contain **1 wicketkeeper** where `is_wicketkeeper == true`.
- Coordinates must lie within the playable boundary `[-1.2, 1.2]`.

**Response `200 OK`:**
```json
{
  "id": "cfg-del-demo-inn2-ov19-b1",
  "match_id": "demo-t20-m01",
  "delivery_id": "del-demo-inn2-ov19-b1",
  "configuration_name": "Off-Side Death Lock (6-3 Off-Side Heavy)",
  "total_fielders_count": 9,
  "has_wicketkeeper": true,
  "wicketkeeper": {
    "id": "fld-del-demo-inn2-ov19-b1-wk",
    "player_id": "ply-titan-03",
    "player_name": "Zain Merchant",
    "fielding_position": "Wicketkeeper",
    "x": 0.0,
    "y": -0.22,
    "is_wicketkeeper": true,
    "delivery_id": "del-demo-inn2-ov19-b1",
    "has_moved": false,
    "prev_x": null,
    "prev_y": null,
    "prev_position": null
  },
  "fielders": [
    {
      "id": "fld-del-demo-inn2-ov19-b1-1",
      "player_id": "ply-titan-11",
      "player_name": "Neil Mukherjee",
      "fielding_position": "Deep Backward Point",
      "x": 0.82,
      "y": 0.05,
      "is_wicketkeeper": false,
      "delivery_id": "del-demo-inn2-ov19-b1",
      "has_moved": false,
      "prev_x": null,
      "prev_y": null,
      "prev_position": null
    }
  ]
}
```

---

#### `GET /api/matches/{match_id}/field/compare?delivery_a_id={id}&delivery_b_id={id}`
Computes positional displacement vectors and tactical repositionings between two field settings.

**Query Parameters:**
- `delivery_a_id` (string, required): Baseline delivery ID.
- `delivery_b_id` (string, required): Target delivery ID to compare.

**Response `200 OK`:**
```json
{
  "match_id": "demo-t20-m01",
  "delivery_a_id": "del-demo-inn2-ov19-b1",
  "delivery_b_id": "del-demo-inn2-ov19-b2",
  "configuration_a_name": "Off-Side Death Lock (6-3 Off-Side Heavy)",
  "configuration_b_name": "Dual Deep Outfield Shield (Long-Off Dropped Back)",
  "field_a": { "...": "FieldConfigurationResponse A" },
  "field_b": { "...": "FieldConfigurationResponse B" },
  "total_shifted_fielders": 3,
  "movement_differences": [
    {
      "player_id": "ply-titan-04",
      "player_name": "Kavish Patel",
      "from_position": "Mid-off (Ring)",
      "to_position": "Long-off",
      "from_coord": { "x": 0.18, "y": 0.6 },
      "to_coord": { "x": 0.3, "y": 0.85 },
      "displacement_normalized": 0.2773,
      "description": "Moved from Mid-off (Ring) to Long-off (displacement: 0.277)"
    }
  ],
  "tactical_summary": "Captain made 3 tactical adjustment(s): Liam Cooper (Deep Third Man → Deep Fly Slip), Harsh Vardhan (Cover Point (Ring) → Cover Point (Ring)), Kavish Patel (Mid-off (Ring) → Long-off)."
}
```

---

### 4.2 Players

#### `GET /api/players/{player_id}`
Retrieve player identity, role, batting style, and bowling style.

**Response `200 OK`:**
```json
{
  "id": "ply-titan-02",
  "name": "Aravind Nair",
  "team": "Apex Titans",
  "role": "Bowler",
  "batting_style": "Right-hand bat",
  "bowling_style": "Right-arm fast",
  "image_url": null,
  "fielding_position_specialty": "Death Specialist"
}
```

---

#### `GET /api/players/{player_id}/stats`
Retrieve demonstration statistics (runs, wickets, strike rate, economy rate).

**Response `200 OK`:**
```json
{
  "player_id": "ply-titan-02",
  "name": "Aravind Nair",
  "team": "Apex Titans",
  "role": "Bowler",
  "matches_played": 54,
  "runs_scored": 145,
  "wickets_taken": 68,
  "catches": 14,
  "strike_rate": 95.0,
  "economy_rate": 7.12,
  "fielding_position_specialty": "Death Specialist",
  "is_demo_data": true
}
```

---

## 7. Simulator Endpoints

### 7.1 Deterministic Simulation Evaluation
**`POST /api/simulator/evaluate`**

Evaluates geometric spatial reachability across discrete ground points using NumPy and Shapely.

#### Request Body
```json
{
  "match_id": "demo-t20-m01",
  "delivery_id": "del-19-04",
  "scenario": "cover",
  "original_fielders": [
    {
      "id": "fld-19-04-01",
      "player_id": "ply-titan-01",
      "player_name": "Rohan Sharma",
      "fielding_position": "Deep Cover",
      "x": 0.65,
      "y": 0.55,
      "is_wicketkeeper": false
    }
  ],
  "custom_fielders": [
    {
      "id": "fld-19-04-01",
      "player_id": "ply-titan-01",
      "player_name": "Rohan Sharma",
      "fielding_position": "Deep Cover",
      "x": 0.50,
      "y": 0.45,
      "is_wicketkeeper": false
    }
  ],
  "assumptions": {
    "reaction_time_sec": 0.40,
    "fielder_speed_mps": 6.8,
    "ball_speed_mps": 30.0,
    "grid_spacing_m": 2.0
  }
}
```

#### Response (200 OK)
```json
{
  "scenario_key": "cover",
  "scenario_name": "Ground shot through Cover",
  "description": "Hypothetical ground stroke driven through the cover corridor.",
  "model_type": "deterministic_geometry_shapely_numpy",
  "original_coverage_pct": 68.4,
  "custom_coverage_pct": 82.5,
  "coverage_difference_pct": 14.1,
  "covered_points": [{"x": 0.45, "y": 0.42}],
  "exposed_points": [{"x": 0.72, "y": 0.81}],
  "zone_comparisons": [
    {
      "zone_key": "cover",
      "zone_name": "Cover",
      "is_primary_target": true,
      "original_coverage_pct": 68.4,
      "custom_coverage_pct": 82.5,
      "difference_pct": 14.1
    }
  ],
  "total_points_evaluated": 184,
  "assumptions": {
    "reaction_time_sec": 0.4,
    "fielder_speed_mps": 6.8,
    "ball_speed_mps": 30.0,
    "grid_spacing_m": 2.0
  },
  "limitations": [
    "Evaluates 2D planar Euclidean ground reachability only.",
    "Assumes constant initial ball velocity and uniform deceleration.",
    "Does not predict batter shot execution likelihood."
  ]
}
```

### 7.2 Explain Strategic Trade-Offs
**`POST /api/simulator/explain-tradeoffs`**

Receives the deterministic simulation result and calls Gemini with strict grounding to critique trade-offs, defensive coverage gains, and newly exposed sectors.


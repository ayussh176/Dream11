import logging
from datetime import datetime, timezone
from sqlalchemy.orm import Session
from sqlalchemy import select, delete
from app.models.match import Match
from app.models.player import Player
from app.models.delivery import Delivery
from app.models.field import Fielder, FieldConfiguration
from app.database.session import SessionLocal, engine
from app.database.base import Base

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("dugout-seed")


def seed_demo_data(db: Session) -> str:
    """
    Idempotent seed script that creates or resets the DugoutAI demonstration match.
    Populates 2 full teams (22 players) and a high-stakes 19th over sequence
    with complete delivery-level 9-fielder configurations (+ wicketkeeper).
    """
    # Ensure tables exist
    Base.metadata.create_all(bind=engine)

    demo_match_id = "demo-t20-m01"

    # Clean up existing demo match if it exists (idempotent reset)
    existing_match = db.get(Match, demo_match_id)
    if existing_match:
        logger.info(f"Existing demo match '{demo_match_id}' found. Resetting for idempotency...")
        # Cascades handle deliveries, fielders, and field_configurations
        db.delete(existing_match)
        db.commit()

    # 1. Create Players for Team A: Apex Titans
    titans_players = [
        Player(
            id="ply-titan-01",
            name="Devraj Singh",
            team="Apex Titans",
            role="All-Rounder",
            batting_style="Right-hand bat",
            bowling_style="Right-arm medium fast",
            fielding_position_specialty="Extra Cover",
            matches_played=48,
            runs_scored=1120,
            wickets_taken=34,
            catches=28,
            strike_rate=142.5,
            economy_rate=7.85,
        ),
        Player(
            id="ply-titan-02",
            name="Aravind Nair",
            team="Apex Titans",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm fast",
            fielding_position_specialty="Death Specialist",
            matches_played=54,
            runs_scored=145,
            wickets_taken=68,
            catches=14,
            strike_rate=95.0,
            economy_rate=7.12,
        ),
        Player(
            id="ply-titan-03",
            name="Zain Merchant",
            team="Apex Titans",
            role="Wicketkeeper-Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Wicketkeeper",
            matches_played=62,
            runs_scored=1540,
            wickets_taken=0,
            catches=46,
            strike_rate=136.2,
            economy_rate=0.0,
        ),
        Player(
            id="ply-titan-04",
            name="Kavish Patel",
            team="Apex Titans",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Mid-off / Long-off",
            matches_played=38,
            runs_scored=180,
            wickets_taken=42,
            catches=16,
            strike_rate=110.0,
            economy_rate=6.90,
        ),
        Player(
            id="ply-titan-05",
            name="Marcus Vance",
            team="Apex Titans",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm fast",
            fielding_position_specialty="Sweeper Cover / Fine Leg",
            matches_played=31,
            runs_scored=95,
            wickets_taken=39,
            catches=19,
            strike_rate=105.0,
            economy_rate=8.10,
        ),
        Player(
            id="ply-titan-06",
            name="Reyansh Verma",
            team="Apex Titans",
            role="Batter",
            batting_style="Left-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Short Mid-Wicket",
            matches_played=44,
            runs_scored=1340,
            wickets_taken=4,
            catches=22,
            strike_rate=139.8,
            economy_rate=8.50,
        ),
        Player(
            id="ply-titan-07",
            name="Tanmay Joshi",
            team="Apex Titans",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm legbreak",
            fielding_position_specialty="Long-on",
            matches_played=29,
            runs_scored=780,
            wickets_taken=2,
            catches=15,
            strike_rate=145.0,
            economy_rate=9.00,
        ),
        Player(
            id="ply-titan-08",
            name="Siddharth Rao",
            team="Apex Titans",
            role="All-Rounder",
            batting_style="Left-hand bat",
            bowling_style="Slow left-arm orthodox",
            fielding_position_specialty="Deep Mid-Wicket",
            matches_played=40,
            runs_scored=650,
            wickets_taken=35,
            catches=21,
            strike_rate=128.5,
            economy_rate=7.30,
        ),
        Player(
            id="ply-titan-09",
            name="Liam Cooper",
            team="Apex Titans",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm medium",
            fielding_position_specialty="Deep Third Man",
            matches_played=35,
            runs_scored=890,
            wickets_taken=6,
            catches=26,
            strike_rate=152.0,
            economy_rate=8.80,
        ),
        Player(
            id="ply-titan-10",
            name="Harsh Vardhan",
            team="Apex Titans",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Cover Point (Ring)",
            matches_played=27,
            runs_scored=620,
            wickets_taken=0,
            catches=18,
            strike_rate=131.0,
            economy_rate=0.0,
        ),
        Player(
            id="ply-titan-11",
            name="Neil Mukherjee",
            team="Apex Titans",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm fast medium",
            fielding_position_specialty="Deep Backward Point",
            matches_played=22,
            runs_scored=60,
            wickets_taken=24,
            catches=12,
            strike_rate=85.0,
            economy_rate=8.25,
        ),
    ]

    # 2. Create Players for Team B: Coastal Mavericks
    mavericks_players = [
        Player(
            id="ply-mav-01",
            name="Rohan Kulkarni",
            team="Coastal Mavericks",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Mid-on",
            matches_played=52,
            runs_scored=1780,
            wickets_taken=5,
            catches=30,
            strike_rate=138.4,
            economy_rate=8.20,
        ),
        Player(
            id="ply-mav-02",
            name="Ishan Sharma",
            team="Coastal Mavericks",
            role="Batter",
            batting_style="Left-hand bat",
            bowling_style="Slow left-arm orthodox",
            fielding_position_specialty="Point",
            matches_played=39,
            runs_scored=1190,
            wickets_taken=11,
            catches=17,
            strike_rate=144.2,
            economy_rate=7.90,
        ),
        Player(
            id="ply-mav-03",
            name="Dillon Hayes",
            team="Coastal Mavericks",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm medium",
            fielding_position_specialty="Long-off",
            matches_played=45,
            runs_scored=1320,
            wickets_taken=8,
            catches=24,
            strike_rate=155.0,
            economy_rate=8.90,
        ),
        Player(
            id="ply-mav-04",
            name="Kabir Malhotra",
            team="Coastal Mavericks",
            role="Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Cover",
            matches_played=41,
            runs_scored=1080,
            wickets_taken=0,
            catches=19,
            strike_rate=126.5,
            economy_rate=0.0,
        ),
        Player(
            id="ply-mav-05",
            name="Samar Sen",
            team="Coastal Mavericks",
            role="Wicketkeeper-Batter",
            batting_style="Right-hand bat",
            bowling_style="Right-arm offbreak",
            fielding_position_specialty="Wicketkeeper",
            matches_played=36,
            runs_scored=740,
            wickets_taken=0,
            catches=32,
            strike_rate=130.0,
            economy_rate=0.0,
        ),
        Player(
            id="ply-mav-06",
            name="Vikramaditya Roy",
            team="Coastal Mavericks",
            role="All-Rounder",
            batting_style="Right-hand bat",
            bowling_style="Right-arm medium fast",
            fielding_position_specialty="Deep Mid-Wicket",
            matches_played=50,
            runs_scored=1260,
            wickets_taken=28,
            catches=31,
            strike_rate=162.8,
            economy_rate=8.60,
        ),
        Player(
            id="ply-mav-07",
            name="Aditya Roy",
            team="Coastal Mavericks",
            role="All-Rounder",
            batting_style="Left-hand bat",
            bowling_style="Slow left-arm orthodox",
            fielding_position_specialty="Deep Square Leg",
            matches_played=33,
            runs_scored=510,
            wickets_taken=32,
            catches=14,
            strike_rate=122.0,
            economy_rate=7.05,
        ),
        Player(
            id="ply-mav-08",
            name="Fahad Khan",
            team="Coastal Mavericks",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm legbreak",
            fielding_position_specialty="Short Third Man",
            matches_played=37,
            runs_scored=120,
            wickets_taken=46,
            catches=13,
            strike_rate=90.0,
            economy_rate=7.40,
        ),
        Player(
            id="ply-mav-09",
            name="Mitchell Scott",
            team="Coastal Mavericks",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm fast",
            fielding_position_specialty="Fine Leg",
            matches_played=28,
            runs_scored=75,
            wickets_taken=38,
            catches=9,
            strike_rate=80.0,
            economy_rate=8.15,
        ),
        Player(
            id="ply-mav-10",
            name="Pranav Deshmukh",
            team="Coastal Mavericks",
            role="Bowler",
            batting_style="Right-hand bat",
            bowling_style="Right-arm medium",
            fielding_position_specialty="Mid-off",
            matches_played=25,
            runs_scored=40,
            wickets_taken=22,
            catches=8,
            strike_rate=70.0,
            economy_rate=8.45,
        ),
        Player(
            id="ply-mav-11",
            name="Tariq Anis",
            team="Coastal Mavericks",
            role="Bowler",
            batting_style="Left-hand bat",
            bowling_style="Left-arm fast",
            fielding_position_specialty="Third Man",
            matches_played=20,
            runs_scored=30,
            wickets_taken=25,
            catches=7,
            strike_rate=65.0,
            economy_rate=7.95,
        ),
    ]

    for p in titans_players + mavericks_players:
        db.merge(p)
    db.commit()

    # 3. Create the Demo Match
    match = Match(
        id=demo_match_id,
        match_name="Apex Titans vs Coastal Mavericks (Tactical Demo T20)",
        tournament="DugoutAI Invitational Cup (Demonstration Dataset)",
        venue="Apex Grand Stadium, Neo Delhi",
        match_date="2026-06-15",
        team_a="Apex Titans",
        team_b="Coastal Mavericks",
        batting_team="Coastal Mavericks",
        bowling_team="Apex Titans",
        current_innings=2,
        match_status="Demo Live (Innings 2, Over 19)",
        target_runs=172,
        total_overs=20,
        is_demo=True,
    )
    db.add(match)
    db.commit()

    # 4. Create the 19th Over Deliveries with Distinct Tactical Field Settings
    # Coordinates: (0, 0) is batter.
    # +X is off-side, -X is leg-side. +Y is straight toward boundary, -Y is behind batter.
    # Wicketkeeper is placed at (0.0, -0.22) with is_wicketkeeper=True.
    # Exactly 9 fielders per delivery with is_wicketkeeper=False.

    deliveries_data = [
        # --- Ball 1 ---
        {
            "id": "del-demo-inn2-ov19-b1",
            "innings": 2,
            "over_number": 19,
            "ball_number": 1,
            "batter_id": "ply-mav-06",  # Vikramaditya Roy (RHB)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 0,
            "wickets": 0,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "Nair starts the 19th over with a scorching 144.2 kph wide-line yorker. Roy reaches out for a slice, but jams it into the turf towards backward point. No run.",
            "speed_kph": 144.2,
            "line": "wide_outside_off",
            "length": "yorker",
            "shot_type": "toe-end carve",
            "config_name": "Off-Side Death Lock (6-3 Off-Side Heavy)",
            "fielders": [
                # 9 fielders
                {"player_id": "ply-titan-11", "pos": "Deep Backward Point", "x": 0.82, "y": 0.05},
                {"player_id": "ply-titan-09", "pos": "Deep Third Man", "x": 0.65, "y": -0.45},
                {"player_id": "ply-titan-10", "pos": "Cover Point (Ring)", "x": 0.42, "y": 0.30},
                {"player_id": "ply-titan-01", "pos": "Extra Cover (Ring)", "x": 0.45, "y": 0.55},
                {"player_id": "ply-titan-04", "pos": "Mid-off (Ring)", "x": 0.18, "y": 0.60},
                {"player_id": "ply-titan-05", "pos": "Sweeper Cover", "x": 0.86, "y": 0.40},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": -0.25, "y": 0.85},
                {"player_id": "ply-titan-06", "pos": "Short Mid-Wicket", "x": -0.35, "y": 0.30},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": -0.78, "y": 0.38},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
        # --- Ball 2 ---
        {
            "id": "del-demo-inn2-ov19-b2",
            "innings": 2,
            "over_number": 19,
            "ball_number": 2,
            "batter_id": "ply-mav-06",  # Vikramaditya Roy (RHB)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 1,
            "wickets": 0,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "Mid-off was pushed back to long-off, and Nair delivers a full ball at 142 kph. Roy drives hard down the ground to long-off for a single.",
            "speed_kph": 142.0,
            "line": "outside_off",
            "length": "full",
            "shot_type": "driven straight",
            "config_name": "Dual Deep Outfield Shield (Long-Off Dropped Back)",
            "fielders": [
                # Kavish Patel dropped from Mid-off (0.18, 0.60) to Long-off (0.30, 0.85)
                # Liam Cooper made Deep Third Man squarer (0.72, -0.30)
                {"player_id": "ply-titan-11", "pos": "Deep Backward Point", "x": 0.82, "y": 0.05, "has_moved": False},
                {"player_id": "ply-titan-09", "pos": "Deep Fly Slip", "x": 0.72, "y": -0.30, "has_moved": True, "prev_x": 0.65, "prev_y": -0.45, "prev_pos": "Deep Third Man"},
                {"player_id": "ply-titan-10", "pos": "Cover Point (Ring)", "x": 0.48, "y": 0.32, "has_moved": True, "prev_x": 0.42, "prev_y": 0.30, "prev_pos": "Cover Point (Ring)"},
                {"player_id": "ply-titan-01", "pos": "Extra Cover (Ring)", "x": 0.45, "y": 0.55, "has_moved": False},
                {"player_id": "ply-titan-04", "pos": "Long-off", "x": 0.30, "y": 0.85, "has_moved": True, "prev_x": 0.18, "prev_y": 0.60, "prev_pos": "Mid-off (Ring)"},
                {"player_id": "ply-titan-05", "pos": "Sweeper Cover", "x": 0.86, "y": 0.40, "has_moved": False},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": -0.25, "y": 0.85, "has_moved": False},
                {"player_id": "ply-titan-06", "pos": "Short Mid-Wicket", "x": -0.35, "y": 0.30, "has_moved": False},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": -0.78, "y": 0.38, "has_moved": False},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
        # --- Ball 3 ---
        {
            "id": "del-demo-inn2-ov19-b3",
            "innings": 2,
            "over_number": 19,
            "ball_number": 3,
            "batter_id": "ply-mav-04",  # Kabir Malhotra (RHB)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 0,
            "wickets": 1,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "BOWLED HIM! Nair fires a 145.5 kph reverse-swinging yorker that tails in late, beating Malhotra for pace and uprooting the leg stump! Huge breakthrough for the Titans!",
            "speed_kph": 145.5,
            "line": "stumps",
            "length": "yorker",
            "shot_type": "bowled",
            "config_name": "Stump Attack & Infield Squeeze (5-4 Balanced)",
            "fielders": [
                # Sweeper cover Marcus Vance pulled inside to Short Fine Leg to reinforce pads trap
                {"player_id": "ply-titan-11", "pos": "Deep Backward Point", "x": 0.82, "y": 0.05, "has_moved": False},
                {"player_id": "ply-titan-09", "pos": "Deep Fly Slip", "x": 0.72, "y": -0.30, "has_moved": False},
                {"player_id": "ply-titan-10", "pos": "Cover Point (Ring)", "x": 0.48, "y": 0.32, "has_moved": False},
                {"player_id": "ply-titan-01", "pos": "Extra Cover (Ring)", "x": 0.45, "y": 0.55, "has_moved": False},
                {"player_id": "ply-titan-04", "pos": "Long-off", "x": 0.30, "y": 0.85, "has_moved": False},
                {"player_id": "ply-titan-05", "pos": "Short Fine Leg", "x": -0.25, "y": -0.28, "has_moved": True, "prev_x": 0.86, "prev_y": 0.40, "prev_pos": "Sweeper Cover"},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": -0.25, "y": 0.85, "has_moved": False},
                {"player_id": "ply-titan-06", "pos": "Short Mid-Wicket", "x": -0.35, "y": 0.30, "has_moved": False},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": -0.80, "y": 0.35, "has_moved": True, "prev_x": -0.78, "prev_y": 0.38, "prev_pos": "Deep Mid-Wicket"},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
        # --- Ball 4 ---
        {
            "id": "del-demo-inn2-ov19-b4",
            "innings": 2,
            "over_number": 19,
            "ball_number": 4,
            "batter_id": "ply-mav-07",  # Aditya Roy (LHB incoming batter)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 1,
            "wickets": 0,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "Field shifts for the new left-hander: First slip placed. Nair bowls full outside off, Aditya stabs it past slip for a quick single to rotate strike.",
            "speed_kph": 141.8,
            "line": "outside_off",
            "length": "good_length",
            "shot_type": "glanced",
            "config_name": "Left-Hander Slip Trap & Outfield Spread",
            "fielders": [
                # Devraj Singh brought in as First Slip for the incoming LHB
                {"player_id": "ply-titan-01", "pos": "First Slip (LHB)", "x": -0.15, "y": -0.25, "has_moved": True, "prev_x": 0.45, "prev_y": 0.55, "prev_pos": "Extra Cover (Ring)"},
                {"player_id": "ply-titan-11", "pos": "Deep Point", "x": -0.82, "y": 0.10, "has_moved": True, "prev_x": 0.82, "prev_y": 0.05, "prev_pos": "Deep Backward Point"},
                {"player_id": "ply-titan-09", "pos": "Deep Third Man", "x": -0.68, "y": -0.42, "has_moved": True, "prev_x": 0.72, "prev_y": -0.30, "prev_pos": "Deep Fly Slip"},
                {"player_id": "ply-titan-10", "pos": "Short Extra Cover", "x": -0.40, "y": 0.35, "has_moved": True, "prev_x": 0.48, "prev_y": 0.32, "prev_pos": "Cover Point (Ring)"},
                {"player_id": "ply-titan-04", "pos": "Mid-off", "x": -0.20, "y": 0.60, "has_moved": True, "prev_x": 0.30, "prev_y": 0.85, "prev_pos": "Long-off"},
                {"player_id": "ply-titan-05", "pos": "Deep Square Leg", "x": 0.82, "y": -0.10, "has_moved": True, "prev_x": -0.25, "prev_y": -0.28, "prev_pos": "Short Fine Leg"},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": 0.25, "y": 0.85, "has_moved": True, "prev_x": -0.25, "prev_y": 0.85, "prev_pos": "Long-on"},
                {"player_id": "ply-titan-06", "pos": "Mid-wicket (Ring)", "x": 0.35, "y": 0.32, "has_moved": True, "prev_x": -0.35, "prev_y": 0.30, "prev_pos": "Short Mid-Wicket"},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": 0.78, "y": 0.40, "has_moved": True, "prev_x": -0.80, "prev_y": 0.35, "prev_pos": "Deep Mid-Wicket"},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
        # --- Ball 5 ---
        {
            "id": "del-demo-inn2-ov19-b5",
            "innings": 2,
            "over_number": 19,
            "ball_number": 5,
            "batter_id": "ply-mav-06",  # Vikramaditya Roy (back on strike, RHB)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 0,
            "wickets": 0,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "Field resets for Roy. Nair digs in a sharp bouncer at 143.8 kph. Roy attempts an aggressive hook shot, but is beaten by the steep bounce. Dot ball!",
            "speed_kph": 143.8,
            "line": "stumps",
            "length": "short",
            "shot_type": "hook miss",
            "config_name": "Short Ball Ambush (Deep Leg Duo)",
            "fielders": [
                # Slip removed; 2 deep leg side boundary riders
                {"player_id": "ply-titan-01", "pos": "Extra Cover (Ring)", "x": 0.45, "y": 0.55, "has_moved": True, "prev_x": -0.15, "prev_y": -0.25, "prev_pos": "First Slip (LHB)"},
                {"player_id": "ply-titan-11", "pos": "Deep Backward Point", "x": 0.82, "y": 0.05, "has_moved": True, "prev_x": -0.82, "prev_y": 0.10, "prev_pos": "Deep Point"},
                {"player_id": "ply-titan-09", "pos": "Deep Third Man", "x": 0.65, "y": -0.45, "has_moved": True, "prev_x": -0.68, "prev_y": -0.42, "prev_pos": "Deep Third Man"},
                {"player_id": "ply-titan-10", "pos": "Cover Point (Ring)", "x": 0.42, "y": 0.30, "has_moved": True, "prev_x": -0.40, "prev_y": 0.35, "prev_pos": "Short Extra Cover"},
                {"player_id": "ply-titan-04", "pos": "Long-off", "x": 0.30, "y": 0.85, "has_moved": True, "prev_x": -0.20, "prev_y": 0.60, "prev_pos": "Mid-off"},
                {"player_id": "ply-titan-05", "pos": "Deep Fine Leg", "x": -0.65, "y": -0.45, "has_moved": True, "prev_x": 0.82, "prev_y": -0.10, "prev_pos": "Deep Square Leg"},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": -0.25, "y": 0.85, "has_moved": True, "prev_x": 0.25, "prev_y": 0.85, "prev_pos": "Long-on"},
                {"player_id": "ply-titan-06", "pos": "Short Mid-Wicket", "x": -0.35, "y": 0.30, "has_moved": True, "prev_x": 0.35, "prev_y": 0.32, "prev_pos": "Mid-wicket (Ring)"},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": -0.80, "y": 0.35, "has_moved": True, "prev_x": 0.78, "prev_y": 0.40, "prev_pos": "Deep Mid-Wicket"},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
        # --- Ball 6 ---
        {
            "id": "del-demo-inn2-ov19-b6",
            "innings": 2,
            "over_number": 19,
            "ball_number": 6,
            "batter_id": "ply-mav-06",  # Vikramaditya Roy (RHB)
            "bowler_id": "ply-titan-02",  # Aravind Nair (RF)
            "runs": 1,
            "wickets": 0,
            "extras": 0,
            "delivery_type": "legal",
            "commentary": "Final ball of the 19th over. Nair lands a pinpoint yorker outside off. Roy squeezes it through cover for a single. Brilliant over from Nair conceding only 3 runs and taking a wicket!",
            "speed_kph": 144.0,
            "line": "outside_off",
            "length": "yorker",
            "shot_type": "sliced drive",
            "config_name": "Ultimate Death Boundary Guard (5 Men on Fence)",
            "fielders": [
                # Sweeper cover added back to protect boundary
                {"player_id": "ply-titan-01", "pos": "Sweeper Cover", "x": 0.85, "y": 0.42, "has_moved": True, "prev_x": 0.45, "prev_y": 0.55, "prev_pos": "Extra Cover (Ring)"},
                {"player_id": "ply-titan-11", "pos": "Deep Backward Point", "x": 0.82, "y": 0.05, "has_moved": False},
                {"player_id": "ply-titan-09", "pos": "Deep Third Man", "x": 0.65, "y": -0.45, "has_moved": False},
                {"player_id": "ply-titan-10", "pos": "Cover Point (Ring)", "x": 0.42, "y": 0.30, "has_moved": False},
                {"player_id": "ply-titan-04", "pos": "Mid-off (Ring)", "x": 0.20, "y": 0.58, "has_moved": True, "prev_x": 0.30, "prev_y": 0.85, "prev_pos": "Long-off"},
                {"player_id": "ply-titan-05", "pos": "Short Fine Leg", "x": -0.28, "y": -0.25, "has_moved": True, "prev_x": -0.65, "prev_y": -0.45, "prev_pos": "Deep Fine Leg"},
                {"player_id": "ply-titan-07", "pos": "Long-on", "x": -0.25, "y": 0.85, "has_moved": False},
                {"player_id": "ply-titan-06", "pos": "Short Mid-Wicket", "x": -0.35, "y": 0.30, "has_moved": False},
                {"player_id": "ply-titan-08", "pos": "Deep Mid-Wicket", "x": -0.80, "y": 0.35, "has_moved": False},
            ],
            "keeper": {"player_id": "ply-titan-03", "pos": "Wicketkeeper", "x": 0.0, "y": -0.22},
        },
    ]

    for d_idx, d_data in enumerate(deliveries_data):
        deliv = Delivery(
            id=d_data["id"],
            match_id=demo_match_id,
            innings=d_data["innings"],
            over_number=d_data["over_number"],
            ball_number=d_data["ball_number"],
            batter_id=d_data["batter_id"],
            bowler_id=d_data["bowler_id"],
            runs=d_data["runs"],
            wickets=d_data["wickets"],
            extras=d_data["extras"],
            delivery_type=d_data["delivery_type"],
            commentary=d_data["commentary"],
            speed_kph=d_data["speed_kph"],
            line=d_data["line"],
            length=d_data["length"],
            shot_type=d_data["shot_type"],
            timestamp=datetime.now(timezone.utc),
        )
        db.add(deliv)
        db.flush()

        # Add Field Configuration
        field_cfg = FieldConfiguration(
            id=f"cfg-{deliv.id}",
            match_id=demo_match_id,
            delivery_id=deliv.id,
            configuration_name=d_data["config_name"],
            created_at=datetime.now(timezone.utc),
        )
        db.add(field_cfg)

        # Add Wicketkeeper
        wk_data = d_data["keeper"]
        wk_fielder = Fielder(
            id=f"fld-{deliv.id}-wk",
            player_id=wk_data["player_id"],
            fielding_position=wk_data["pos"],
            x=wk_data["x"],
            y=wk_data["y"],
            is_wicketkeeper=True,
            delivery_id=deliv.id,
            has_moved=False,
        )
        db.add(wk_fielder)

        # Add 9 Outfield/Infield Fielders
        for f_idx, f_info in enumerate(d_data["fielders"]):
            fld = Fielder(
                id=f"fld-{deliv.id}-{f_idx + 1}",
                player_id=f_info["player_id"],
                fielding_position=f_info["pos"],
                x=f_info["x"],
                y=f_info["y"],
                is_wicketkeeper=False,
                delivery_id=deliv.id,
                has_moved=f_info.get("has_moved", False),
                prev_x=f_info.get("prev_x"),
                prev_y=f_info.get("prev_y"),
                prev_position=f_info.get("prev_pos"),
            )
            db.add(fld)

    db.commit()
    logger.info(f"Successfully seeded demo match '{demo_match_id}' with 22 players and 6 delivery configurations.")
    return demo_match_id


if __name__ == "__main__":
    db = SessionLocal()
    try:
        seed_demo_data(db)
    finally:
        db.close()


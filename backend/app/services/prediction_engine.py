import math
import numpy as np
from datetime import datetime, timezone
from typing import List, Dict, Any, Tuple, Optional
from shapely.geometry import Point, Polygon
from app.schemas.live import (
    RealtimeFieldPrediction,
    VulnerableCorridor,
    DismissalRisk,
)
from app.simulator.geometry_engine import PLAYABLE_GROUND, GROUND_SCALE_METERS
from app.services.ai_service import AIService

class PredictionEngine:
    """
    Advanced mathematical & geometric engine that predicts next-ball scoring probabilities,
    vulnerable ground corridors, optimal shot trajectories, and wicket risks based strictly
    on real-time fielder coordinates, batter handedness, and bowling traps.
    """

    def __init__(self):
        self.ai_service = AIService()

    @staticmethod
    def _to_polar(x: float, y: float) -> Tuple[float, float]:
        """Convert Cartesian (x, y) with (0,0) at batter to (radius, angle_deg)."""
        radius = math.hypot(x, y)
        # angle in degrees: 0° is straight down the ground (+Y),
        # positive degrees to off-side (+X), negative to leg-side (-X)
        angle_rad = math.atan2(x, y)
        angle_deg = math.degrees(angle_rad)
        return radius, angle_deg

    @staticmethod
    def _create_wedge_coords(start_deg: float, end_deg: float, min_r: float = 0.25, max_r: float = 0.96) -> List[List[float]]:
        """Generate polygon coordinates for an angular sector wedge for SVG visualization."""
        if start_deg > end_deg:
            angles = np.linspace(start_deg, end_deg + 360, 16)
        else:
            angles = np.linspace(start_deg, end_deg, 16)
            
        outer_pts = []
        for a in angles:
            rad = math.radians(a)
            # x = r * sin(theta), y = r * cos(theta)
            outer_pts.append([round(float(max_r * math.sin(rad)), 4), round(float(max_r * math.cos(rad)), 4)])
            
        inner_pts = []
        for a in reversed(angles):
            rad = math.radians(a)
            inner_pts.append([round(float(min_r * math.sin(rad)), 4), round(float(min_r * math.cos(rad)), 4)])
            
        return outer_pts + inner_pts

    def predict(
        self,
        match_id: str,
        over_number: int,
        ball_number: int,
        batter_name: str,
        bowler_name: str,
        fielders: List[Dict[str, Any]],
        delivery_id: Optional[str] = None,
        batter_style: str = "Right-hand bat",
        bowler_style: str = "Right-arm fast",
        recent_context: Optional[str] = None,
    ) -> RealtimeFieldPrediction:
        """
        Evaluate real-time field configuration and calculate quantitative predictions.
        """
        # Filter active non-keeper fielders and categorize
        non_keepers = [f for f in fielders if not f.get("is_wicketkeeper", False)]
        
        # Count spatial metrics
        offside_count = sum(1 for f in non_keepers if f.get("x", 0) > 0.02)
        legside_count = sum(1 for f in non_keepers if f.get("x", 0) < -0.02)
        
        # Polar classifications
        polar_fielders = []
        boundary_riders = []
        ring_fielders = []
        
        for f in non_keepers:
            fx, fy = float(f.get("x", 0)), float(f.get("y", 0))
            r, deg = self._to_polar(fx, fy)
            item = {
                "name": f.get("player_name") or f.get("fielding_position", "Fielder"),
                "pos": f.get("fielding_position", "Fielder"),
                "x": fx,
                "y": fy,
                "r": r,
                "deg": deg,
            }
            polar_fielders.append(item)
            if r >= 0.42:
                boundary_riders.append(item)
            else:
                ring_fielders.append(item)

        total_boundary_riders = len(boundary_riders)
        total_ring_fielders = len(ring_fielders)
        
        field_balance = f"{offside_count}-{legside_count} {'Off-side Heavy' if offside_count > legside_count else 'Leg-side Heavy' if legside_count > offside_count else 'Balanced'} ({total_boundary_riders} on Boundary)"

        # -------------------------------------------------------------
        # 1. Angular Gap & Vulnerable Corridor Detection
        # -------------------------------------------------------------
        # Examine primary scoring arcs:
        # Off-side:
        #   3rd Man / Backward Point: 110° to 150°
        #   Point to Cover: 50° to 90°
        #   Extra Cover to Long-Off: 10° to 45°
        # Straight: -10° to 10°
        # Leg-side:
        #   Long-On to Midwicket: -10° to -45°
        #   Midwicket to Square Leg: -45° to -85°
        #   Backward Square to Fine Leg: -85° to -145°
        
        standard_sectors = [
            {"name": "Third Man / Deep Gully", "start": 105.0, "end": 145.0, "desc": "Vacant upper-cut / late-glide channel behind point."},
            {"name": "Deep Cover / Point Gap", "start": 50.0, "end": 90.0, "desc": "Square drive corridor through point and cover."},
            {"name": "Extra Cover / Long-Off Alley", "start": 15.0, "end": 45.0, "desc": "Corridor for inside-out lofted drives over extra cover."},
            {"name": "Straight V / Long-On", "start": -15.0, "end": 15.0, "desc": "Down-the-ground arc between long-off and long-on."},
            {"name": "Cow Corner / Deep Midwicket Arc", "start": -65.0, "end": -25.0, "desc": "Primary high-percentage slog sweep and pull target zone."},
            {"name": "Deep Square Leg / Fine Leg", "start": -140.0, "end": -75.0, "desc": "Behind square leg arc for hooks, sweeps, and scoops."},
        ]

        vulnerable_corridors: List[VulnerableCorridor] = []
        
        for sector in standard_sectors:
            s_start, s_end = sector["start"], sector["end"]
            # Find boundary riders covering this sector
            riders_in_sector = [
                b for b in boundary_riders 
                if min(s_start, s_end) <= b["deg"] <= max(s_start, s_end)
            ]
            ring_in_sector = [
                r for r in ring_fielders 
                if min(s_start, s_end) <= r["deg"] <= max(s_start, s_end)
            ]
            
            span_deg = abs(s_end - s_start)
            # Physical arc width on boundary in meters: arc = radius * angle_rad (radius ~ 68m)
            gap_width_m = round(68.0 * math.radians(span_deg), 1)
            
            if len(riders_in_sector) == 0:
                if len(ring_in_sector) == 0:
                    boundary_risk = "CRITICAL"
                    explanation = f"Completely unguarded: 0 fielders in ring or boundary. Massive {gap_width_m}m open corridor."
                else:
                    boundary_risk = "HIGH"
                    ring_names = ", ".join(r["pos"] for r in ring_in_sector)
                    explanation = f"No boundary sweeper. Only {ring_names} in the 30-yard ring; once breached, guarantees 4 runs."
                
                vulnerable_corridors.append(
                    VulnerableCorridor(
                        zone_name=sector["name"],
                        start_angle_deg=s_start,
                        end_angle_deg=s_end,
                        gap_width_meters=gap_width_m,
                        boundary_risk=boundary_risk,
                        explanation=explanation,
                        sector_coords=self._create_wedge_coords(s_start, s_end),
                    )
                )
            elif len(riders_in_sector) == 1 and span_deg >= 45.0:
                boundary_risk = "MODERATE"
                explanation = f"Single boundary rider ({riders_in_sector[0]['pos']}) patrolling a wide {gap_width_m}m arc."
                vulnerable_corridors.append(
                    VulnerableCorridor(
                        zone_name=sector["name"],
                        start_angle_deg=s_start,
                        end_angle_deg=s_end,
                        gap_width_meters=gap_width_m,
                        boundary_risk=boundary_risk,
                        explanation=explanation,
                        sector_coords=self._create_wedge_coords(s_start, s_end),
                    )
                )

        # Sort corridors by severity
        risk_rank = {"CRITICAL": 3, "HIGH": 2, "MODERATE": 1, "LOW": 0}
        vulnerable_corridors.sort(key=lambda c: (risk_rank.get(c.boundary_risk, 0), c.gap_width_meters), reverse=True)
        # Keep top 3 most critical
        top_vulnerabilities = vulnerable_corridors[:3]

        # -------------------------------------------------------------
        # 2. Predicted Shot Selection & Optimal Trajectory
        # -------------------------------------------------------------
        if top_vulnerabilities:
            primary_gap = top_vulnerabilities[0]
            mid_angle = (primary_gap.start_angle_deg + primary_gap.end_angle_deg) / 2.0
            rad = math.radians(mid_angle)
            shot_target_x = round(0.85 * math.sin(rad), 3)
            shot_target_y = round(0.85 * math.cos(rad), 3)
            
            if 15.0 <= mid_angle <= 55.0:
                predicted_shot = "Inside-out lofted drive through Extra Cover"
            elif 55.0 < mid_angle <= 100.0:
                predicted_shot = "Square cut or punched drive past Point"
            elif 100.0 < mid_angle <= 155.0:
                predicted_shot = "Upper-cut or guided ramp to Third Man"
            elif -40.0 <= mid_angle <= 15.0:
                predicted_shot = "Straight lofted hit or punch down the ground"
            elif -80.0 <= mid_angle < -40.0:
                predicted_shot = "Hard pull shot or slog-sweep towards Cow Corner"
            elif -155.0 <= mid_angle < -80.0:
                predicted_shot = "Paddle scoop or fine glance behind Square Leg"
            else:
                predicted_shot = "Lofted stroke into open boundary pocket"
        else:
            mid_angle = 30.0
            shot_target_x, shot_target_y = 0.45, 0.75
            predicted_shot = "Punch into extra-cover gap"

        # -------------------------------------------------------------
        # 3. Deterministic Outcome Probabilities & Expected Runs
        # -------------------------------------------------------------
        # Base probabilities influenced by field balance and boundary riders
        num_crit = sum(1 for c in top_vulnerabilities if c.boundary_risk == "CRITICAL")
        num_high = sum(1 for c in top_vulnerabilities if c.boundary_risk == "HIGH")
        
        # In T20 death overs:
        # Boundary rider count usually 4 or 5
        base_boundary_four = 0.14 + (0.05 * num_crit) + (0.02 * num_high)
        if total_boundary_riders < 4:
            base_boundary_four += 0.08  # Severe boundary vulnerability
        elif total_boundary_riders == 5:
            base_boundary_four -= 0.02

        base_six = 0.06 + (0.025 * num_crit)
        base_dot = 0.32 + (0.02 * total_ring_fielders) - (0.03 * num_crit)
        base_wicket = 0.085  # T20 death ball wicket probability
        
        # Bowling trap adjustments
        has_slips = any(f["pos"].lower() in ["slip", "first slip", "second slip"] for f in polar_fielders)
        has_deep_cover = any("deep cover" in f["pos"].lower() or "sweeper" in f["pos"].lower() for f in polar_fielders)
        has_deep_midwicket = any("deep mid" in f["pos"].lower() or "cow corner" in f["pos"].lower() for f in polar_fielders)

        if has_slips:
            base_wicket += 0.03
            base_dot += 0.03
        if has_deep_cover and has_deep_midwicket and total_boundary_riders >= 4:
            # Well structured defensive field
            base_wicket += 0.025
            base_dot += 0.03
            base_boundary_four -= 0.03

        # Clamp and normalize
        p_four = min(0.35, max(0.08, base_boundary_four))
        p_six = min(0.20, max(0.03, base_six))
        p_dot = min(0.55, max(0.22, base_dot))
        p_single = max(0.18, 1.0 - (p_dot + p_four + p_six))
        
        # Re-normalize to exactly 1.00
        total_p = p_dot + p_single + p_four + p_six
        p_dot = round(p_dot / total_p, 3)
        p_single = round(p_single / total_p, 3)
        p_four = round(p_four / total_p, 3)
        p_six = round(1.0 - (p_dot + p_single + p_four), 3)
        
        p_wicket = round(min(0.22, max(0.05, base_wicket)), 3)

        # Expected runs: 0 * p_dot + 1.25 * p_single + 4 * p_four + 6 * p_six
        expected_runs = round((0.0 * p_dot) + (1.25 * p_single) + (4.0 * p_four) + (6.0 * p_six), 2)

        # -------------------------------------------------------------
        # 4. Wicket Trap & Dismissal Mechanism
        # -------------------------------------------------------------
        dismissal_risks: List[DismissalRisk] = []
        
        if has_slips:
            dismissal_risks.append(
                DismissalRisk(
                    mode="Edged Behind (Keeper / Slips)",
                    probability=0.38,
                    field_trap_description="Slip cordon active. Out-swinger or cutter tempting edge off forward defensive poke.",
                )
            )
            
        if has_deep_cover:
            dismissal_risks.append(
                DismissalRisk(
                    mode="Caught at Deep Cover / Point",
                    probability=0.34,
                    field_trap_description="Deep boundary sweeper positioned. Bowler targeting wide yorker line outside off stump.",
                )
            )
            
        if has_deep_midwicket:
            dismissal_risks.append(
                DismissalRisk(
                    mode="Caught at Deep Midwicket / Long-On",
                    probability=0.36,
                    field_trap_description="Boundary catcher placed at 65m mark. Slower bouncer or into-the-pitch delivery baiting pull.",
                )
            )

        dismissal_risks.append(
            DismissalRisk(
                mode="Bowled / LBW (Stump Attack)",
                probability=0.22,
                field_trap_description="Fast yorker or slider aimed at base of middle/off when batter moves across to exploit field gaps.",
            )
        )
        
        dismissal_risks.sort(key=lambda d: d.probability, reverse=True)
        primary_trap = dismissal_risks[0].field_trap_description if dismissal_risks else "Standard run-restriction pressure."

        # -------------------------------------------------------------
        # 5. Broadcast Insight Generation (Grounded)
        # -------------------------------------------------------------
        top_corridor_name = top_vulnerabilities[0].zone_name if top_vulnerabilities else "the off-side ring"
        gap_m = top_vulnerabilities[0].gap_width_meters if top_vulnerabilities else 25.0
        
        broadcast_prompt = (
            f"Act as a premier international TV cricket analyst (e.g. Nasser Hussain / Ravi Shastri). "
            f"Deliver a crisp 2-sentence tactical broadcast breakdown for the upcoming delivery in T20 death overs.\n"
            f"Match Context: {bowler_name} ({bowler_style}) bowling to {batter_name} ({batter_style}). "
            f"Field Placement: {field_balance}, {total_boundary_riders} boundary riders. "
            f"Critical Gap: {top_corridor_name} ({gap_m}m wide open gap). "
            f"Predicted Shot: {predicted_shot}. "
            f"Expected Runs on ball: {expected_runs} xR, {int(p_four*100)}% Boundary Risk, {int(p_wicket*100)}% Wicket Threat.\n"
            f"Explain what the bowler must execute and what trap is set."
        )

        try:
            ai_insight = self.ai_service.generate_gemini_analysis(broadcast_prompt)
            if not ai_insight or len(ai_insight.strip()) < 20:
                ai_insight = (
                    f"With a {field_balance} and {total_boundary_riders} riders out, {bowler_name} has set a targeted boundary trap. "
                    f"However, leaving {top_corridor_name} unprotected yields a {int(p_four * 100)}% boundary conversion if the bowler misses line."
                )
        except Exception:
            ai_insight = (
                f"With a {field_balance} and {total_boundary_riders} riders out, {bowler_name} has set a targeted boundary trap. "
                f"However, leaving {top_corridor_name} unprotected yields a {int(p_four * 100)}% boundary conversion if the bowler misses line."
            )

        return RealtimeFieldPrediction(
            match_id=match_id,
            delivery_id=delivery_id,
            over_number=over_number,
            ball_number=ball_number,
            batter_name=batter_name,
            bowler_name=bowler_name,
            dot_probability=p_dot,
            single_probability=p_single,
            boundary_four_probability=p_four,
            maximum_six_probability=p_six,
            wicket_probability=p_wicket,
            expected_runs=expected_runs,
            field_balance=field_balance,
            offside_fielders=offside_count,
            legside_fielders=legside_count,
            boundary_riders=total_boundary_riders,
            inner_ring_fielders=total_ring_fielders,
            vulnerable_corridors=top_vulnerabilities,
            predicted_shot_type=predicted_shot,
            predicted_shot_angle_deg=mid_angle,
            predicted_shot_target=[shot_target_x, shot_target_y],
            dismissal_risks=dismissal_risks[:3],
            primary_trap=primary_trap,
            ai_broadcast_insight=ai_insight.strip(),
            timestamp=datetime.now(timezone.utc).isoformat(),
        )


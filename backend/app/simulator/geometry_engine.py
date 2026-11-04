import math
from typing import List, Dict, Any, Tuple
import numpy as np
from shapely.geometry import Point, Polygon, LineString
from shapely.affinity import scale as shapely_scale

GROUND_SCALE_METERS = 75.0  # 1.0 normalized unit = 75 meters


def create_ground_polygon() -> Polygon:
    """Create an elliptical boundary polygon representing the playable cricket field."""
    # Semi-major axis (straight): 1.0 unit (75m), Semi-minor axis (square): 0.90 units (67.5m)
    # Centered around (0, -0.10) to accommodate pitch placement
    angles = np.linspace(0, 2 * np.pi, 120)
    rx = 0.92
    ry = 0.98
    cy = -0.08
    pts = [(rx * np.cos(a), cy + ry * np.sin(a)) for a in angles]
    return Polygon(pts)


def create_sector_polygon(start_angle_deg: float, end_angle_deg: float, min_r: float = 0.15, max_r: float = 0.95) -> Polygon:
    """Create a pie wedge / sector polygon for a tactical region."""
    angles = np.linspace(np.radians(start_angle_deg), np.radians(end_angle_deg), 25)
    outer_pts = [(max_r * np.sin(a), max_r * np.cos(a)) for a in angles]
    inner_pts = [(min_r * np.sin(a), min_r * np.cos(a)) for a in reversed(angles)]
    return Polygon(outer_pts + inner_pts)


# Pre-defined ground and tactical zone polygons
PLAYABLE_GROUND = create_ground_polygon()

TACTICAL_ZONE_POLYGONS = {
    "cover": create_sector_polygon(30.0, 58.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "extra_cover": create_sector_polygon(15.0, 35.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "mid_off": create_sector_polygon(0.0, 20.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "midwicket": create_sector_polygon(-60.0, -25.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "point": create_sector_polygon(60.0, 95.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "square_leg": create_sector_polygon(-95.0, -60.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
    "mid_on": create_sector_polygon(-25.0, 0.0, 0.18, 0.95).intersection(PLAYABLE_GROUND),
}

SCENARIO_CONFIGS = {
    "cover": {
        "name": "Ground shot through Cover",
        "description": "Hypothetical ground stroke driven through the cover corridor (30° - 58° off-side).",
        "target_zone": "cover",
        "adjacent_zones": ["extra_cover", "mid_off", "point"],
        "trajectory": LineString([(0.0, 0.0), (0.28, 0.32), (0.55, 0.62), (0.75, 0.85)]),
        "corridor_width_m": 8.5,
    },
    "extra_cover": {
        "name": "Ground shot through Extra Cover",
        "description": "Hypothetical ground stroke driven through extra cover (15° - 35° off-side).",
        "target_zone": "extra_cover",
        "adjacent_zones": ["cover", "mid_off", "mid_on"],
        "trajectory": LineString([(0.0, 0.0), (0.16, 0.36), (0.35, 0.75), (0.44, 0.95)]),
        "corridor_width_m": 8.0,
    },
    "mid_off": {
        "name": "Ground shot through Mid-off",
        "description": "Hypothetical straight drive through mid-off (0° - 20° off-side).",
        "target_zone": "mid_off",
        "adjacent_zones": ["extra_cover", "cover", "mid_on"],
        "trajectory": LineString([(0.0, 0.0), (0.07, 0.38), (0.15, 0.82), (0.18, 0.96)]),
        "corridor_width_m": 7.5,
    },
    "midwicket": {
        "name": "Ground shot through Midwicket",
        "description": "Hypothetical on-drive or pull stroke driven through midwicket (-60° - -25° leg-side).",
        "target_zone": "midwicket",
        "adjacent_zones": ["mid_on", "square_leg"],
        "trajectory": LineString([(0.0, 0.0), (-0.28, 0.30), (-0.58, 0.58), (-0.78, 0.78)]),
        "corridor_width_m": 9.0,
    },
}


class GeometrySimulationEngine:
    @staticmethod
    def sample_polygon_grid(polygon: Polygon, grid_spacing_norm: float = 0.04) -> List[Tuple[float, float]]:
        """Sample valid grid coordinates strictly inside the target polygon and playable ground."""
        minx, miny, maxx, maxy = polygon.bounds
        xs = np.arange(minx, maxx + grid_spacing_norm / 2, grid_spacing_norm)
        ys = np.arange(miny, maxy + grid_spacing_norm / 2, grid_spacing_norm)

        valid_points = []
        for x in xs:
            for y in ys:
                pt = Point(x, y)
                if polygon.contains(pt) and PLAYABLE_GROUND.contains(pt):
                    valid_points.append((float(round(x, 4)), float(round(y, 4))))

        return valid_points

    @staticmethod
    def evaluate_points(
        points: List[Tuple[float, float]],
        fielders: List[Dict[str, Any]],
        trajectory: LineString,
        corridor_width_m: float,
        reaction_time_sec: float,
        fielder_speed_mps: float,
        ball_speed_mps: float,
    ) -> Dict[str, Any]:
        """
        Evaluate coverage for a list of target points under deterministic kinematic assumptions:
        - Point is covered if at least one fielder reaches it before ball arrival.
        - Only points within the corridor width of the trajectory are evaluated.
        """
        if not points:
            return {
                "covered_points": [],
                "exposed_points": [],
                "coverage_pct": 0.0,
                "total_valid_points": 0,
            }

        corridor_width_norm = corridor_width_m / GROUND_SCALE_METERS
        covered_points = []
        exposed_points = []

        fielder_positions = [(f["x"], f["y"]) for f in fielders]

        for px, py in points:
            pt = Point(px, py)
            # Distance perpendicular to trajectory
            dist_to_traj_norm = trajectory.distance(pt)
            if dist_to_traj_norm > corridor_width_norm:
                continue

            # Projected distance along trajectory
            proj_dist_norm = trajectory.project(pt)
            proj_dist_m = max(0.5, proj_dist_norm * GROUND_SCALE_METERS)
            ball_arrival_time = proj_dist_m / ball_speed_mps

            # Check if any fielder can intercept
            is_covered = False
            for fx, fy in fielder_positions:
                dist_m = math.sqrt((fx - px) ** 2 + (fy - py) ** 2) * GROUND_SCALE_METERS
                fielder_time = reaction_time_sec + (dist_m / fielder_speed_mps)
                if fielder_time <= ball_arrival_time:
                    is_covered = True
                    break

            pt_dict = {"x": px, "y": py}
            if is_covered:
                covered_points.append(pt_dict)
            else:
                exposed_points.append(pt_dict)

        total_evaluated = len(covered_points) + len(exposed_points)
        coverage_pct = round((len(covered_points) / total_evaluated * 100.0), 1) if total_evaluated > 0 else 0.0

        return {
            "covered_points": covered_points,
            "exposed_points": exposed_points,
            "coverage_pct": coverage_pct,
            "total_valid_points": total_evaluated,
        }

    @classmethod
    def evaluate_field_scenario(
        cls,
        scenario_key: str,
        original_fielders: List[Dict[str, Any]],
        custom_fielders: List[Dict[str, Any]],
        reaction_time_sec: float = 0.40,
        fielder_speed_mps: float = 6.0,
        ball_speed_mps: float = 28.0,
        grid_spacing_m: float = 2.5,
    ) -> Dict[str, Any]:
        """
        Execute full comparative simulation between original field and custom field.
        Calculates:
        - Target scenario coverage %
        - Coverage difference %
        - Heatmap points (covered & exposed)
        - Adjacent zone trade-off evaluations
        """
        if scenario_key not in SCENARIO_CONFIGS:
            raise ValueError(f"Unknown scenario '{scenario_key}'. Available: {list(SCENARIO_CONFIGS.keys())}")

        config = SCENARIO_CONFIGS[scenario_key]
        grid_spacing_norm = max(0.02, min(0.08, grid_spacing_m / GROUND_SCALE_METERS))

        # Sample target zone grid
        target_polygon = TACTICAL_ZONE_POLYGONS[config["target_zone"]]
        target_points = cls.sample_polygon_grid(target_polygon, grid_spacing_norm)

        # Evaluate target zone for both original and custom
        orig_res = cls.evaluate_points(
            points=target_points,
            fielders=original_fielders,
            trajectory=config["trajectory"],
            corridor_width_m=config["corridor_width_m"],
            reaction_time_sec=reaction_time_sec,
            fielder_speed_mps=fielder_speed_mps,
            ball_speed_mps=ball_speed_mps,
        )

        custom_res = cls.evaluate_points(
            points=target_points,
            fielders=custom_fielders,
            trajectory=config["trajectory"],
            corridor_width_m=config["corridor_width_m"],
            reaction_time_sec=reaction_time_sec,
            fielder_speed_mps=fielder_speed_mps,
            ball_speed_mps=ball_speed_mps,
        )

        orig_pct = orig_res["coverage_pct"]
        custom_pct = custom_res["coverage_pct"]
        diff_pct = round(custom_pct - orig_pct, 1)

        # Evaluate adjacent zones to reveal trade-offs
        zone_comparisons = []
        # Include primary zone first
        zone_comparisons.append({
            "zone_key": config["target_zone"],
            "zone_name": config["name"],
            "is_primary_target": True,
            "original_coverage_pct": orig_pct,
            "custom_coverage_pct": custom_pct,
            "difference_pct": diff_pct,
        })

        for adj_key in config["adjacent_zones"]:
            if adj_key in TACTICAL_ZONE_POLYGONS:
                adj_poly = TACTICAL_ZONE_POLYGONS[adj_key]
                adj_pts = cls.sample_polygon_grid(adj_poly, grid_spacing_norm * 1.2)
                if adj_key in SCENARIO_CONFIGS:
                    adj_traj = SCENARIO_CONFIGS[adj_key]["trajectory"]
                    adj_width = SCENARIO_CONFIGS[adj_key]["corridor_width_m"]
                else:
                    # Construct default radial trajectory through center of zone
                    bounds = adj_poly.bounds
                    cx, cy = (bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2
                    adj_traj = LineString([(0.0, 0.0), (cx, cy)])
                    adj_width = 8.0

                adj_orig = cls.evaluate_points(
                    points=adj_pts,
                    fielders=original_fielders,
                    trajectory=adj_traj,
                    corridor_width_m=adj_width,
                    reaction_time_sec=reaction_time_sec,
                    fielder_speed_mps=fielder_speed_mps,
                    ball_speed_mps=ball_speed_mps,
                )
                adj_custom = cls.evaluate_points(
                    points=adj_pts,
                    fielders=custom_fielders,
                    trajectory=adj_traj,
                    corridor_width_m=adj_width,
                    reaction_time_sec=reaction_time_sec,
                    fielder_speed_mps=fielder_speed_mps,
                    ball_speed_mps=ball_speed_mps,
                )
                adj_diff = round(adj_custom["coverage_pct"] - adj_orig["coverage_pct"], 1)
                zone_comparisons.append({
                    "zone_key": adj_key,
                    "zone_name": adj_key.replace("_", " ").title(),
                    "is_primary_target": False,
                    "original_coverage_pct": adj_orig["coverage_pct"],
                    "custom_coverage_pct": adj_custom["coverage_pct"],
                    "difference_pct": adj_diff,
                })

        trajectory_coords = [{"x": float(c[0]), "y": float(c[1])} for c in config["trajectory"].coords]

        return {
            "scenario_key": scenario_key,
            "scenario_name": config["name"],
            "description": config["description"],
            "model_type": "GEOMETRY_BASED_ESTIMATE",
            "original_coverage_pct": orig_pct,
            "custom_coverage_pct": custom_pct,
            "coverage_difference_pct": diff_pct,
            "covered_points": custom_res["covered_points"],
            "exposed_points": custom_res["exposed_points"],
            "original_covered_points": orig_res["covered_points"],
            "original_exposed_points": orig_res["exposed_points"],
            "trajectory_points": trajectory_coords,
            "zone_comparisons": zone_comparisons,
            "total_points_evaluated": custom_res["total_valid_points"],
            "assumptions": {
                "reaction_time_sec": reaction_time_sec,
                "fielder_speed_mps": fielder_speed_mps,
                "ball_speed_mps": ball_speed_mps,
                "grid_spacing_m": grid_spacing_m,
                "corridor_width_m": config["corridor_width_m"],
                "scale_reference": "1.0 unit = 75.0 physical meters",
            },
            "limitations": [
                "Constant fielder sprint speed without acceleration or deceleration curves.",
                "Simplified perception and reaction latency assuming optimal anticipation.",
                "Constant linear ball velocity without turf friction rolling deceleration.",
                "Diving reach and catching physics are not simulated.",
                "Evaluates geometric spatial interception, NOT run-saving or wicket-taking probability.",
                "Hypothetical shot corridor does not predict real-world batting outcomes.",
            ],
        }


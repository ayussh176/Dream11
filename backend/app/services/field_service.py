import math
from typing import List, Dict
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.field import Fielder, FieldConfiguration
from app.schemas.field import (
    FielderResponse,
    FieldConfigurationResponse,
    FieldMovementDifference,
    FieldComparisonResponse,
)
from app.core.exceptions import ResourceNotFoundException, DugoutException


class FieldService:
    @staticmethod
    def get_field_by_delivery(db: Session, match_id: str, delivery_id: str) -> FieldConfigurationResponse:
        match = db.get(Match, match_id)
        if not match:
            raise ResourceNotFoundException(resource="Match", identifier=match_id)

        delivery = db.get(Delivery, delivery_id)
        if not delivery:
            raise ResourceNotFoundException(resource="Delivery", identifier=delivery_id)

        if delivery.match_id != match_id:
            raise DugoutException(
                detail=f"Delivery '{delivery_id}' does not belong to match '{match_id}'.",
                status_code=400,
                error_code="DELIVERY_MATCH_MISMATCH",
            )

        stmt = select(Fielder).where(Fielder.delivery_id == delivery_id)
        all_fielders = db.scalars(stmt).all()

        wicketkeepers = [f for f in all_fielders if f.is_wicketkeeper]
        non_keepers = [f for f in all_fielders if not f.is_wicketkeeper]

        # Validation: Exactly nine fielders, excluding the wicketkeeper
        if len(non_keepers) != 9:
            raise DugoutException(
                detail=f"Invalid field configuration for delivery '{delivery_id}': Found {len(non_keepers)} fielders, but exactly 9 fielders (excluding the wicketkeeper) are required.",
                status_code=422,
                error_code="INVALID_FIELDER_COUNT",
                extra={"actual_count": len(non_keepers), "expected_count": 9},
            )

        # Coordinate bounds validation
        for f in all_fielders:
            if not (-1.2 <= f.x <= 1.2 and -1.2 <= f.y <= 1.2):
                raise DugoutException(
                    detail=f"Fielder '{f.id}' coordinates ({f.x}, {f.y}) are outside the defined playable field boundaries [-1.2, 1.2].",
                    status_code=422,
                    error_code="COORDINATE_OUT_OF_BOUNDS",
                )

        config_name = (
            delivery.field_configuration.configuration_name
            if delivery.field_configuration
            else "Standard Defensive Field"
        )
        config_id = (
            delivery.field_configuration.id
            if delivery.field_configuration
            else f"cfg-{delivery_id}"
        )

        wk_response = None
        if wicketkeepers:
            wk = wicketkeepers[0]
            wk_response = FielderResponse(
                id=wk.id,
                player_id=wk.player_id,
                player_name=wk.player.name if wk.player else None,
                fielding_position=wk.fielding_position,
                x=wk.x,
                y=wk.y,
                is_wicketkeeper=True,
                delivery_id=wk.delivery_id,
                has_moved=wk.has_moved,
                prev_x=wk.prev_x,
                prev_y=wk.prev_y,
                prev_position=wk.prev_position,
            )

        fielders_response: List[FielderResponse] = []
        for f in non_keepers:
            fielders_response.append(
                FielderResponse(
                    id=f.id,
                    player_id=f.player_id,
                    player_name=f.player.name if f.player else None,
                    fielding_position=f.fielding_position,
                    x=f.x,
                    y=f.y,
                    is_wicketkeeper=False,
                    delivery_id=f.delivery_id,
                    has_moved=f.has_moved,
                    prev_x=f.prev_x,
                    prev_y=f.prev_y,
                    prev_position=f.prev_position,
                )
            )

        return FieldConfigurationResponse(
            id=config_id,
            match_id=match_id,
            delivery_id=delivery_id,
            configuration_name=config_name,
            total_fielders_count=len(fielders_response),
            has_wicketkeeper=wk_response is not None,
            fielders=fielders_response,
            wicketkeeper=wk_response,
        )

    @staticmethod
    def compare_fields(
        db: Session, match_id: str, delivery_a_id: str, delivery_b_id: str
    ) -> FieldComparisonResponse:
        field_a = FieldService.get_field_by_delivery(db, match_id, delivery_a_id)
        field_b = FieldService.get_field_by_delivery(db, match_id, delivery_b_id)

        # Build lookup maps for all fielders (including keeper)
        a_map: Dict[str, FielderResponse] = {f.player_id: f for f in field_a.fielders}
        if field_a.wicketkeeper:
            a_map[field_a.wicketkeeper.player_id] = field_a.wicketkeeper

        b_map: Dict[str, FielderResponse] = {f.player_id: f for f in field_b.fielders}
        if field_b.wicketkeeper:
            b_map[field_b.wicketkeeper.player_id] = field_b.wicketkeeper

        movement_differences: List[FieldMovementDifference] = []
        all_player_ids = set(a_map.keys()).union(set(b_map.keys()))

        for pid in all_player_ids:
            fa = a_map.get(pid)
            fb = b_map.get(pid)

            if fa and fb:
                dx = fb.x - fa.x
                dy = fb.y - fa.y
                dist = math.sqrt(dx * dx + dy * dy)
                pos_changed = fa.fielding_position != fb.fielding_position

                if dist >= 0.02 or pos_changed:
                    player_name = fb.player_name or fa.player_name or pid
                    desc = f"Moved from {fa.fielding_position} to {fb.fielding_position} (displacement: {round(dist, 3)})"
                    movement_differences.append(
                        FieldMovementDifference(
                            player_id=pid,
                            player_name=player_name,
                            from_position=fa.fielding_position,
                            to_position=fb.fielding_position,
                            from_coord={"x": fa.x, "y": fa.y},
                            to_coord={"x": fb.x, "y": fb.y},
                            displacement_normalized=round(dist, 4),
                            description=desc,
                        )
                    )

        # Generate contextual tactical comparison summary
        shift_count = len(movement_differences)
        if shift_count == 0:
            tactical_summary = "Field setting retained without tactical repositioning between deliveries."
        else:
            shifts_str = ", ".join([f"{m.player_name} ({m.from_position} → {m.to_position})" for m in movement_differences[:3]])
            tactical_summary = f"Captain made {shift_count} tactical adjustment(s): {shifts_str}."

        return FieldComparisonResponse(
            match_id=match_id,
            delivery_a_id=delivery_a_id,
            delivery_b_id=delivery_b_id,
            configuration_a_name=field_a.configuration_name,
            configuration_b_name=field_b.configuration_name,
            field_a=field_a,
            field_b=field_b,
            total_shifted_fielders=shift_count,
            movement_differences=movement_differences,
            tactical_summary=tactical_summary,
        )


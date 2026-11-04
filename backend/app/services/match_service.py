from typing import List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.match import Match
from app.models.delivery import Delivery
from app.schemas.match import MatchSummaryResponse, MatchDetailResponse, MatchContextResponse
from app.schemas.delivery import DeliverySummaryResponse
from app.core.exceptions import ResourceNotFoundException


class MatchService:
    @staticmethod
    def get_all_matches(db: Session) -> List[MatchSummaryResponse]:
        stmt = select(Match)
        matches = db.scalars(stmt).all()
        result = []
        for m in matches:
            summary = MatchSummaryResponse(
                id=m.id,
                match_name=m.match_name,
                tournament=m.tournament,
                venue=m.venue,
                match_date=m.match_date,
                team_a=m.team_a,
                team_b=m.team_b,
                batting_team=m.batting_team,
                bowling_team=m.bowling_team,
                current_innings=m.current_innings,
                match_status=m.match_status,
                total_overs=m.total_overs,
                target_runs=m.target_runs,
                is_demo=m.is_demo,
                total_deliveries_tracked=len(m.deliveries),
            )
            result.append(summary)
        return result

    @staticmethod
    def get_match_by_id(db: Session, match_id: str) -> MatchDetailResponse:
        match = db.get(Match, match_id)
        if not match:
            raise ResourceNotFoundException(resource="Match", identifier=match_id)

        deliveries_summary = []
        for d in match.deliveries:
            config_name = d.field_configuration.configuration_name if d.field_configuration else None
            deliveries_summary.append(
                DeliverySummaryResponse(
                    id=d.id,
                    match_id=d.match_id,
                    innings=d.innings,
                    over_number=d.over_number,
                    ball_number=d.ball_number,
                    batter_id=d.batter_id,
                    bowler_id=d.bowler_id,
                    batter_name=d.batter.name if d.batter else None,
                    bowler_name=d.bowler.name if d.bowler else None,
                    runs=d.runs,
                    wickets=d.wickets,
                    extras=d.extras,
                    delivery_type=d.delivery_type,
                    commentary=d.commentary,
                    timestamp=d.timestamp,
                    speed_kph=d.speed_kph,
                    line=d.line,
                    length=d.length,
                    shot_type=d.shot_type,
                    field_configuration_name=config_name,
                )
            )

        return MatchDetailResponse(
            id=match.id,
            match_name=match.match_name,
            tournament=match.tournament,
            venue=match.venue,
            match_date=match.match_date,
            team_a=match.team_a,
            team_b=match.team_b,
            batting_team=match.batting_team,
            bowling_team=match.bowling_team,
            current_innings=match.current_innings,
            match_status=match.match_status,
            total_overs=match.total_overs,
            target_runs=match.target_runs,
            is_demo=match.is_demo,
            total_deliveries_tracked=len(match.deliveries),
            deliveries=deliveries_summary,
        )

    @staticmethod
    def get_match_deliveries(db: Session, match_id: str) -> List[DeliverySummaryResponse]:
        match = db.get(Match, match_id)
        if not match:
            raise ResourceNotFoundException(resource="Match", identifier=match_id)

        deliveries = match.deliveries
        result = []
        for d in deliveries:
            config_name = d.field_configuration.configuration_name if d.field_configuration else None
            result.append(
                DeliverySummaryResponse(
                    id=d.id,
                    match_id=d.match_id,
                    innings=d.innings,
                    over_number=d.over_number,
                    ball_number=d.ball_number,
                    batter_id=d.batter_id,
                    bowler_id=d.bowler_id,
                    batter_name=d.batter.name if d.batter else None,
                    bowler_name=d.bowler.name if d.bowler else None,
                    runs=d.runs,
                    wickets=d.wickets,
                    extras=d.extras,
                    delivery_type=d.delivery_type,
                    commentary=d.commentary,
                    timestamp=d.timestamp,
                    speed_kph=d.speed_kph,
                    line=d.line,
                    length=d.length,
                    shot_type=d.shot_type,
                    field_configuration_name=config_name,
                )
            )
        return result

    @staticmethod
    def get_match_context(db: Session, match_id: str) -> MatchContextResponse:
        match = db.get(Match, match_id)
        if not match:
            raise ResourceNotFoundException(resource="Match", identifier=match_id)

        deliveries = match.deliveries
        total_runs = sum((d.runs + d.extras) for d in deliveries)
        total_wickets = sum(d.wickets for d in deliveries)
        
        last_delivery = deliveries[-1] if deliveries else None
        current_over = last_delivery.over_number if last_delivery else 0
        current_batter = last_delivery.batter.name if last_delivery and last_delivery.batter else None
        current_bowler = last_delivery.bowler.name if last_delivery and last_delivery.bowler else None

        # Calculate run rate and requirement
        legal_balls_delivered = len([d for d in deliveries if d.delivery_type == "legal"])
        current_rr = round((total_runs / (legal_balls_delivered / 6.0)), 2) if legal_balls_delivered > 0 else 0.0

        runs_needed = None
        balls_remaining = None
        rrr = None
        if match.target_runs:
            runs_needed = max(0, match.target_runs - total_runs)
            total_match_balls = match.total_overs * 6
            # In demo: 19th over is currently underway
            balls_bowled_in_innings = (18 * 6) + legal_balls_delivered
            balls_remaining = max(0, total_match_balls - balls_bowled_in_innings)
            if balls_remaining > 0:
                rrr = round((runs_needed / (balls_remaining / 6.0)), 2)

        return MatchContextResponse(
            match_id=match.id,
            match_name=match.match_name,
            tournament=match.tournament,
            venue=match.venue,
            current_innings=match.current_innings,
            batting_team=match.batting_team,
            bowling_team=match.bowling_team,
            current_over=current_over,
            total_runs_scored=total_runs,
            total_wickets_lost=total_wickets,
            target_runs=match.target_runs,
            runs_needed=runs_needed,
            balls_remaining=balls_remaining,
            required_run_rate=rrr,
            current_run_rate=current_rr,
            current_batter=current_batter,
            current_bowler=current_bowler,
            last_completed_delivery_id=last_delivery.id if last_delivery else None,
            is_demo_dataset=match.is_demo,
            notice="Demonstration tactical sequence: Apex Titans defending in the 19th over.",
        )


from sqlalchemy.orm import Session
from app.models.player import Player
from app.schemas.player import PlayerResponse, PlayerStatsResponse
from app.core.exceptions import ResourceNotFoundException


class PlayerService:
    @staticmethod
    def get_player_by_id(db: Session, player_id: str) -> PlayerResponse:
        player = db.get(Player, player_id)
        if not player:
            raise ResourceNotFoundException(resource="Player", identifier=player_id)
        return PlayerResponse.model_validate(player)

    @staticmethod
    def get_player_stats(db: Session, player_id: str) -> PlayerStatsResponse:
        player = db.get(Player, player_id)
        if not player:
            raise ResourceNotFoundException(resource="Player", identifier=player_id)

        return PlayerStatsResponse(
            player_id=player.id,
            name=player.name,
            team=player.team,
            role=player.role,
            matches_played=player.matches_played,
            runs_scored=player.runs_scored,
            wickets_taken=player.wickets_taken,
            catches=player.catches,
            strike_rate=player.strike_rate,
            economy_rate=player.economy_rate,
            fielding_position_specialty=player.fielding_position_specialty,
            is_demo_data=True,
        )


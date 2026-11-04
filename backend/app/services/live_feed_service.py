import asyncio
import logging
from typing import Dict, List, Any, Optional
from datetime import datetime, timezone
from fastapi import WebSocket
from sqlalchemy.orm import Session
from sqlalchemy import select

from app.database.session import SessionLocal
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.field import Fielder
from app.schemas.live import LiveMatchState, RealtimeFieldPrediction, LiveDeliveryIngestRequest
from app.services.prediction_engine import PredictionEngine

logger = logging.getLogger("dugout-live-feed")


class LiveFeedService:
    """
    Manages live match streaming, WebSocket connections, external match ingestion,
    and instantaneous real-time field placement predictions.
    """

    def __init__(self):
        self.prediction_engine = PredictionEngine()
        # Active match state keyed by match_id
        self._match_state: Dict[str, Dict[str, Any]] = {}
        # Active WebSockets: match_id -> set of WebSocket
        self._connected_clients: Dict[str, set] = {}
        # Background streaming tasks: match_id -> asyncio.Task
        self._stream_tasks: Dict[str, asyncio.Task] = {}

    def get_or_init_state(self, match_id: str, db: Session) -> Dict[str, Any]:
        """Initialize or retrieve live state for a match."""
        if match_id in self._match_state:
            return self._match_state[match_id]

        match = db.get(Match, match_id)
        if not match:
            # Fallback default match id if not found
            match = db.scalars(select(Match)).first()
            if not match:
                raise ValueError("No match available in database.")
            match_id = match.id

        deliveries = match.deliveries
        if not deliveries:
            raise ValueError(f"No deliveries found for match {match_id}")

        first_delivery = deliveries[0]
        fielders = [
            {
                "id": f.id,
                "player_id": f.player_id,
                "player_name": f.player.name if f.player else f.fielding_position,
                "fielding_position": f.fielding_position,
                "x": f.x,
                "y": f.y,
                "is_wicketkeeper": f.is_wicketkeeper,
                "has_moved": f.has_moved,
            }
            for f in first_delivery.fielders
        ]

        # Calculate initial prediction
        pred = self.prediction_engine.predict(
            match_id=match.id,
            over_number=first_delivery.over_number,
            ball_number=first_delivery.ball_number,
            batter_name=first_delivery.batter.name if first_delivery.batter else "Batter",
            bowler_name=first_delivery.bowler.name if first_delivery.bowler else "Bowler",
            fielders=fielders,
            delivery_id=first_delivery.id,
        )

        state = {
            "match_id": match.id,
            "match_name": match.match_name,
            "tournament": match.tournament,
            "venue": match.venue,
            "batting_team": match.batting_team,
            "bowling_team": match.bowling_team,
            "current_innings": match.current_innings,
            "current_over": first_delivery.over_number,
            "current_ball": first_delivery.ball_number,
            "delivery_index": 0,
            "total_deliveries": len(deliveries),
            "score": 182,
            "wickets": 4,
            "target": match.target_runs or 198,
            "required_rate": 16.0,
            "current_rate": 9.65,
            "striker": {
                "id": first_delivery.batter_id,
                "name": first_delivery.batter.name if first_delivery.batter else "Batter",
                "runs": 48,
                "balls": 26,
                "fours": 4,
                "sixes": 3,
                "strike_rate": 184.6,
            },
            "non_striker": {
                "name": "Kiran Rao",
                "runs": 22,
                "balls": 14,
            },
            "bowler": {
                "id": first_delivery.bowler_id,
                "name": first_delivery.bowler.name if first_delivery.bowler else "Bowler",
                "overs": "3.1",
                "runs_conceded": 28,
                "wickets": 2,
                "economy_rate": 8.84,
            },
            "current_delivery_id": first_delivery.id,
            "last_delivery_result": {
                "runs": first_delivery.runs,
                "wickets": first_delivery.wickets,
                "extras": first_delivery.extras,
                "commentary": first_delivery.commentary,
                "speed_kph": first_delivery.speed_kph or 141.5,
                "shot_type": first_delivery.shot_type or "Defensive push",
            },
            "fielders": fielders,
            "is_live_stream_active": False,
            "stream_tick_seconds": 6,
            "prediction": pred.model_dump(),
        }

        self._match_state[match_id] = state
        return state

    def set_active_state(self, match_id: str, state: Dict[str, Any]):
        """Explicitly set or replace live match state (e.g. from external live feed)."""
        self._match_state[match_id] = state
        return state

    def get_live_state(self, match_id: str) -> LiveMatchState:
        db = SessionLocal()
        try:
            state = self.get_or_init_state(match_id, db)
            return LiveMatchState(**state)
        finally:
            db.close()

    async def advance_delivery(self, match_id: str) -> LiveMatchState:
        """Advance the match state to the next delivery and recalculate prediction."""
        db = SessionLocal()
        try:
            state = self.get_or_init_state(match_id, db)
            match = db.get(Match, match_id)
            if not match or not match.deliveries:
                return LiveMatchState(**state)

            deliveries = match.deliveries
            idx = (state.get("delivery_index", 0) + 1) % len(deliveries)
            state["delivery_index"] = idx
            delivery = deliveries[idx]

            # Update match situation
            state["current_over"] = delivery.over_number
            state["current_ball"] = delivery.ball_number
            state["current_delivery_id"] = delivery.id
            state["score"] = state["score"] + delivery.runs + delivery.extras
            state["wickets"] = state["wickets"] + delivery.wickets
            
            # Recalculate striker stats
            state["striker"]["runs"] += delivery.runs
            state["striker"]["balls"] += 1
            if delivery.runs == 4:
                state["striker"]["fours"] += 1
            elif delivery.runs == 6:
                state["striker"]["sixes"] += 1
            state["striker"]["strike_rate"] = round((state["striker"]["runs"] / state["striker"]["balls"]) * 100, 1)

            # Update bowler overs
            balls_bowled = (delivery.over_number * 6) + delivery.ball_number
            state["bowler"]["overs"] = f"{delivery.over_number}.{delivery.ball_number}"
            state["bowler"]["runs_conceded"] += delivery.runs + delivery.extras
            state["bowler"]["wickets"] += delivery.wickets

            # Calculate run rates
            total_balls = 120
            remaining_balls = max(1, total_balls - balls_bowled)
            runs_needed = max(0, (state["target"] or 198) - state["score"])
            state["required_rate"] = round((runs_needed / remaining_balls) * 6, 2)
            state["current_rate"] = round((state["score"] / max(1, balls_bowled)) * 6, 2)

            state["last_delivery_result"] = {
                "runs": delivery.runs,
                "wickets": delivery.wickets,
                "extras": delivery.extras,
                "commentary": delivery.commentary,
                "speed_kph": delivery.speed_kph or 142.0,
                "shot_type": delivery.shot_type or "Drive",
            }

            # Map fielders
            fielders = [
                {
                    "id": f.id,
                    "player_id": f.player_id,
                    "player_name": f.player.name if f.player else f.fielding_position,
                    "fielding_position": f.fielding_position,
                    "x": f.x,
                    "y": f.y,
                    "is_wicketkeeper": f.is_wicketkeeper,
                    "has_moved": f.has_moved,
                }
                for f in delivery.fielders
            ]
            state["fielders"] = fielders

            # Recalculate real-time prediction
            pred = self.prediction_engine.predict(
                match_id=match_id,
                over_number=delivery.over_number,
                ball_number=delivery.ball_number,
                batter_name=delivery.batter.name if delivery.batter else "Batter",
                bowler_name=delivery.bowler.name if delivery.bowler else "Bowler",
                fielders=fielders,
                delivery_id=delivery.id,
            )
            state["prediction"] = pred.model_dump()

            self._match_state[match_id] = state
            
            # Broadcast to all connected clients
            await self._broadcast_state(match_id, state)
            return LiveMatchState(**state)
        finally:
            db.close()

    async def ingest_external_delivery(self, req: LiveDeliveryIngestRequest) -> LiveMatchState:
        """Ingest live ball payload from an external cricket feed / API."""
        match_id = req.match_id
        db = SessionLocal()
        try:
            state = self.get_or_init_state(match_id, db)
            
            state["current_over"] = req.over_number
            state["current_ball"] = req.ball_number
            state["score"] += req.runs + req.extras
            state["wickets"] += req.wickets
            
            state["striker"]["name"] = req.batter_name
            state["bowler"]["name"] = req.bowler_name
            
            state["last_delivery_result"] = {
                "runs": req.runs,
                "wickets": req.wickets,
                "extras": req.extras,
                "commentary": req.commentary,
                "speed_kph": req.speed_kph or 140.0,
                "shot_type": "External Feed Event",
            }

            fielders = [f.model_dump() for f in req.fielders]
            state["fielders"] = fielders

            pred = self.prediction_engine.predict(
                match_id=match_id,
                over_number=req.over_number,
                ball_number=req.ball_number,
                batter_name=req.batter_name,
                bowler_name=req.bowler_name,
                fielders=fielders,
            )
            state["prediction"] = pred.model_dump()
            self._match_state[match_id] = state

            await self._broadcast_state(match_id, state)
            return LiveMatchState(**state)
        finally:
            db.close()

    async def custom_predict_field(
        self,
        match_id: str,
        over_number: int,
        ball_number: int,
        batter_name: str,
        bowler_name: str,
        fielders: List[Dict[str, Any]],
    ) -> RealtimeFieldPrediction:
        """On-the-fly prediction for any custom or modified field placement."""
        return self.prediction_engine.predict(
            match_id=match_id,
            over_number=over_number,
            ball_number=ball_number,
            batter_name=batter_name,
            bowler_name=bowler_name,
            fielders=fielders,
        )

    # -------------------------------------------------------------
    # WebSocket & Auto-Stream Management
    # -------------------------------------------------------------
    async def register_client(self, match_id: str, websocket: WebSocket):
        await websocket.accept()
        if match_id not in self._connected_clients:
            self._connected_clients[match_id] = set()
        self._connected_clients[match_id].add(websocket)
        
        # Send current state immediately on connect
        db = SessionLocal()
        try:
            state = self.get_or_init_state(match_id, db)
            await websocket.send_json({"type": "STATE_UPDATE", "data": state})
        finally:
            db.close()

    def unregister_client(self, match_id: str, websocket: WebSocket):
        if match_id in self._connected_clients:
            self._connected_clients[match_id].discard(websocket)

    async def _broadcast_state(self, match_id: str, state: Dict[str, Any]):
        clients = self._connected_clients.get(match_id, set())
        dead = []
        for ws in list(clients):
            try:
                await ws.send_json({"type": "STATE_UPDATE", "data": state})
            except Exception:
                dead.append(ws)
        for d in dead:
            clients.discard(d)

    async def start_auto_stream(self, match_id: str, tick_seconds: int = 6):
        """Start auto-playing live stream deliveries every tick_seconds."""
        if match_id in self._stream_tasks and not self._stream_tasks[match_id].done():
            return  # Already streaming

        db = SessionLocal()
        try:
            state = self.get_or_init_state(match_id, db)
            state["is_live_stream_active"] = True
            state["stream_tick_seconds"] = tick_seconds
        finally:
            db.close()

        async def _stream_loop():
            try:
                while True:
                    await asyncio.sleep(tick_seconds)
                    await self.advance_delivery(match_id)
            except asyncio.CancelledError:
                pass

        task = asyncio.create_task(_stream_loop())
        self._stream_tasks[match_id] = task

    async def stop_auto_stream(self, match_id: str):
        """Stop auto-playing live stream deliveries."""
        task = self._stream_tasks.pop(match_id, None)
        if task and not task.done():
            task.cancel()
        if match_id in self._match_state:
            self._match_state[match_id]["is_live_stream_active"] = False
            await self._broadcast_state(match_id, self._match_state[match_id])

    async def reset_stream(self, match_id: str) -> LiveMatchState:
        """Reset live stream back to ball 1 of Over 19."""
        await self.stop_auto_stream(match_id)
        if match_id in self._match_state:
            del self._match_state[match_id]
        return self.get_live_state(match_id)


# Global singleton instance
live_feed_service = LiveFeedService()


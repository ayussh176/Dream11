import logging
from typing import Dict, Any, List
from fastapi import APIRouter, WebSocket, WebSocketDisconnect, HTTPException, Body
from app.schemas.live import (
    LiveMatchState,
    RealtimeFieldPrediction,
    LiveDeliveryIngestRequest,
)
from app.services.live_feed_service import live_feed_service
from app.services.cricbuzz_live_service import cricbuzz_live_service

logger = logging.getLogger("dugout-live-route")
router = APIRouter(prefix="/live", tags=["Live Game & Realtime Prediction"])


@router.get("/external/matches", response_model=List[Dict[str, Any]])
async def get_active_live_matches():
    """Fetch all currently active live cricket matches from live cricket stream."""
    try:
        return await cricbuzz_live_service.get_active_live_matches()
    except Exception as e:
        logger.error(f"Error listing live matches: {e}")
        return cricbuzz_live_service._get_fallback_matches()


@router.post("/external/connect/{external_id}", response_model=LiveMatchState)
async def connect_external_live_match(external_id: str):
    """Connect DugoutAI to a live match stream and synthesize real-time field placement predictions."""
    try:
        live_state_dict = await cricbuzz_live_service.fetch_live_match_state(external_id)
        match_id = live_state_dict["match_id"]
        live_feed_service.set_active_state(match_id, live_state_dict)
        return LiveMatchState(**live_state_dict)
    except Exception as e:
        logger.error(f"Error connecting to live match {external_id}: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.get("/{match_id}/state", response_model=LiveMatchState)
def get_live_state(match_id: str):
    """Retrieve the current live match state and real-time field prediction."""
    try:
        return live_feed_service.get_live_state(match_id)
    except Exception as e:
        logger.error(f"Error fetching live state: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/next-ball", response_model=LiveMatchState)
async def advance_live_delivery(match_id: str):
    """Advance to the next live delivery, update field positions, and recalculate predictions."""
    try:
        return await live_feed_service.advance_delivery(match_id)
    except Exception as e:
        logger.error(f"Error advancing live delivery: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/play", response_model=Dict[str, Any])
async def start_live_stream(match_id: str, tick_seconds: int = 5):
    """Start automated live stream ticker that broadcasts a new delivery every N seconds."""
    try:
        await live_feed_service.start_auto_stream(match_id, tick_seconds=tick_seconds)
        return {"status": "streaming", "match_id": match_id, "tick_seconds": tick_seconds}
    except Exception as e:
        logger.error(f"Error starting live stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/pause", response_model=Dict[str, Any])
async def pause_live_stream(match_id: str):
    """Pause the automated live stream."""
    try:
        await live_feed_service.stop_auto_stream(match_id)
        return {"status": "paused", "match_id": match_id}
    except Exception as e:
        logger.error(f"Error pausing live stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/reset", response_model=LiveMatchState)
async def reset_live_stream(match_id: str):
    """Reset the live match stream back to the beginning."""
    try:
        return await live_feed_service.reset_stream(match_id)
    except Exception as e:
        logger.error(f"Error resetting live stream: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/{match_id}/custom-predict", response_model=RealtimeFieldPrediction)
async def custom_predict_field(
    match_id: str,
    payload: Dict[str, Any] = Body(...),
):
    """Compute real-time predictions for any custom field layout."""
    try:
        over_number = payload.get("over_number", 19)
        ball_number = payload.get("ball_number", 1)
        batter_name = payload.get("batter_name", "Batter")
        bowler_name = payload.get("bowler_name", "Bowler")
        fielders = payload.get("fielders", [])

        return await live_feed_service.custom_predict_field(
            match_id=match_id,
            over_number=over_number,
            ball_number=ball_number,
            batter_name=batter_name,
            bowler_name=bowler_name,
            fielders=fielders,
        )
    except Exception as e:
        logger.error(f"Error computing custom prediction: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.post("/ingest", response_model=LiveMatchState)
async def ingest_external_delivery(req: LiveDeliveryIngestRequest):
    """Ingest a live delivery from an external cricket API or webhook."""
    try:
        return await live_feed_service.ingest_external_delivery(req)
    except Exception as e:
        logger.error(f"Error ingesting external delivery: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@router.websocket("/ws/{match_id}")
async def live_match_websocket(websocket: WebSocket, match_id: str):
    """Real-time bi-directional WebSocket connection for live match telemetry and predictions."""
    await live_feed_service.register_client(match_id, websocket)
    try:
        while True:
            data = await websocket.receive_text()
            # Handle client commands if any (e.g. NEXT_BALL, PING)
            if data == "NEXT_BALL":
                await live_feed_service.advance_delivery(match_id)
            elif data == "PLAY":
                await live_feed_service.start_auto_stream(match_id)
            elif data == "PAUSE":
                await live_feed_service.stop_auto_stream(match_id)
            elif data == "PING":
                await websocket.send_text("PONG")
    except WebSocketDisconnect:
        live_feed_service.unregister_client(match_id, websocket)
    except Exception as e:
        logger.warning(f"WebSocket client error: {e}")
        live_feed_service.unregister_client(match_id, websocket)


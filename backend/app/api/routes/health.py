from fastapi import APIRouter, Depends, status
from sqlalchemy.orm import Session
from sqlalchemy import text
from app.database.session import get_db
from app.schemas.health import HealthCheckResponse
from app.core.config import settings

router = APIRouter(tags=["Health"])


@router.get(
    "/health",
    response_model=HealthCheckResponse,
    status_code=status.HTTP_200_OK,
    summary="Backend Health Check",
    description="Returns backend service status, database connectivity, and configuration details.",
)
def get_health(db: Session = Depends(get_db)) -> HealthCheckResponse:
    # Test DB connectivity
    db_status = "connected"
    try:
        db.execute(text("SELECT 1"))
    except Exception as e:
        db_status = f"unhealthy: {str(e)}"

    return HealthCheckResponse(
        status="healthy" if db_status == "connected" else "degraded",
        service=settings.PROJECT_NAME,
        version=settings.VERSION,
        database=db_status,
        environment={
            "api_prefix": settings.API_PREFIX,
            "frontend_origin": settings.FRONTEND_ORIGIN,
            "gemini_configured": bool(settings.GEMINI_API_KEY),
        },
    )


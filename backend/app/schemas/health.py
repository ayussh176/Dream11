from datetime import datetime, timezone
from typing import Dict, Any
from pydantic import BaseModel, Field


class HealthCheckResponse(BaseModel):
    status: str = Field(default="healthy", description="Current backend status ('healthy', 'degraded')")
    service: str = Field(default="dugout-ai-backend", description="Backend service name")
    version: str = Field(default="0.1.0", description="API version")
    timestamp: datetime = Field(default_factory=lambda: datetime.now(timezone.utc), description="UTC timestamp of the health check")
    database: str = Field(default="connected", description="Database connection health")
    environment: Dict[str, Any] = Field(default_factory=dict, description="Active runtime details")

from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Float, Boolean, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Fielder(Base):
    __tablename__ = "fielders"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    player_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"), nullable=False, index=True)
    fielding_position: Mapped[str] = mapped_column(String(64), nullable=False)
    
    # Normalized physical coordinates relative to batter at (0, 0)
    # +X = off-side, -X = leg-side, +Y = toward boundary
    x: Mapped[float] = mapped_column(Float, nullable=False)
    y: Mapped[float] = mapped_column(Float, nullable=False)
    is_wicketkeeper: Mapped[bool] = mapped_column(Boolean, default=False)
    delivery_id: Mapped[str] = mapped_column(String(64), ForeignKey("deliveries.id"), nullable=False, index=True)

    # Movement tracking flags
    has_moved: Mapped[bool] = mapped_column(Boolean, default=False)
    prev_x: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prev_y: Mapped[Optional[float]] = mapped_column(Float, nullable=True)
    prev_position: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="fielders")  # type: ignore # noqa: F821
    player: Mapped["Player"] = relationship("Player")  # type: ignore # noqa: F821


class FieldConfiguration(Base):
    __tablename__ = "field_configurations"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"), nullable=False, index=True)
    delivery_id: Mapped[str] = mapped_column(String(64), ForeignKey("deliveries.id"), nullable=False, unique=True, index=True)
    configuration_name: Mapped[str] = mapped_column(String(128), nullable=False)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    match: Mapped["Match"] = relationship("Match", back_populates="field_configurations")  # type: ignore # noqa: F821
    delivery: Mapped["Delivery"] = relationship("Delivery", back_populates="field_configuration")  # type: ignore # noqa: F821


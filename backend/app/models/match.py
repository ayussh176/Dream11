from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, DateTime
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Match(Base):
    __tablename__ = "matches"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    match_name: Mapped[str] = mapped_column(String(128), nullable=False)
    tournament: Mapped[str] = mapped_column(String(128), nullable=False)
    venue: Mapped[str] = mapped_column(String(128), nullable=False)
    match_date: Mapped[str] = mapped_column(String(32), nullable=False)
    team_a: Mapped[str] = mapped_column(String(64), nullable=False)
    team_b: Mapped[str] = mapped_column(String(64), nullable=False)
    batting_team: Mapped[str] = mapped_column(String(64), nullable=False)
    bowling_team: Mapped[str] = mapped_column(String(64), nullable=False)
    current_innings: Mapped[int] = mapped_column(Integer, default=1)
    match_status: Mapped[str] = mapped_column(String(32), default="Demo Live")

    # Additional contextual metadata
    target_runs: Mapped[Optional[int]] = mapped_column(Integer, nullable=True)
    total_overs: Mapped[int] = mapped_column(Integer, default=20)
    is_demo: Mapped[bool] = mapped_column(default=True)
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Relationships
    deliveries: Mapped[List["Delivery"]] = relationship(  # type: ignore # noqa: F821
        "Delivery", back_populates="match", cascade="all, delete-orphan", order_by="Delivery.over_number, Delivery.ball_number"
    )
    field_configurations: Mapped[List["FieldConfiguration"]] = relationship(  # type: ignore # noqa: F821
        "FieldConfiguration", back_populates="match", cascade="all, delete-orphan"
    )


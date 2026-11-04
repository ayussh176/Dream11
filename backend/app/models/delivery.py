from datetime import datetime, timezone
from typing import List, Optional
from sqlalchemy import String, Integer, Text, DateTime, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column, relationship
from app.database.base import Base


class Delivery(Base):
    __tablename__ = "deliveries"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    match_id: Mapped[str] = mapped_column(String(64), ForeignKey("matches.id"), nullable=False, index=True)
    innings: Mapped[int] = mapped_column(Integer, nullable=False, default=1)
    over_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    ball_number: Mapped[int] = mapped_column(Integer, nullable=False, index=True)
    batter_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"), nullable=False, index=True)
    bowler_id: Mapped[str] = mapped_column(String(64), ForeignKey("players.id"), nullable=False, index=True)
    runs: Mapped[int] = mapped_column(Integer, default=0)
    wickets: Mapped[int] = mapped_column(Integer, default=0)
    extras: Mapped[int] = mapped_column(Integer, default=0)
    delivery_type: Mapped[str] = mapped_column(String(32), default="legal")
    commentary: Mapped[str] = mapped_column(Text, nullable=False)
    timestamp: Mapped[datetime] = mapped_column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )

    # Contextual delivery telemetry
    speed_kph: Mapped[Optional[float]] = mapped_column(nullable=True)
    line: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    length: Mapped[Optional[str]] = mapped_column(String(32), nullable=True)
    shot_type: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)

    # Relationships
    match: Mapped["Match"] = relationship("Match", back_populates="deliveries")  # type: ignore # noqa: F821
    batter: Mapped["Player"] = relationship("Player", foreign_keys=[batter_id])  # type: ignore # noqa: F821
    bowler: Mapped["Player"] = relationship("Player", foreign_keys=[bowler_id])  # type: ignore # noqa: F821
    field_configuration: Mapped[Optional["FieldConfiguration"]] = relationship(  # type: ignore # noqa: F821
        "FieldConfiguration", back_populates="delivery", uselist=False, cascade="all, delete-orphan"
    )
    fielders: Mapped[List["Fielder"]] = relationship(  # type: ignore # noqa: F821
        "Fielder", back_populates="delivery", cascade="all, delete-orphan"
    )


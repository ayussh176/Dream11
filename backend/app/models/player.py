from typing import Optional
from sqlalchemy import String, Integer, Float
from sqlalchemy.orm import Mapped, mapped_column
from app.database.base import Base


class Player(Base):
    __tablename__ = "players"

    id: Mapped[str] = mapped_column(String(64), primary_key=True, index=True)
    name: Mapped[str] = mapped_column(String(128), nullable=False, index=True)
    team: Mapped[str] = mapped_column(String(64), nullable=False, index=True)
    role: Mapped[str] = mapped_column(String(64), nullable=False)
    batting_style: Mapped[str] = mapped_column(String(64), nullable=False)
    bowling_style: Mapped[str] = mapped_column(String(64), nullable=False)
    image_url: Mapped[Optional[str]] = mapped_column(String(256), nullable=True)

    # Tactical & fielding profile
    fielding_position_specialty: Mapped[Optional[str]] = mapped_column(String(64), nullable=True)
    matches_played: Mapped[int] = mapped_column(Integer, default=0)
    runs_scored: Mapped[int] = mapped_column(Integer, default=0)
    wickets_taken: Mapped[int] = mapped_column(Integer, default=0)
    catches: Mapped[int] = mapped_column(Integer, default=0)
    strike_rate: Mapped[float] = mapped_column(Float, default=0.0)
    economy_rate: Mapped[float] = mapped_column(Float, default=0.0)


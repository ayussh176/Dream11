from fastapi import APIRouter, status
from app.services.simulation_service import SimulationService
from app.schemas.simulator import (
    EvaluateSimulationRequest,
    EvaluateSimulationResponse,
    ExplainTradeOffRequest,
    ExplainTradeOffResponse,
)

router = APIRouter(prefix="/simulator", tags=["Shadow Captain Simulation"])


@router.post(
    "/evaluate",
    response_model=EvaluateSimulationResponse,
    status_code=status.HTTP_200_OK,
    summary="Evaluate geometric field coverage",
    description="Calculates deterministic spatial coverage percentages, reachable and exposed grid points, and zone trade-offs using NumPy and Shapely.",
)
def evaluate_simulation(req: EvaluateSimulationRequest):
    return SimulationService.evaluate_simulation(req)


@router.post(
    "/explain-tradeoffs",
    response_model=ExplainTradeOffResponse,
    status_code=status.HTTP_200_OK,
    summary="Explain custom field trade-offs with AI",
    description="Analyzes the deterministic simulation metrics to explain which regions improved, which were weakened, and the strategic trade-offs.",
)
def explain_tradeoffs(req: ExplainTradeOffRequest):
    return SimulationService.explain_tradeoffs(req)


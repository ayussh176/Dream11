import json
import logging
from typing import Optional, Dict, Any
from app.simulator.geometry_engine import GeometrySimulationEngine
from app.schemas.simulator import (
    EvaluateSimulationRequest,
    EvaluateSimulationResponse,
    ExplainTradeOffRequest,
    ExplainTradeOffResponse,
)
from app.core.config import settings

logger = logging.getLogger("dugout-sim")


class SimulationService:
    @staticmethod
    def evaluate_simulation(req: EvaluateSimulationRequest) -> EvaluateSimulationResponse:
        assumptions = req.assumptions
        reaction_time = assumptions.reaction_time_sec if assumptions else 0.40
        fielder_speed = assumptions.fielder_speed_mps if assumptions else 6.0
        ball_speed = assumptions.ball_speed_mps if assumptions else 28.0
        grid_spacing = assumptions.grid_spacing_m if assumptions else 2.5

        # Format fielders as dictionaries
        orig_list = [{"id": f.id, "x": f.x, "y": f.y, "is_wicketkeeper": f.is_wicketkeeper} for f in req.original_fielders]
        custom_list = [{"id": f.id, "x": f.x, "y": f.y, "is_wicketkeeper": f.is_wicketkeeper} for f in req.custom_fielders]

        result_dict = GeometrySimulationEngine.evaluate_field_scenario(
            scenario_key=req.scenario,
            original_fielders=orig_list,
            custom_fielders=custom_list,
            reaction_time_sec=reaction_time,
            fielder_speed_mps=fielder_speed,
            ball_speed_mps=ball_speed,
            grid_spacing_m=grid_spacing,
        )

        return EvaluateSimulationResponse(**result_dict)

    @staticmethod
    def explain_tradeoffs(req: ExplainTradeOffRequest) -> ExplainTradeOffResponse:
        res = req.simulation_result
        scenario_name = res.scenario_name
        orig_cov = res.original_coverage_pct
        custom_cov = res.custom_coverage_pct
        diff = res.coverage_difference_pct

        # Check if Gemini key exists
        if settings.GEMINI_API_KEY:
            try:
                from google import genai
                from google.genai import types

                client = genai.Client(api_key=settings.GEMINI_API_KEY)

                zones_summary = "\n".join([
                    f"- {z.zone_name}: Original {z.original_coverage_pct}% -> Custom {z.custom_coverage_pct}% (Delta: {z.difference_pct}%)"
                    for z in res.zone_comparisons
                ])

                prompt = f"""You are DugoutAI's Cricket Strategy Analyst.
Explain the tactical trade-offs of the user's custom field configuration based strictly on these deterministic geometry simulation numbers:

SCENARIO: {scenario_name}
ORIGINAL FIELD COVERAGE: {orig_cov}%
CUSTOM FIELD COVERAGE: {custom_cov}%
COVERAGE DIFFERENCE: {diff}%

ZONE-LEVEL COMPARISONS:
{zones_summary}

ASSUMPTIONS USED:
- Fielder reaction time: {res.assumptions.get('reaction_time_sec', 0.4)}s
- Fielder sprint speed: {res.assumptions.get('fielder_speed_mps', 6.0)} m/s
- Ball speed: {res.assumptions.get('ball_speed_mps', 28.0)} m/s

CRITICAL INSTRUCTIONS:
- You must NOT invent or change any coverage numbers. Use the exact percentages above.
- Explain which regions improved and which regions were weakened.
- Explain what tactical trade-offs the user created by shifting fielders.
- Suggest in what bowling situation or match phase this custom field would be useful.
- Clearly emphasize that this is a hypothetical geometry-based estimate, not a real-world predictive outcome.
- Return strictly a valid JSON object matching this schema:
  {{
    "summary": "...",
    "improvements": ["..."],
    "trade_offs": ["..."],
    "situational_use_case": "..."
  }}
"""

                for model_candidate in ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.8-flash"]:
                    try:
                        response = client.models.generate_content(
                            model=model_candidate,
                            contents=prompt,
                            config=types.GenerateContentConfig(
                                temperature=0.2,
                                response_mime_type="application/json",
                            ),
                        )

                        if response and response.text:
                            cleaned = response.text.strip()
                            if cleaned.startswith("```json"):
                                cleaned = cleaned[7:]
                            if cleaned.endswith("```"):
                                cleaned = cleaned[:-3]
                            data = json.loads(cleaned.strip())
                            return ExplainTradeOffResponse(
                                summary=data.get("summary", ""),
                                improvements=data.get("improvements", []),
                                trade_offs=data.get("trade_offs", []),
                                situational_use_case=data.get("situational_use_case", ""),
                                is_ai_generated=True,
                            )
                    except Exception as model_err:
                        logger.debug(f"Simulation candidate {model_candidate} failed: {model_err}")
                        continue
            except Exception as e:
                logger.warning(f"Gemini trade-off explanation error: {e}. Falling back to deterministic engine.")

        # Grounded Rule-Based Fallback
        direction = "improved" if diff > 0 else "reduced" if diff < 0 else "maintained identical"
        summary = f"Under the {scenario_name} scenario, your custom field configuration {direction} geometric coverage by {abs(diff)}% (from {orig_cov}% to {custom_cov}%)."

        improvements = []
        trade_offs = []

        for z in res.zone_comparisons:
            if z.difference_pct > 0:
                improvements.append(f"{z.zone_name} coverage increased by {z.difference_pct}% ({z.original_coverage_pct}% → {z.custom_coverage_pct}%).")
            elif z.difference_pct < 0:
                trade_offs.append(f"{z.zone_name} coverage decreased by {abs(z.difference_pct)}% ({z.original_coverage_pct}% → {z.custom_coverage_pct}%), opening a potential boundary corridor.")

        if not improvements:
            improvements.append("Field retained defensive stability in the primary corridor without over-committing.")
        if not trade_offs:
            trade_offs.append("Minimal disruption to adjacent defensive zones under current kinematic parameters.")

        situational_use = (
            f"This custom placement is tactically advantageous when the bowler is targeting an off-stump line designed to induce drives into the reinforced {scenario_name} sector."
            if diff > 0
            else "This placement may be risky against a batter skilled at manipulating gaps into the vacated adjacent zones."
        )

        return ExplainTradeOffResponse(
            summary=summary,
            improvements=improvements,
            trade_offs=trade_offs,
            situational_use_case=situational_use,
            is_ai_generated=False,
        )


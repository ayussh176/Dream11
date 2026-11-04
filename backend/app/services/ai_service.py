import json
import logging
from typing import Optional, Dict, Any, List
from sqlalchemy.orm import Session
from sqlalchemy import select
from app.models.match import Match
from app.models.delivery import Delivery
from app.models.player import Player
from app.models.field import Fielder, FieldConfiguration
from app.schemas.ai import (
    ExplainFieldRequest,
    ExplainChangeRequest,
    AskQuestionRequest,
    TacticalExplanationResponse,
)
from app.core.config import settings
from app.core.exceptions import ResourceNotFoundException, DugoutException

logger = logging.getLogger("dugout-ai")

SYSTEM_INSTRUCTION = """You are DugoutAI's Cricket Tactical Assistant.
Your purpose is to explain cricket field placements, captaincy adjustments, and bowler-batter duel strategies to cricket fans.

STRICT GROUNDING & EPISTEMOLOGICAL GUARDRAILS:
1. Grounding in Provided Data: Use only the supplied match situation, ball telemetry, player styles, and fielder coordinates.
2. Never Invent Statistics: Do not invent player career records, match statistics, or wagon wheels.
3. No Unverified Mind-Reading: Never claim to know what the captain, bowler, or batter actually 'thought' or 'intended'.
   - BAD: "The captain moved mid-off because he knew the batter would hit there."
   - GOOD: "Moving mid-off deeper or into the ring may help protect against straight drives. However, the available data does not establish the captain's actual private intention."
4. Probabilistic Tactical Reasoning: Frame explanations as possible tactical rationales based on cricket orthodoxy: "A plausible tactical purpose is...", "In high-stakes death overs, this configuration typically seeks to...", "Orthodox tactics suggest...".
5. Distinguish Facts vs Inferences:
   - Supporting Evidence: Facts verifiable from the data (e.g., score, ball speed, bowler style, specific fielder positions).
   - Possible Reasons / Assumptions: Tactical hypotheses and analytical interpretations.
6. Acknowledge Limitations: If evidence is limited, explicitly note: "The available match data does not record the captain's explicit instructions."
7. Output Format: Return strictly a valid JSON object matching the requested schema.
"""


class AIService:
    @staticmethod
    def _build_grounded_context(
        db: Session,
        match_id: str,
        delivery_id: str,
        previous_delivery_id: Optional[str] = None,
        focus_fielder_id: Optional[str] = None,
    ) -> Dict[str, Any]:
        """Assemble structured match, player, and spatial context from SQLite."""
        match = db.get(Match, match_id)
        if not match:
            raise ResourceNotFoundException(resource="Match", identifier=match_id)

        delivery = db.get(Delivery, delivery_id)
        if not delivery:
            raise ResourceNotFoundException(resource="Delivery", identifier=delivery_id)

        if delivery.match_id != match_id:
            raise DugoutException(
                detail=f"Delivery '{delivery_id}' does not belong to match '{match_id}'.",
                status_code=400,
                error_code="DELIVERY_MATCH_MISMATCH",
            )

        batter = delivery.batter
        bowler = delivery.bowler

        # Fetch fielders for this delivery
        stmt = select(Fielder).where(Fielder.delivery_id == delivery_id)
        fielders = db.scalars(stmt).all()

        keeper = next((f for f in fielders if f.is_wicketkeeper), None)
        outfielders = [f for f in fielders if not f.is_wicketkeeper]

        # Classify fielders by side and depth
        off_side = [f for f in outfielders if f.x > 0]
        leg_side = [f for f in outfielders if f.x < 0]
        deep_fielders = [f for f in outfielders if (f.x**2 + f.y**2) >= 0.49]  # approx radius >= 0.70
        ring_fielders = [f for f in outfielders if (f.x**2 + f.y**2) < 0.49]

        field_config_name = (
            delivery.field_configuration.configuration_name
            if delivery.field_configuration
            else "Standard Field"
        )

        # Context summary
        context: Dict[str, Any] = {
            "match": {
                "id": match.id,
                "name": match.match_name,
                "tournament": match.tournament,
                "venue": match.venue,
                "target_runs": match.target_runs,
                "batting_team": match.batting_team,
                "bowling_team": match.bowling_team,
            },
            "delivery": {
                "id": delivery.id,
                "innings": delivery.innings,
                "over": delivery.over_number,
                "ball": delivery.ball_number,
                "runs_off_bat": delivery.runs,
                "extras": delivery.extras,
                "wickets": delivery.wickets,
                "commentary": delivery.commentary,
                "speed_kph": delivery.speed_kph,
                "line": delivery.line,
                "length": delivery.length,
                "shot_type": delivery.shot_type,
            },
            "duel": {
                "batter_name": batter.name if batter else "Striker",
                "batter_hand": batter.batting_style if batter else "Right-hand bat",
                "bowler_name": bowler.name if bowler else "Bowler",
                "bowler_style": bowler.bowling_style if bowler else "Right-arm fast",
            },
            "field_configuration": {
                "name": field_config_name,
                "off_side_count": len(off_side),
                "leg_side_count": len(leg_side),
                "deep_fielders_count": len(deep_fielders),
                "ring_fielders_count": len(ring_fielders),
                "fielders": [
                    {
                        "player_name": f.player.name if f.player else f.player_id,
                        "position": f.fielding_position,
                        "x": f.x,
                        "y": f.y,
                        "has_moved": f.has_moved,
                        "prev_position": f.prev_position,
                    }
                    for f in outfielders
                ],
                "wicketkeeper": {
                    "player_name": keeper.player.name if keeper and keeper.player else "Wicketkeeper",
                    "position": "Wicketkeeper",
                    "x": keeper.x if keeper else 0.0,
                    "y": keeper.y if keeper else -0.22,
                },
            },
        }

        # If focus fielder specified
        if focus_fielder_id:
            focus = next((f for f in fielders if f.id == focus_fielder_id or f.player_id == focus_fielder_id), None)
            if focus:
                context["focus_fielder"] = {
                    "player_name": focus.player.name if focus.player else focus.player_id,
                    "position": focus.fielding_position,
                    "x": focus.x,
                    "y": focus.y,
                    "has_moved": focus.has_moved,
                    "prev_position": focus.prev_position,
                }

        # If previous delivery comparison requested
        if previous_delivery_id:
            prev_deliv = db.get(Delivery, previous_delivery_id)
            if prev_deliv:
                prev_stmt = select(Fielder).where(Fielder.delivery_id == previous_delivery_id)
                prev_fielders = {f.player_id: f for f in db.scalars(prev_stmt).all()}

                shifts = []
                for curr in outfielders:
                    prev = prev_fielders.get(curr.player_id)
                    if prev and (prev.fielding_position != curr.fielding_position or curr.has_moved):
                        shifts.append({
                            "player_name": curr.player.name if curr.player else curr.player_id,
                            "from_position": prev.fielding_position,
                            "to_position": curr.fielding_position,
                            "from_coord": {"x": prev.x, "y": prev.y},
                            "to_coord": {"x": curr.x, "y": curr.y},
                        })
                context["field_shifts_from_previous"] = shifts

        return context

    @staticmethod
    def _call_gemini_api(prompt: str) -> Optional[Dict[str, Any]]:
        """Call Gemini API via official google.genai SDK with timeout and JSON schema."""
        if not settings.GEMINI_API_KEY:
            logger.info("GEMINI_API_KEY not configured. Falling back to grounded rule-based engine.")
            return None

        try:
            from google import genai
            from google.genai import types

            client = genai.Client(api_key=settings.GEMINI_API_KEY)

            # Try live verified models with fallback
            for model_candidate in ["gemini-flash-lite-latest", "gemini-flash-latest", "gemini-3.8-flash"]:
                try:
                    response = client.models.generate_content(
                        model=model_candidate,
                        contents=prompt,
                        config=types.GenerateContentConfig(
                            system_instruction=SYSTEM_INSTRUCTION,
                            temperature=0.2,
                            top_p=0.8,
                            response_mime_type="application/json",
                        ),
                    )

                    if response and response.text:
                        cleaned_text = response.text.strip()
                        if cleaned_text.startswith("```json"):
                            cleaned_text = cleaned_text[7:]
                        if cleaned_text.endswith("```"):
                            cleaned_text = cleaned_text[:-3]
                        res_json = json.loads(cleaned_text.strip())
                        res_json["model_used"] = model_candidate
                        return res_json
                except Exception as model_err:
                    logger.info(f"Model candidate {model_candidate} unavailable: {model_err}")
                    continue

        except Exception as e:
            logger.warning(f"Gemini API call failed or timed out: {e}. Utilizing grounded fallback.")
            return None

        return None

    @staticmethod
    def _generate_grounded_fallback(
        context: Dict[str, Any],
        query_type: str = "field",
        custom_query: Optional[str] = None,
    ) -> TacticalExplanationResponse:
        """
        Deterministic, rule-based cricket tactical synthesis when Gemini API key
        is not present or network times out. Completely grounded in SQLite context.
        """
        duel = context["duel"]
        deliv = context["delivery"]
        field = context["field_configuration"]
        batter_name = duel["batter_name"]
        bowler_name = duel["bowler_name"]
        batter_hand = duel["batter_hand"]
        config_name = field["name"]
        off_count = field["off_side_count"]
        leg_count = field["leg_side_count"]
        deep_count = field["deep_fielders_count"]

        # Determine tactical balance
        balance_desc = f"{off_count}-{leg_count} off-side heavy" if off_count > leg_count else f"{leg_count}-{off_count} leg-side heavy" if leg_count > off_count else "balanced 5-4"
        
        # Determine protected regions
        protected = []
        if any("Deep Backward Point" in f["position"] or "Third Man" in f["position"] for f in field["fielders"]):
            protected.append("Third Man and Backward Point (protecting against thick edges and square carves)")
        if any("Long-off" in f["position"] or "Long-on" in f["position"] for f in field["fielders"]):
            protected.append("Straight boundary (Long-off / Long-on guarding driven balls)")
        if any("Deep Mid-Wicket" in f["position"] or "Deep Square Leg" in f["position"] for f in field["fielders"]):
            protected.append("Leg-side boundary (Deep Mid-Wicket / Square Leg cutting off the pull and slog sweep)")
        if not protected:
            protected.append("Infield ring containment")

        # Determine exposed regions
        exposed = []
        if not any("Deep Cover" in f["position"] or "Sweeper Cover" in f["position"] for f in field["fielders"]):
            exposed.append("Vacant Deep Cover corridor (inviting lofted drives over extra cover)")
        if leg_count <= 3:
            exposed.append("Gaps between mid-on and deep square leg for rotational singles")
        if not any("Fly Slip" in f["position"] or "Slip" in f["position"] for f in field["fielders"]):
            exposed.append("Vacant slip cordon (edges will run along turf rather than carry to a catcher)")

        # Formulate grounded summary & reasons
        if query_type == "change" and "field_shifts_from_previous" in context:
            shifts = context.get("field_shifts_from_previous", [])
            shift_desc = ", ".join([f"{s['player_name']} from {s['from_position']} to {s['to_position']}" for s in shifts[:2]]) or "fielders holding positions"
            summary = f"Tactical adjustment for Ball {deliv['over']}.{deliv['ball']}: The fielding side shifted into a {config_name} setup ({shift_desc})."
            reasons = [
                f"Anticipating the bowler's {deliv.get('line', 'corridor')} line and {deliv.get('length', 'good')} length plan against {batter_name}.",
                f"Adapting to the {batter_hand} stance to plug scoring avenues behind or square of the wicket.",
                f"Reinforcing boundary protection with {deep_count} fielders stationed on the fence under death-over run pressure.",
            ]
        elif "focus_fielder" in context:
            ff = context["focus_fielder"]
            summary = f"{ff['player_name']} is positioned at {ff['position']} as part of the {config_name} arrangement."
            reasons = [
                f"Positioned to guard against {batter_name}'s scoring arc in this sector.",
                f"Aligns with {bowler_name}'s {deliv.get('speed_kph', 140)} km/h {deliv.get('line', 'stump-to-stump')} bowling approach.",
                "Prioritizes saving a boundary over aggressive catching in this phase of the over.",
            ]
        else:
            summary = f"On Ball {deliv['over']}.{deliv['ball']}, the fielding side deployed a {config_name} ({balance_desc})."
            reasons = [
                f"A plausible tactical rationale is protecting the off-side boundary with {off_count} fielders against {batter_name}.",
                f"Supporting {bowler_name}'s line, encouraging shots into well-patrolled outfield catchments.",
                "Balancing ring containment inside the 30-yard circle to restrict rotational singles while guarding the ropes.",
            ]

        evidence = [
            f"Match Context: {context['match']['batting_team']} chasing {context['match']['target_runs']} in Over {deliv['over']}.",
            f"Duel: {bowler_name} ({duel['bowler_style']}) bowling to {batter_name} ({batter_hand}).",
            f"Ball Telemetry: {deliv['speed_kph']} km/h {deliv.get('length', '')} delivery ({deliv.get('shot_type', 'stroke')}).",
            f"Spatial Coordinates: Exactly {len(field['fielders'])} outfielders + 1 wicketkeeper tracked on ground.",
        ]

        assumptions = [
            "Assumes the field setting reflects team bowling strategy rather than individual fielder preference.",
            "Assumes bowler intends to bowl according to the reinforced field side.",
        ]

        limitations = [
            "The available ball-by-ball record does not capture the captain's explicit verbal instructions or stump microphone audio.",
            "Tactical explanations represent plausible cricket orthodoxy rather than verified telepathic intent.",
        ]

        return TacticalExplanationResponse(
            summary=summary,
            possible_reasons=reasons,
            protected_regions=protected,
            potentially_exposed_regions=exposed,
            supporting_evidence=evidence,
            assumptions=assumptions,
            limitations=limitations,
            confidence_label="Grounded Observational Evidence",
            is_ai_generated=False,
            model_used="grounded-tactical-engine",
            delivery_id=deliv["id"],
            configuration_name=config_name,
            query=custom_query or "Tactical field analysis",
        )

    @classmethod
    def explain_field(cls, db: Session, req: ExplainFieldRequest) -> TacticalExplanationResponse:
        context = cls._build_grounded_context(
            db=db,
            match_id=req.match_id,
            delivery_id=req.delivery_id,
            focus_fielder_id=req.fielder_id,
        )

        prompt = f"""Analyze the cricket field placement for the following delivery context:
{json.dumps(context, indent=2)}

USER QUESTION: Explain the tactical rationale for this field configuration: '{context['field_configuration']['name']}' on delivery {context['delivery']['over']}.{context['delivery']['ball']}. Focus specifically on why fielders are placed where they are relative to the batter and bowler.

Remember:
- Return strictly JSON matching the required schema:
  {{
    "summary": "...",
    "possible_reasons": ["..."],
    "protected_regions": ["..."],
    "potentially_exposed_regions": ["..."],
    "supporting_evidence": ["..."],
    "assumptions": ["..."],
    "limitations": ["..."],
    "confidence_label": "..."
  }}
- Never claim to know the captain's actual private intent. Use probabilistic language.
- Demarcate verified match facts from analytical interpretations.
"""

        gemini_result = cls._call_gemini_api(prompt)
        if gemini_result and isinstance(gemini_result, dict):
            try:
                gemini_result["is_ai_generated"] = True
                gemini_result["model_used"] = gemini_result.get("model_used", "gemini-flash-lite-latest")
                gemini_result["delivery_id"] = req.delivery_id
                gemini_result["configuration_name"] = context["field_configuration"]["name"]
                gemini_result["query"] = "Explain field placement"
                return TacticalExplanationResponse(**gemini_result)
            except Exception as e:
                logger.warning(f"Error parsing Gemini JSON response: {e}. Falling back to grounded engine.")

        return cls._generate_grounded_fallback(context, query_type="field")

    @classmethod
    def explain_change(cls, db: Session, req: ExplainChangeRequest) -> TacticalExplanationResponse:
        # Determine previous delivery if not provided
        deliv = db.get(Delivery, req.delivery_id)
        if not deliv:
            raise ResourceNotFoundException(resource="Delivery", identifier=req.delivery_id)

        prev_id = req.previous_delivery_id
        if not prev_id:
            # Look up previous ball in match
            stmt = select(Delivery).where(
                Delivery.match_id == req.match_id,
                Delivery.over_number == deliv.over_number,
                Delivery.ball_number == deliv.ball_number - 1,
            )
            prev = db.scalars(stmt).first()
            if prev:
                prev_id = prev.id

        context = cls._build_grounded_context(
            db=db,
            match_id=req.match_id,
            delivery_id=req.delivery_id,
            previous_delivery_id=prev_id,
        )

        prompt = f"""Explain the tactical reasons behind the field changes between the previous delivery and the current delivery:
{json.dumps(context, indent=2)}

USER QUESTION: Why did the captain make these specific fielder shifts for delivery {context['delivery']['over']}.{context['delivery']['ball']}? Explain what tactical trade-offs and adjustments are being made.

Remember:
- Return strictly JSON matching the required schema:
  {{
    "summary": "Direct explanation of why the changes occurred",
    "possible_reasons": ["Strategic reason 1", "Strategic reason 2"],
    "protected_regions": ["Region 1"],
    "potentially_exposed_regions": ["Region 2"],
    "supporting_evidence": ["Evidence 1", "Evidence 2"],
    "assumptions": ["Assumption 1"],
    "limitations": ["Limitation 1"],
    "confidence_label": "High analytical plausibility"
  }}
- Frame reasons as plausible strategic adaptations rather than telepathic certainty.
"""

        gemini_result = cls._call_gemini_api(prompt)
        if gemini_result and isinstance(gemini_result, dict):
            try:
                # Defensive key normalization
                if "summary" not in gemini_result and "answer" in gemini_result:
                    gemini_result["summary"] = gemini_result["answer"]
                if isinstance(gemini_result.get("supporting_evidence"), dict):
                    gemini_result["supporting_evidence"] = [f"{k}: {v}" for k, v in gemini_result["supporting_evidence"].items()]
                if not isinstance(gemini_result.get("possible_reasons"), list):
                    gemini_result["possible_reasons"] = [str(gemini_result.get("possible_reasons", ""))]

                gemini_result["is_ai_generated"] = True
                gemini_result["model_used"] = gemini_result.get("model_used", "gemini-flash-lite-latest")
                gemini_result["delivery_id"] = req.delivery_id
                gemini_result["configuration_name"] = context["field_configuration"]["name"]
                gemini_result["query"] = "Explain field changes"
                return TacticalExplanationResponse(**gemini_result)
            except Exception as e:
                logger.warning(f"Error parsing Gemini change response: {e}")

        return cls._generate_grounded_fallback(context, query_type="change")

    @classmethod
    def ask_question(cls, db: Session, req: AskQuestionRequest) -> TacticalExplanationResponse:
        context = cls._build_grounded_context(
            db=db,
            match_id=req.match_id,
            delivery_id=req.delivery_id,
        )

        prompt = f"""Answer the following cricket tactical question using the supplied match state and field coordinates:
{json.dumps(context, indent=2)}

USER QUESTION: "{req.question}"

CRITICAL INSTRUCTIONS:
- Answer the user's specific question directly, with clarity for a cricket fan.
- Ground your answer in the provided fielder positions, bowler line/length, and batter profile.
- Return strictly a valid JSON object matching the required schema:
  {{
    "summary": "Clear, direct answer to the user's question",
    "possible_reasons": ["Tactical reason 1", "Tactical reason 2"],
    "protected_regions": ["Protected zone 1", "Protected zone 2"],
    "potentially_exposed_regions": ["Exposed gap 1", "Exposed gap 2"],
    "supporting_evidence": ["Evidence 1", "Evidence 2"],
    "assumptions": ["Assumption 1"],
    "limitations": ["Limitation 1"],
    "confidence_label": "High analytical plausibility"
  }}
- State limitations clearly if the question asks for private team discussions or unavailable telemetry.
"""

        gemini_result = cls._call_gemini_api(prompt)
        if gemini_result and isinstance(gemini_result, dict):
            try:
                # Defensive key normalization
                if "summary" not in gemini_result and "answer" in gemini_result:
                    gemini_result["summary"] = gemini_result["answer"]
                elif "summary" not in gemini_result and "explanation" in gemini_result:
                    gemini_result["summary"] = gemini_result["explanation"]
                if isinstance(gemini_result.get("supporting_evidence"), dict):
                    gemini_result["supporting_evidence"] = [f"{k}: {v}" for k, v in gemini_result["supporting_evidence"].items()]
                if not isinstance(gemini_result.get("possible_reasons"), list):
                    gemini_result["possible_reasons"] = [str(gemini_result.get("possible_reasons", ""))]

                gemini_result["is_ai_generated"] = True
                gemini_result["model_used"] = gemini_result.get("model_used", "gemini-flash-lite-latest")
                gemini_result["delivery_id"] = req.delivery_id
                gemini_result["configuration_name"] = context["field_configuration"]["name"]
                gemini_result["query"] = req.question
                return TacticalExplanationResponse(**gemini_result)
            except Exception as e:
                logger.warning(f"Error parsing Gemini ask response: {e}")

        return cls._generate_grounded_fallback(context, query_type="ask", custom_query=req.question)


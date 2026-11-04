# DugoutAI — Project Overview

> **Tagline:** Understand the field. Challenge the captain. Test your strategy.

---

## 1. Executive Summary

**DugoutAI** is an advanced cricket tactical companion and interactive analytical platform. It bridges the gap between television broadcast limitations, opaque captaincy decisions, and fan tactical curiosity.

In professional cricket, the placement of nine fielders (excluding the bowler and wicketkeeper) dictates match dynamics, creates pressure, induces mistakes, and restricts run scoring. However:
1. **Broadcast Cameras Are Ball-Centric:** Television broadcasts focus heavily on the pitch, batter, and bowler. Wide angles showing the complete 11-player field setup occur fleetingly, leaving viewers unable to visualize whole-ground spatial tactics.
2. **Tactical Reasoning Is Opaque:** Field changes between deliveries (e.g., shifting deep square leg to backward square leg, bringing mid-off inside the circle, or placing a catching cover) appear arbitrary without knowledge of batter match-ups, pitch tendencies, wagon wheels, and bowling plans.
3. **Fans Lack Strategic Agency:** Enthusiasts debate captaincy decisions in living rooms and online communities without a sandbox to test alternative fields, evaluate risk-reward ratios, or quantify geometric coverage.

DugoutAI solves these three problems through three deeply integrated modules:
- **Tactical Radar:** High-fidelity 2D interactive field visualizer with delivery-by-delivery field tracking, transition animations, and player vectors.
- **AI Tactical Explainer:** Context-aware tactical intelligence engine powered by Gemini, explaining spatial rationale while maintaining rigorous epistemological boundaries.
- **Shadow Captain:** Geometry-driven physics/spatial sandbox that lets fans reposition fielders, simulate shot trajectories, visualize exposed zones, and benchmark their tactics against international captains.

---

## 2. Product Identity & Core Values

| Attribute | Specification |
| :--- | :--- |
| **Product Name** | DugoutAI |
| **Domain** | Cricket Analytics, Spatial Modeling, AI Co-Captaincy |
| **Target Audience** | Cricket analysts, tactical enthusiasts, fantasy players, coaches, and curious fans |
| **Voice & Tone** | Analytical, objective, insightful, visually elegant, mathematically grounded |
| **Core Promise** | De-mystify every field setting, challenge every tactical decision, and quantify the cricket pitch. |

---

## 3. The Three Core Modules

### 3.1 Tactical Radar
An interactive 2D cricket ground providing a bird's-eye spatial representation of the match:
- **Complete Eleven Representation:** Accurately renders the striker, non-striker, bowler (running-in/delivery stance), wicketkeeper, and all 9 fielders.
- **Standardized Field Nomenclature:** Labels positions using standard cricket taxonomy (e.g., *Deep Backward Point, Fly Slip, Sweeper Cover, Short Mid-Wicket, Cow Corner*).
- **Delivery-by-Delivery Navigation:** Step through every delivery in an over or match to observe dynamic tactical shifts.
- **Delta Animation & Shift Vectors:** Smoothly animates fielder repositioning between delivery $(N-1)$ and delivery $N$, highlighting shift vectors (direction and displacement).
- **Player Tactical Cards:** Selecting a fielder highlights their fielding archetype, historical catch conversion rate, boundary-saving efficiency, and specific role in the active bowling trap.
- **Explainer Integration:** Direct one-click handoff to the AI Tactical Explainer for the selected delivery or specific fielder.

### 3.2 AI Tactical Explainer
An AI-powered tactical reasoning assistant powered by Gemini that interprets the strategic dialogue between captain, bowler, and batter:
- **Context Synthesis:** Ingests comprehensive match metadata: format, phase (Powerplay, Middle Overs, Death), scoreline, required run rate (RRR), batter stance (LHB/RHB), batter dismissal wagon wheel, bowler type, ball condition, and pitch characteristics.
- **Fielder Rationale:** Decodes individual placements (e.g., *"Why is deep third man squarer than usual?"* or *"Why has third slip been replaced by a catching mid-wicket?"*).
- **Delivery Transition Analysis:** Explains the reactive or proactive trigger behind shifts (e.g., capitalizing on a top-edge tendency, defending against an off-side boundary burst, or squeezing singles).
- **Natural Language Dialogue:** Interactive chat enabling users to interrogate specific scenarios, query statistical precedents, and test tactical theories.
- **Epistemological Guardrails (Crucial):**
  - **No False Mind-Reading:** The system explicitly acknowledges that it provides *tactical interpretation based on cricket principles and statistical precedents*, never claiming divine access to the captain's unstated thoughts unless substantiated by post-match interviews, stump mic audio, or official commentary records.
  - **Distinction of Verified vs. Inferred:** Verified data (player stats, ball trajectory, historical dismissal zones) is visibly demarcated from tactical inferences.

### 3.3 Shadow Captain
A geometry- and physics-based cricket simulation sandbox:
- **Field Customization:** Load an actual field configuration from any historical delivery and drag-and-drop fielders to author custom variations.
- **Field Restriction Compliance:** Enforces official format rules (e.g., max 2 fielders outside 30-yard circle in T20 Powerplay; max 5 fielders on leg side; no more than 2 fielders behind square on leg side).
- **Shot Scenario Generator:** Select or randomize hypothetical shot profiles:
  - *Cover Drive* (Angle: $120^\circ-140^\circ$, Exit Velo: $110-140\text{ km/h}$, Ground/Aerial)
  - *Pull Shot* (Angle: $210^\circ-250^\circ$, Exit Velo: $120-150\text{ km/h}$)
  - *Ramp / Scoop* (Angle: $280^\circ-330^\circ$, Aerial)
  - *Straight Drive, Slog Sweep, Late Cut, etc.*
- **Geometric Coverage Engine (NumPy & Shapely):**
  - Calculates interception polygons based on human reaction time ($0.3\text{s}-0.5\text{s}$), fielder sprint acceleration ($4.5-6.5\text{ m/s}^2$), top velocity ($7.5-9.0\text{ m/s}$), and dive radius.
  - Highlights **Protected Zones** (high interception probability), **Vulnerable Channels** (boundary-risk corridors), and **Exposed Gaps** (guaranteed singles/doubles).
- **A/B Field Comparison:** Side-by-side or overlay comparison of the *Captain's Actual Field* vs. *User's Shadow Field*.
- **AI Trade-Off Evaluation:** AI critique comparing the two configurations:
  - *"Your shadow field plugs the boundary gap at deep cover, but leaves mid-wicket completely vacant, opening an easy route for rotational singles against spin."*
- **Strictly Non-Predictive Disclaimer:** The simulation evaluates *spatial coverage and geometric vulnerability*, never guaranteeing wickets, runs saved, or deterministic delivery outcomes.

---

## 4. User Personas & Core Journeys

### Persona A: The Analytical Spectator ("Tactical Kabir")
- **Profile:** Watches international and franchise T20s closely; follows data-driven cricket podcasts; loves tactical debates.
- **Journey:** Opens DugoutAI during or after a match $\rightarrow$ selects an over where the momentum flipped $\rightarrow$ explores Tactical Radar to inspect the field $\rightarrow$ clicks AI Explainer to understand why a fielder moved right before a wicket $\rightarrow$ shares the tactical snapshot.

### Persona B: The Couch Captain ("Gaffer Sarah")
- **Profile:** Passionate fan who constantly critiques bowling changes and field settings ("Why didn't he have a slip?").
- **Journey:** Loads a controversial boundary-conceding delivery $\rightarrow$ launches Shadow Captain $\rightarrow$ drags backward point to third man and brings mid-on inside $\rightarrow$ runs the spatial coverage engine $\rightarrow$ evaluates trade-offs against the AI $\rightarrow$ discovers that plugging that boundary opened a single pocket.

### Persona C: The Club Player / Junior Coach ("Coach Liam")
- **Profile:** Coaches club cricket; teaches youngsters field setting theory based on bowler line/length and batter strength.
- **Journey:** Uses DugoutAI as an educational board $\rightarrow$ walks students through classic field traps (e.g., short-ball leg-side cordon, off-stump channel umbrella field) $\rightarrow$ runs custom shot scenarios to demonstrate interception angles and ring containment.

---

## 5. Ethical, Legal, and Epistemological Guardrails

1. **Captaincy Intent Boundaries:**
   Cricket captains operate under imperfect information, intuition, and internal team plans. DugoutAI models **plausible tactical rationale**, not verified private telepathy. System prompts and UI banners enforce this transparency.
2. **Deterministic Claim Prevention:**
   Cricket is probabilistic. Edge thickness, pitch grip, dew, batter hand-speed, and bowler execution variance mean no field placement guarantees an outcome. DugoutAI quantifies **spatial coverage probability**, not outcome destiny.
3. **Data Integrity & Attribution:**
   All statistical benchmarks (wagon wheels, strike rates, dot-ball percentages) reference standard historical ball-by-ball records, clearly attributing sources.


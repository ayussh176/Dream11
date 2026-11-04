# DugoutAI 🏏

> **Tagline:** Understand the field. Challenge the captain. Test your strategy.

**DugoutAI** is a cricket tactical companion and simulation sandbox that enables fans, analysts, and coaches to visualize full-ground field settings, analyze captaincy decisions, and experiment with custom field configurations in a geometry-backed simulation engine.

---

## ⚡ The Core Modules

### 1. 📊 Tactical Command Center (Dashboard)
- **Live Match Telemetry:** Features the curated high-stakes demonstration match (`Apex Titans vs Coastal Mavericks`, Over 19 death defense).
- **Match Situation Strip:** Real-time Required Run Rate (RRR), balls remaining, target score equation, and active bowler-batter duel stats.
- **Over 19 Delivery Sequence:** Ball-by-ball timeline with runs scored, wicket callouts, boundary badges, and delivery commentary.
- **Recent Field Adjustments:** Delta comparison highlights with exact displacement distances (meters) and tactical transition summaries.
- **Module Quick Launchers:** One-click seamless navigation into Tactical Radar, AI Explainer, and Shadow Captain.

### 2. 📡 Tactical Radar
- **2D Interactive Ground Canvas:** SVG rendering with true cricket geometry: pitch, creases, 30-yard inner circle, and boundary rope.
- **Complete 11-Player Tracking:** Batter (striker), non-striker, bowler, wicketkeeper, and all 9 outfielders with standardized cricket nomenclature.
- **Dynamic Delivery Scrubber:** Scrub across deliveries to inspect field adjustments.
- **Fielder Movement Vectors:** Animated dashed green displacement arrows indicating exactly where fielders relocated compared to the previous ball.
- **Fielder Specialty Profile Drawer:** Click any player marker to inspect their fielding archetype, career stats, and tactical tendencies.
- **Direct Handoffs:** Jump directly from the active field to AI Explainer or Shadow Captain with context preserved.

### 3. 🧠 AI Tactical Explainer (Gemini 2.5 Pro)
- **Context-Grounded Reasoning:** Answers tactical queries using only match score, pitch tendencies, bowler arsenal, and spatial coordinates.
- **Strict Epistemological Guardrails:** Demarcates verifiable empirical telemetry from tactical theories. Never claims unverified telepathic knowledge of the captain's private intentions.
- **Suggested Tactical Queries:** Instant evaluation chips for common captaincy questions ("Why is the fielder positioned at deep cover?", "Which scoring areas are exposed?").
- **Reliable Fallback Engine:** Gracefully provides deterministic cricket orthodoxy analysis if the Gemini API key is unset or external network timeouts occur.

### 4. 🛡️ Shadow Captain (Geometry Simulation Engine)
- **Interactive Drag-and-Drop:** Reposition all 9 fielders in real time with pointer events and boundary-clamping safety.
- **Deterministic NumPy & Shapely Engine:** Computes Euclidean reachability without LLM guesswork:
  $$t_{\text{fielder}} = t_{\text{react}} + \frac{d(F, P)}{v_{\text{fielder}}} \le t_{\text{ball}} = \frac{d(\text{Batter}, P)}{v_{\text{ball}}}$$
- **Discretized Heatmaps:** Displays reachable coordinates in green and exposed gaps in red.
- **Multiple Shot Corridors:** Test ground strokes through Cover ($30^\circ - 58^\circ$), Extra Cover ($15^\circ - 35^\circ$), Mid-off ($0^\circ - 20^\circ$), and Midwicket ($-60^\circ$ to $-25^\circ$).
- **Multi-View Modes:** Switch between Custom Sandbox, Match Original, and Compare Shift (ghosted markers + vector arrows).
- **Physics Customization:** Adjust reaction time ($0.2\text{s} - 0.8\text{s}$), fielder sprint velocity, ball exit speed, and grid density.
- **AI Trade-Off Critique:** Synthesizes spatial coverage deltas into structured tactical critiques (coverage gains, exposed sectors, optimal match situations).

---

## 🏗️ System Architecture

```mermaid
flowchart TD
    subgraph Frontend["Frontend Client (React 18 + Vite + Tailwind)"]
        UI_Dash["Dashboard (Command Center)"]
        UI_Radar["Tactical Radar (SVG Ground)"]
        UI_AI["AI Explainer (Chat & Evidence)"]
        UI_Sim["Shadow Captain (Interactive Sandbox)"]
        State["Tactical & Toast Contexts"]
    end

    subgraph Backend["Backend API (FastAPI + Python 3.11+)"]
        API_Routes["FastAPI Routes (/matches, /players, /ai, /simulator)"]
        Service_Cricket["Cricket Data Service"]
        Service_AI["AI Explainer Service (Gemini SDK)"]
        Service_Sim["Simulation Service"]
        Engine_Geo["NumPy + Shapely Geometry Engine"]
    end

    subgraph Data["Persistence & External Services"]
        DB[(SQLite / PostgreSQL via SQLAlchemy)]
        Gemini[Google Gemini 2.5 Pro API]
    end

    UI_Dash --> State
    UI_Radar --> State
    UI_AI --> State
    UI_Sim --> State

    State --> API_Routes
    API_Routes --> Service_Cricket --> DB
    API_Routes --> Service_AI --> DB
    Service_AI --> Gemini
    API_Routes --> Service_Sim --> Engine_Geo
    Service_Sim --> Gemini
```

---

## 🧭 Normalized Coordinate System

Field positions are stored in normalized physical coordinates relative to the batter:
- **Batter Stance Origin:** `(0, 0)`
- **Off-Side:** Positive $X$ (`+X`)
- **Leg-Side:** Negative $X$ (`-X`)
- **Toward Outfield Boundary:** Positive $Y$ (`+Y`, up to `+1.0`)
- **Behind Batter / Wicketkeeper:** Negative $Y$ (`-Y`, down to `-0.5`)
- Coordinates are validated within `[-1.2, 1.2]` boundaries.

Coordinate conversion to SVG canvas space:
$$x_{\text{svg}} = \text{center}_x + \text{scale}_x \cdot x, \quad y_{\text{svg}} = \text{center}_y - \text{scale}_y \cdot y$$

---

## 📁 Project Folder Structure

```
dugout-ai/
├── backend/
│   ├── app/
│   │   ├── api/
│   │   │   └── routes/          # FastAPI routers (matches, players, ai, simulation)
│   │   ├── core/                # Config, logging, RFC 7807 exceptions
│   │   ├── database/            # SQLAlchemy session and idempotent seed script
│   │   ├── models/              # Match, Player, Delivery, Fielder, FieldConfiguration
│   │   ├── schemas/             # Pydantic v2 validation contracts
│   │   ├── services/            # Cricket service, AI service, Simulation service
│   │   └── simulator/           # Deterministic Shapely/NumPy geometry engine
│   ├── tests/                   # 31 unit, integration, and simulation pytest tests
│   ├── Dockerfile               # Production container definition
│   ├── requirements.txt         # Pinned Python dependencies
│   └── .env.example             # Backend environment template
├── frontend/
│   ├── src/
│   │   ├── components/          # Reusable UI primitives (Button, Card, Badge, Modal, etc.)
│   │   ├── context/             # TacticalContext, ToastContext
│   │   ├── features/
│   │   │   ├── radar/           # DeliverySelector, FielderInfoDrawer, ComparisonPanel
│   │   │   ├── explainer/       # TacticalExplanationCard, MatchContextPanel, SuggestedQuestions
│   │   │   └── simulator/       # DraggableCricketGroundSVG, ScenarioSelector, AssumptionsPanel
│   │   ├── pages/               # Dashboard, TacticalRadarPage, ExplainerPage, ShadowCaptainPage
│   │   ├── services/            # Axios API clients (cricket, ai, simulator)
│   │   └── types/               # TypeScript interfaces
│   ├── Dockerfile               # Multi-stage production Nginx container
│   ├── package.json             # NPM dependencies
│   └── vite.config.ts           # Vite tooling configuration
├── docs/                        # Complete technical documentation suite
├── docker-compose.yml           # Unified orchestration definition
├── .env.example                 # Root environment template
└── README.md                    # Project documentation
```

---

## 🛠️ Technology Stack

| Layer | Technologies |
| :--- | :--- |
| **Frontend** | React 18, TypeScript, Vite, Tailwind CSS, React Router, Recharts, Lucide React, Axios |
| **Backend** | Python 3.10+, FastAPI, SQLAlchemy 2.0, SQLite, NumPy, Shapely, Uvicorn, Pydantic v2 |
| **AI Intelligence**| Google GenAI SDK (`gemini-2.5-pro` / `gemini-1.5-pro`) with fallback engine |
| **Deployment** | Docker, Nginx Alpine, Docker Compose |
| **Testing** | Pytest, FastAPI TestClient, NumPy/Shapely assertions |

---

## 🏃 Local Installation & Run Commands

### Prerequisites
- **Python:** 3.10 or higher
- **Node.js:** v18 or higher (v20+ recommended)
- **Git**

### 1. Backend Setup
```bash
# Navigate to backend directory
cd backend

# Create and activate Python virtual environment
python -m venv venv

# Windows PowerShell:
.\venv\Scripts\Activate.ps1
# macOS / Linux:
# source venv/bin/activate

# Install dependencies
pip install -r requirements.txt

# Configure environment variables
cp .env.example .env
# (Optional) Edit .env and insert your GEMINI_API_KEY

# Seed demonstration database (Over 19 death defense match)
$env:PYTHONPATH="."
python -m app.database.seed

# Run backend tests
pytest ../backend/tests -v

# Start FastAPI development server
uvicorn app.main:app --reload --host 0.0.0.0 --port 8000
```
API Documentation will be live at: **`http://localhost:8000/docs`**

### 2. Frontend Setup
```bash
# Open a new terminal in the frontend directory
cd frontend

# Install npm dependencies
npm install

# Verify production build and TypeScript checks
npm run build

# Start Vite development server
npm run dev
```
Application interface will be live at: **`http://localhost:5173`**

---

## 🐳 Docker Deployment

To launch the full stack in production containers:
```bash
# Build and start services
docker-compose up --build -d

# Check running status
docker-compose ps
```
- **Frontend:** `http://localhost:3000`
- **Backend API:** `http://localhost:8000`
- **API Swagger Docs:** `http://localhost:8000/docs`

> [!NOTE]
> **Persistent Storage:** The Docker Compose configuration mounts a persistent volume `dugoutai_db_data` to `/app/data` to preserve the SQLite database across container restarts. For multi-node cloud deployments (GCP Cloud Run, AWS ECS, Kubernetes), set `DATABASE_URL` to a managed PostgreSQL instance (e.g. `postgresql+psycopg2://user:pass@host:5432/dugoutai`).

---

## 🎬 Recommended 3-Minute Demo Sequence

1. **Minute 1: Tactical Command Center (Dashboard)**
   - Open `http://localhost:5173/`.
   - Observe the live featured match: **Apex Titans vs Coastal Mavericks** chasing 19 runs off 6 balls.
   - Walk through the Over 19 delivery sequence cards; click **Ball 18.4** to inspect the 14-meter deep cover shift.
2. **Minute 2: Tactical Radar & AI Explainer**
   - Click **Open Radar** to enter the 2D SVG Cricket Ground.
   - Scrub through balls 1 to 6 using the delivery timeline and observe the animated green movement vectors.
   - Click on **Devraj Singh** (Fielder #1) to reveal his player profile drawer and fielding tendencies.
   - Click **Explain Field** to transfer context to the AI Tactical Explainer; view the grounded strategic rationale, verified evidence list, and epistemological transparency notice.
3. **Minute 3: Shadow Captain Simulation**
   - Click **Test in Shadow Captain** to load Ball 18.4 into the sandbox.
   - Select the **Cover Drive Corridor** shot scenario.
   - Drag Deep Cover and Extra Cover into more aggressive boundary-saving positions.
   - Click **Run Simulation**: Inspect the real-time calculated coverage change, green interception dots, and red exposed gaps.
   - Click **Analyze Strategic Trade-Offs with AI** to view the synthesized breakdown of gained coverage and newly vulnerable sectors.

---

## ⚠️ Known Limitations & Assumptions

1. **Planar 2D Physics:** The geometry engine models planar Euclidean ground trajectories. It does not simulate aerial trajectory arcs, wind resistance, uneven pitch bounce, or bowler seam deflection.
2. **Deterministic Interception:** Interception calculations use constant initial ball velocity and uniform deceleration. Human factors such as diving range, sliding stops, and relay throws are simplified to Euclidean sprint reachability.
3. **Epistemological Scope:** AI explanations represent plausible cricket tactical orthodoxy derived from match telemetry and captaincy conventions. They do not claim telepathic knowledge of unstated captain or bowler intentions.
4. **Curated Demo Dataset:** Demonstrations focus on the curated Over 19 death defense match. Connecting live commercial match feeds requires integration with an external ball-by-ball provider.

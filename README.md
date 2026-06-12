# MachineGuard AI - Industrial Predictive Maintenance Platform

MachineGuard AI is a modern, high-end AI-powered web application designed to monitor industrial machinery health, run failure risk classification diagnostics using an XGBoost machine learning model, and display live fleet telemetry through a professional dark-mode dashboard.

---

## 🛠️ Architecture & Folder Structure

The application is structured into a React frontend and a FastAPI backend with SQLite persistence:

```text
MachineGuardAi/
├── backend/
│   ├── app/
│   │   ├── database.py       # SQLite connection & session management
│   │   ├── main.py           # FastAPI endpoints, CORS, CSV exports, stats
│   │   ├── ml_pipeline.py    # XGBoost model loader and mock inference fallback
│   │   ├── models.py         # SQLite SQLAlchemy schema (sensor readings + class outputs)
│   │   ├── schemas.py        # Pydantic request/response structures
│   │   ├── seed.py           # Database seeder (inserts 35 historical records)
│   │   └── test_ml.py        # Automated Pytest validation suite
│   ├── requirements.txt      # Python library dependencies
│   └── Dockerfile            # Backend Docker image config
├── frontend/
│   ├── src/
│   │   ├── components/       # UI layout styles
│   │   ├── pages/
│   │   │   ├── LandingPage.tsx   # Premium hero landing and CTA links
│   │   │   ├── PredictionPage.tsx # Sensor inputs panel, SVG gauge, Recharts feature importance
│   │   │   ├── DashboardPage.tsx  # Fleet statistics widgets, line/radar/pie/area charts
│   │   │   └── HistoryPage.tsx    # Filterable inspection registry with CSV downloads
│   │   ├── App.tsx           # Global state-based router and layouts
│   │   ├── types.ts          # TypeScript shared data interfaces
│   │   └── index.css         # Glassmorphism, Google font imports, and glow effects
│   ├── tailwind.config.js    # Custom Tailwind styling variables
│   ├── package.json          # Node modules declarations
│   └── Dockerfile            # Multi-stage frontend Docker file (Node.js + Nginx)
├── docker-compose.yml        # Fleet orchestrator for dev/prod environments
└── README.md                 # Project Documentation (This file)
```

---

## 🔌 Machine Learning Integration Points

The backend is pre-wired to load your custom files on start. The model features and ordering are strictly validated according to the following scheme:

### Expected Features (Must Match Exactly)
```json
[
  "Current_Consumption(A)",
  "Pressure_bar",
  "Volatge_V",
  "Tempearture_C",
  "Sound_DB",
  "Oil_level",
  "Vibration",
  "MACHINE_TYPES"
]
```

### How to Drop in Your Model
1. Place your pre-trained `machine_health_model.pkl` in the `/backend/` directory.
2. Place your `label_encoder.pkl` (for `MACHINE_TYPES`) in the `/backend/` directory.
3. Restart the backend service. It will automatically load the artifacts using `joblib` and transition from the mock rule-based predictor to your actual model.

The integration points are defined in:
* **`backend/app/ml_pipeline.py`**: Locates and loads pickle artifacts, performs categoric label encoding, formats the Pandas DataFrame feature columns, and calculates standard health score distributions:
  * `Healthy` $\rightarrow$ 90–100%
  * `Warning` $\rightarrow$ 60–89%
  * `Critical` $\rightarrow$ 30–59%
  * `Dangerous` $\rightarrow$ 0–29%

---

## 🐳 Running with Docker (Recommended)

To run the entire platform concurrently with one command, execute this at the root of the workspace:

```bash
docker-compose up --build
```

* **React Frontend**: Access on `http://localhost:3000`
* **FastAPI Backend Swagger Docs**: Access on `http://localhost:8000/docs`

---

## 💻 Manual Local Setup

If you prefer to run the components independently:

### 1. Backend API (FastAPI)
From the `/backend` folder:
```bash
# Create virtual environment
python -m venv venv
venv\Scripts\activate

# Install dependencies
pip install -r requirements.txt

# Seed the database (creates tables & adds 35 records)
python -m app.seed

# Start the uvicorn development server
uvicorn app.main:app --reload --port 8000
```

### 2. Frontend Client (Vite + React)
From the `/frontend` folder:
```bash
# Install modules
npm install

# Start Vite development server
npm run dev
```
Open `http://localhost:5173` to interact with the platform.

---

## 🧪 Verification and Testing

To verify the endpoints, database persistence, and ML pipeline boundaries:
Ensure you are in the virtual environment in `/backend`, and run:
```bash
pytest app/test_ml.py -v
```
All tests will validate class structures, risk equations, and JSON API payloads.

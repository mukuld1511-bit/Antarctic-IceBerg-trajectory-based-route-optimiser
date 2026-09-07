# Antarctic Sea-Ice, Iceberg Trajectory & Navigation Decision Support System (DSS)

An operational AI-enabled decision support platform built for the **Ministry of Earth Sciences (MoES)** and **National Centre for Polar and Ocean Research (NCPOR)** to support Indian Antarctic Expeditions (Bharati & Maitri research stations).

---

## ⏱️ 3-Minute Demo Script for Hackathon Judges

Follow this exact walkthrough sequence to experience the full operational capability of the NCPOR/MoES PolarNav Decision Support System:

1. **Step 1: Scrub the 7-Day Forecast Timeline**
   - Click or drag the horizontal **Forecast Scrubber** at the bottom (or press **Play ▶** for automated playback).
   - *What to observe:* Watch the ConvLSTM model confidence dynamically adjust (from 94% on Day +1 to 71% on Day +7). On the map, watch the **iceberg uncertainty cones visibly expand outward** ($\pm 1.5\text{ km} \rightarrow \pm 28.4\text{ km}$) as lead time increases.

2. **Step 2: Compare AI Polar A\* Route vs Naive Great-Circle Geodesic**
   - In the left Instrument Rail, toggle **"Naive Great-Circle Geodesic"** on/off, and slide the **Optimization Objective** slider between *Minimum Fuel* and *Maximum Safety*.
   - *What to observe:* The map displays the dashed red Great-Circle line (cutting blindly through dense compressive pack ice) alongside the solid glowing cyan AI corridor (threading open flaw leads). The **bottom Telemetry Strip updates live**, showing the net diff: **+4,506 kg fuel saved (-3.5% to -19.4%)**, transit ETA, and risk score reduction.

3. **Step 3: Inspect Physical Risk Factors on Any Coordinate**
   - Click anywhere on the map (or click one of the operational advisories in the top-right **Alert Panel**).
   - *What to observe:* The **Map Inspector Popup** immediately samples the coordinate and breaks down contributing physical factors: Sea-Ice Concentration %, distance to nearest tracked iceberg, dynamic uncertainty radius, wind speed, swell height, bathymetry depth, and final computed hazard score from `risk_scorer.py`.

4. **Step 4: Inspect Bigg et al. Iceberg Drift Force-Balance**
   - Click on **A-23a (Megaberg)** on the map or select it from the Tracked Drift Fleet list in the left rail.
   - *What to observe:* The **Physics & ML Residual Modal** displays the analytical ODE force vectors: aerodynamic sail drag ($F_{air}$), hydrodynamic keel drag ($F_{water}$), Coriolis deflection (leftward in the Southern Hemisphere), and the neural network residual correction compensating for unmodeled wave radiation stress.

5. **Step 5: Generate Official IMO Polar Code Voyage Brief**
   - Click **"GENERATE VOYAGE BRIEF"** in the top navigation bar.
   - *What to observe:* Generates a voyage navigation summary report with executive metrics, bridge hazard directives, and full waypoint tables. Use the modal to toggle between formatted readout, raw Markdown source, **Export .MD**, or **Print / PDF** bridge copy.

---

## 🌟 Core System Modules

1. **Sea-Ice Concentration (SIC) Forecasting**: Spatiotemporal ConvLSTM sequence prediction predicting 1- to 7-day lead sea-ice concentration grids over the Weddell Sea and Dronning Maud Land resupply corridors, with epistemic uncertainty estimation.
2. **Hybrid Iceberg Trajectory Prediction**:
   - **Physics Baseline**: Closed-form ODE numerical integrator of the **Bigg et al. (1997)** force-balance equation (wind drag + ocean current drag + Coriolis deflection + geostrophic sea surface slope), parametrized by iceberg size classes (A/B/C/D).
   - **ML Residual Correction**: Recurrent network predicting `(actual_track - physics_track)` residuals from wave radiation stress and basal melting, producing expanding conical uncertainty corridors.
3. **AI Route Optimization**: Spherical polar graph search using **heuristic A\*** with a **learned edge risk scoring model** (surrogate MLP) mapping `(SIC, iceberg density, wind, wave height)` into an empirical traversal hazard penalty, coupled with a **Lindqvist ice resistance fuel burn model**. Directly contrasts the AI-recommended safe track against naive great-circle routing to report **fuel savings (%)** and **safety improvement**.

---

## 🚀 Quick Start (Runs 100% Offline with Zero API Keys)

### Option 1: Live Web App (Integrated Container)
The application runs directly in the current container on port 3000.
```bash
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) to view the bridge decision console.

### Option 2: Python FastAPI Backend
```bash
cd backend
pip install -r requirements.txt
python sample_data/generate_fixtures.py
uvicorn app.main:app --host 0.0.0.0 --port 8000 --reload
```
Interactive API docs available at `http://localhost:8000/docs`.

### Option 3: Docker Compose
```bash
docker-compose up --build
```

---

## 📡 API Endpoints

- `GET /api/sic/forecast`: Returns gridded SIC predictions `[time, lat, lon]` with confidence bounds.
- `GET /api/iceberg/track?iceberg_id=A-23a&lead_hours=72`: Returns 72-hour Bigg et al. force-balance trajectory, ML residuals, and uncertainty radii.
- `POST /api/route/optimize`: Computes optimal route vs naive Great Circle corridor with fuel burn (kg) and risk metrics.
- `GET /api/dashboard/summary`: Combined endpoint for single-roundtrip bridge console hydration.

---

## 📂 Repository Structure

```
antarctic-dss/
├── backend/
│   ├── app/
│   │   ├── main.py                 # FastAPI application
│   │   ├── api/                    # SIC, Iceberg, and Route routes
│   │   ├── models/                 # Bigg physics, Residual LSTM, ConvLSTM, Risk Scorer
│   │   ├── routing/                # Spherical polar grid graph & A* pathfinder
│   │   ├── data/                   # NSIDC, ERA5, NIC, GEBCO ingestion stubs
│   │   ├── schemas/                # Pydantic validation models
│   │   └── services/               # Fuel burn & risk grid fusion
│   ├── sample_data/                # Representative NetCDF/JSON fixtures
│   └── requirements.txt
├── src/                            # React bridge navigation console
│   ├── components/                 # MapView, HeatmapLayer, IcebergTrackLayer, RouteLayer, Timeline, SummaryPanel
│   └── App.tsx
├── ml/                             # Model training pipelines (ConvLSTM, Residual GRU, Risk Scorer)
├── docs/                           # Architecture & Data Sources guides
└── docker-compose.yml
```

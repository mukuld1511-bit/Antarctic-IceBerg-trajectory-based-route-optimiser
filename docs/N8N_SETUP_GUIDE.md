# n8n Enterprise Ingestion Pipeline v2.0 for Antarctic DSS

This documentation details the **n8n Enterprise Satellite, Meteorological & Iceberg Ingestion Pipeline** powering the Antarctic Decision Support System (Polaris DSS).

---

## 1. Architectural Overview & Workflow Graph

```
┌───────────────────────────────────────────────┐
│  1A. Weekly Friday Schedule (06:00 UTC)       │
│  1B. On-Demand Webhook (/webhook/trigger-sync)│
└───────────────────────┬───────────────────────┘
                        │
       ┌────────────────┴────────────────┐
       ▼                                 ▼
┌──────────────────────────────┐  ┌──────────────────────────────┐
│ 2A. Fetch Live Open-Meteo    │  │ 2B. Fetch Polar Wind Field   │
│     Antarctic Marine Waves   │  │     (10m Speed, Gusts, Temp) │
└──────────────┬───────────────┘  └──────────────┬───────────────┘
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │ 3. Merge Datasets into Matrix   │
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │ 4. Bigg et al. (1997) Physics   │
               │    ODE & Station Proximity      │
               │    - Coriolis: f = 2Ω sin(φ)    │
               │    - Wave-induced Surge Drift   │
               │    - Distance to Maitri/Bharati │
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │ 5. Atomic Push to DSS API       │
               │    POST /api/iceberg/sync       │
               └────────────────┬────────────────┘
                                ▼
               ┌─────────────────────────────────┐
               │ 6. Is Hazard CRITICAL? (IF)     │
               └────────┬───────────────┬────────┘
             TRUE (CRITICAL)      FALSE (ROUTINE)
                        ▼               ▼
        ┌──────────────────────┐ ┌──────────────────────┐
        │ 7A. Format Maritime  │ │ 7B. Log Operational  │
        │     Telegram Warning │ │     Weekly Telemetry │
        └──────────────┬───────┘ └──────────────┬───────┘
                       └────────────────┬───────┘
                                        ▼
                       ┌─────────────────────────────────┐
                       │ 8. Respond to Webhook Requester │
                       │    (HTTP 200 JSON Confirmation) │
                       └─────────────────────────────────┘
```

---

## 2. Key Enhancements in Workflow v2.0

| Feature | Description | Benefit |
| :--- | :--- | :--- |
| **Dual Live Met Streams** | Fetches significant wave height, swell wave, wind speed (10m), gusts, and air temperature simultaneously from Open-Meteo. | Eliminates static weather assumptions; anchors simulation to real Southern Ocean sea state. |
| **Bigg et al. (1997) ODE Engine** | Computes aerodynamic drag ($F_{\text{air}}$), hydrodynamic drag ($F_{\text{water}}$), and Coriolis deflection directly in the JavaScript node. | Real scientific drift prediction rather than fixed coordinates. |
| **Indian Station Proximity** | Calculates live distance (in Nautical Miles) to **Maitri** (-70.77°S, 11.73°E) and **Bharati** (-69.41°S, 76.19°E). | Proactively warns expedition planners if megabergs drift towards supply routes. |
| **Multi-Channel Alert Dispatch** | Formats standardized NAVAREA VII / NAVAREA X polar emergency maritime warnings ready for Telegram or Discord/Slack dispatch. | Instant alerting for fleet commanders (SA Agulhas II, RV Samudra Ratna). |
| **Instant UI Sync Integration** | Direct 1-click **[ 🔄 Sync Live Satellites & Waves ]** button integrated into the web UI (`SimpleNavigationPanel.tsx`). | Users can trigger the pipeline directly from the browser without touching terminal. |
| **Canvas Visual Sticky Notes** | Color-coded visual stage markers embedded right inside the n8n canvas. | Easy to demonstrate, explain, and evaluate in presentations and vivas. |

---

## 3. Quick Setup & Execution

### Option A: Launch via Double-Click Launcher
Run `start_all.bat` or open PowerShell:
```powershell
.\start_all.ps1
```
Select **Option 4** to immediately trigger a sync, or **Option 3** to launch n8n.

### Option B: Run n8n Manually
```bash
npx n8n
```
1. Open your browser at: `http://localhost:5678`.
2. Click **Workflows** &rarr; **Add Workflow** &rarr; **Import from File** (⋮ menu).
3. Select: `n8n/iceberg_collection_workflow.json`.
4. Click **Test Workflow** or toggle to **Active**.

---

## 4. Triggering Sync From Web UI or CLI

### From Web UI:
1. Open `http://localhost:3000`.
2. In the **Route Planner** panel (top-left), look for **SATELLITE & N8N INGESTION**.
3. Click **"Sync Live Satellites & Waves"**.
4. The system immediately ingests real Open-Meteo telemetry, recomputes the Bigg et al. iceberg drift, and updates the map.

### From Terminal (1-liner):
```bash
npm run sync:icebergs
```

### Via cURL / Webhook:
```bash
curl -X POST http://localhost:3000/api/iceberg/sync \
  -H "Content-Type: application/json" \
  -H "x-api-key: antarctic-dss-secret-key" \
  -d '{"iceberg_id":"A-23a","current_lat":-61.16,"current_lon":-48.40,"drift_speed_knots":1.58,"hazard_level":"CRITICAL"}'
```

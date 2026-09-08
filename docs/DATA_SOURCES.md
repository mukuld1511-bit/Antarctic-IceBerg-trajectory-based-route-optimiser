# Antarctic Sea-Ice & Iceberg DSS — Complete Data Sources & Architecture Guide

This document provides a comprehensive, end-to-end explanation of **every data source**, **which file processes it**, **why it is required**, and **how the data flows from raw satellites into our AI & Physics models**.

---

## 1. Executive Summary & Data Pipeline Architecture

```
                 [ SATELLITE & SENSOR PROVIDERS ]
                                │
   ┌─────────────────┬──────────┴──────────┬─────────────────┐
   ▼                 ▼                     ▼                 ▼
[NSIDC / AMSR2]  [US NIC / ESA]      [ECMWF ERA5]    [AISStream.io]
(Daily Sea-Ice)  (Iceberg Radar)     (Wind & Waves)  (Live Ships)
   │                 │                     │                 │
   ▼                 ▼                     ▼                 ▼
ingest_nsidc.py  ingest_iceberg_db.py  ingest_era5.py    server.ts (ws)
   │                 │                     │                 │
   ▼                 ▼                     ▼                 ▼
sample_sic_       sample_              Wind ($U, V$)     Live Vessel
weddell.json      icebergs.json        & Wave forces     Coordinates
   │                 │                     │                 │
   ▼                 ▼                     ▼                 │
┌────────────────┐ ┌───────────────────────────────┐        │
│ ConvLSTM Model │ │ Bigg et al. (1997) ODE Physics│        │
│ 7-Day Forecast │ │ 72h Drift Trajectory & Cones  │        │
└────────┬───────┘ └───────────────┬───────────────┘        │
         │                         │                        │
         └────────────┬────────────┘                        │
                      ▼                                     ▼
          ┌───────────────────────┐            ┌──────────────────────┐
          │  Polar A* Pathfinding │            │ Live Fleet Dashboard │
          │  Safest Lowest-Fuel   │            │ Real-Time Streaming  │
          └───────────────────────┘            └──────────────────────┘
```

---

## 2. Deep Dive into the 5 Core Data Streams

### 1. Sea Ice Concentration (SIC) & Thickness
* **Real-World Source**: 
  * **NSIDC (National Snow & Ice Data Center / NASA)** — Products `NSIDC-0051` & `NSIDC-0081` (DMSP SSMIS microwave sensor).
  * **JAXA AMSR2** — High-resolution (6.25 km & 12.5 km) passive microwave brightness temperatures.
* **Why It Is Needed**: 
  * Ships cannot safely navigate blind in pack-ice. We need to know which areas have 0% ice (open water), 10–30% ice (navigable leads), or 80–100% heavy multi-year ice (impassable).
* **Processing Code**: 
  * Ingestion Handler: [`backend/app/data/ingest_nsidc.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_nsidc.py)
  * ML Forecast Model: [`backend/app/models/sic_convlstm.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/sic_convlstm.py)
  * Training Script: [`ml/train_sic_convlstm.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/ml/train_sic_convlstm.py)
  * Stored Benchmark: [`backend/sample_data/sample_sic_weddell.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_sic_weddell.json)
* **How It Feeds the Models**:
  * The ConvLSTM takes 14 days of sequential spatial frames + wind advection and outputs a **7-Day polar grid** ($D+0$ to $D+7$). Each grid cell contains:
    * `sic`: Sea-ice fraction (0.0 to 1.0)
    * `thickness_m`: Estimated ice thickness (meters)
    * `confidence`: Model certainty score (0.65 to 0.98)

---

### 2. Giant Iceberg Positions & Geometry
* **Real-World Source**:
  * **US National Ice Center (NIC)**: Weekly polar bulletins tracking all icebergs > 10 NM in length (classified into quadrants A, B, C, D).
  * **ESA Copernicus Sentinel-1 SAR (Synthetic Aperture Radar)**: High-resolution radar satellite images that pierce through Antarctic blizzards and 24-hour polar winter darkness to trace exact polygon edges of megabergs (A-23a, A-81, A-76a).
  * **BYU Scatterometer Tracking Archive**: Historical drift records.
* **Why It Is Needed**:
  * Megabergs are free-floating glacial islands weighing trillions of kilograms. Collision with a ship is catastrophic.
* **Processing Code**:
  * Ingestion Handler: [`backend/app/data/ingest_iceberg_db.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_iceberg_db.py)
  * Stored Database: [`backend/sample_data/sample_icebergs.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_icebergs.json)
  * Physics Integrator: [`backend/app/models/iceberg_physics.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/iceberg_physics.py) & [`server.ts`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/server.ts#L224-L310)
* **What Data is Stored per Iceberg**:
  * `current_lat`, `current_lon`: Exact GPS coordinate.
  * `length_m`, `width_m`: Surface dimensions (e.g. A-23a is 3,800m × 2,900m).
  * `sail_height_m`: Height above water (sail exposed to wind).
  * `draft_m`: Depth below water (keel exposed to underwater currents).
  * `mass_kg`: Mass in kilograms (e.g. A-23a = $1.1 \times 10^{12}$ kg).
  * `drift_speed_knots`, `drift_heading_deg`: Current drift vector.

---

### 3. Meteorological & Oceanographic Forces (Wind, Currents, Waves)
* **Real-World Source**:
  * **ECMWF ERA5 Reanalysis**: 10-meter atmospheric wind velocity ($U_{10}, V_{10}$) and 2-meter air temperature ($T_{2m}$).
  * **Mercator / HYCOM**: Antarctic circumpolar ocean currents and Weddell Gyre circulation.
  * **ECMWF WAM**: Significant Wave Height ($H_s$) and swell period.
* **Why It Is Needed**:
  * An iceberg does not move under its own power. Its movement is governed by physical balance of forces:
    $$\mathbf{a} = \frac{1}{M (1 + C_{am})} \Big( \mathbf{F}_{\text{air}} + \mathbf{F}_{\text{water}} + \mathbf{F}_{\text{coriolis}} + \mathbf{F}_{\text{slope}} \Big)$$
* **Processing Code**:
  * Ingestion Handler: [`backend/app/data/ingest_era5.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_era5.py)
  * Physics Model: [`backend/app/models/iceberg_physics.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/iceberg_physics.py)
* **Output**:
  * Predicts the **72-hour future track points** and the **expanding conical uncertainty safety buffer** (±12 km at 24h, ±28 km at 72h).

---

### 4. Live AIS Ship Telemetry (100% Real-Time)
* **Real-World Source**:
  * **AISStream.io**: Global real-time maritime AIS relay connected via secure WebSocket.
* **Why It Is Needed**:
  * Allows station managers and navigators to see real cargo vessels, oil tankers, and research icebreakers navigating the Southern Ocean right now.
* **Processing Code**:
  * WebSocket Client & Buffer: [`server.ts`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/server.ts#L834-L870)
  * REST API Endpoint: `GET /api/vessels/live`
  * Frontend Polling Hook: [`src/pages/Dashboard.tsx`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/src/pages/Dashboard.tsx#L125-L145)
  * High-Performance Canvas Renderer: [`src/components/MapView.tsx`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/src/components/MapView.tsx#L270-L340)

---

### 5. Seafloor Bathymetry & Polar Stations
* **Real-World Source**:
  * **GEBCO (General Bathymetric Chart of the Oceans)**: 15 arc-second high-resolution underwater depth grid.
  * **NCPOR / COMNAP**: Official registry of Indian (Maitri, Bharati) and international research stations.
* **Why It Is Needed**:
  * Deep-draft tabular icebergs (draft > 200m) can run aground on shallow underwater banks (bathymetric sills).
  * Research stations provide exact destination coordinates for Indian expedition resupply voyages.
* **Processing Code**:
  * Ingestion: [`backend/app/data/ingest_bathymetry.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_bathymetry.py)
  * Station Registry: [`backend/sample_data/sample_stations.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_stations.json) & [`src/constants/ports.ts`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/src/constants/ports.ts)

---

## 3. Directory & File Mapping Reference

| Purpose | Relevant Files |
| :--- | :--- |
| **Raw Datasets (JSON Cache)** | • [`backend/sample_data/sample_icebergs.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_icebergs.json)<br>• [`backend/sample_data/sample_sic_weddell.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_sic_weddell.json)<br>• [`backend/sample_data/sample_stations.json`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/sample_data/sample_stations.json) |
| **Python Ingestion Services** | • [`backend/app/data/ingest_nsidc.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_nsidc.py)<br>• [`backend/app/data/ingest_iceberg_db.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_iceberg_db.py)<br>• [`backend/app/data/ingest_era5.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_era5.py)<br>• [`backend/app/data/ingest_bathymetry.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/data/ingest_bathymetry.py) |
| **AI / Physics Models** | • [`backend/app/models/sic_convlstm.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/sic_convlstm.py)<br>• [`backend/app/models/iceberg_physics.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/iceberg_physics.py)<br>• [`backend/app/models/risk_scorer.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/backend/app/models/risk_scorer.py) |
| **Machine Learning Training** | • [`ml/train_sic_convlstm.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/ml/train_sic_convlstm.py)<br>• [`ml/train_iceberg_residual.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/ml/train_iceberg_residual.py)<br>• [`ml/train_risk_scorer.py`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/ml/train_risk_scorer.py) |
| **Node.js Gateway Server** | • [`server.ts`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/server.ts) (Houses API routes, AISStream WebSocket, and fallback simulation engine) |
| **Frontend API Bridge** | • [`src/api/client.ts`](file:///c:/Users/Mukul/Downloads/antarctic-sea-ice-navigation-dss-light/src/api/client.ts) |

---

## 4. How to Connect Live Satellite API Keys in Production

1. **NASA Earthdata (NSIDC Sea-Ice Live Feed)**:
   - Register at [urs.earthdata.nasa.gov](https://urs.earthdata.nasa.gov).
   - Add credentials to `.env`:
     ```env
     EARTHDATA_USERNAME=your_username
     EARTHDATA_PASSWORD=your_password
     ```
2. **Copernicus Climate Data Store (ERA5 Wind & Temperature)**:
   - Register at [cds.climate.copernicus.eu](https://cds.climate.copernicus.eu).
   - Place API key into `~/.cdsapirc`.
3. **AISStream.io (Live Vessel Telemetry)**:
   - Register at [aisstream.io](https://aisstream.io) for an API key.
   - Already configured in `server.ts` connecting to `wss://stream.aisstream.io/v0/stream`.

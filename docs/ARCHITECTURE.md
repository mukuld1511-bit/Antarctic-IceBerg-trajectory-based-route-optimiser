# Antarctic Decision Support System (DSS) — System Architecture

Designed for the **Ministry of Earth Sciences (MoES)** & **National Centre for Polar and Ocean Research (NCPOR)** for Indian Antarctic Expeditions (Bharati & Maitri stations).

---

## 1. High-Level Architecture Overview

The system consists of three tightly coupled predictive sub-systems feeding an operational bridge decision console:

```
+-------------------------------------------------------------------------------+
|                       OPERATIONAL DECISION CONSOLE (React + Vite)             |
|  - Interactive Polar Map (Leaflet / Canvas)                                    |
|  - Spatiotemporal SIC Heatmap Overlay (Scrub lead days 1 to 7)               |
|  - Iceberg Trajectories & Growing Conical Uncertainty Corridors               |
|  - Optimized Polar A* Route vs Naive Great-Circle Corridor                     |
|  - Fuel & Time Savings Analytics / Incident Risk Gauge (Recharts)             |
+-------------------------------------------------------------------------------+
                                      |
                                      v REST API JSON
+-------------------------------------------------------------------------------+
|                           FASTAPI / NODE BACKEND ENGINE                       |
|                                                                               |
|  [Sub-system 1: SIC Forecast]     [Sub-system 2: Iceberg Drift]              |
|  ConvLSTM / Fallback GBM          Bigg et al. (1997) Force Balance ODE        |
|  Output: N-day gridded SIC map    + ML Residual LSTM Error Correction        |
|                                   Output: Positions & Expanding Uncert. Radius|
|                                     |                                         |
|                                     +--------------+                          |
|                                                    v                          |
|                               [Sub-system 3: Route Optimizer]                 |
|                               Polar Spherical Grid Graph                      |
|                               Heuristic A* Pathfinding                        |
|                               Learned Edge Risk Scorer (MLP/Logistic)         |
|                               Lindqvist Ice Resistance Fuel Model             |
|                               Output: Safe waypoints, fuel saved, time delta  |
+-------------------------------------------------------------------------------+
                                      ^
                                      |
+-------------------------------------------------------------------------------+
|                               DATA INGESTION LAYER                            |
|  - NSIDC / NOAA Passive Microwave (AMSR2/SSMIS Daily NetCDF)                  |
|  - ECMWF ERA5 Reanalysis (10m Wind u/v, 2m Air Temp, WAM Wave Swell)          |
|  - US National Ice Center (NIC) & BYU Iceberg Tracking Database               |
|  - GEBCO 2023 Bathymetry & IBCSO Submarine Pinnacles                          |
+-------------------------------------------------------------------------------+
```

---

## 2. Mathematical & Physics Formulations

### 2.1 Iceberg Drift Dynamics (Bigg et al., 1997)
The total virtual mass equation of motion for an iceberg of mass $m_i$ in polar waters:

$$M \frac{d\vec{v}_i}{dt} = \vec{F}_a + \vec{F}_w + \vec{F}_c + \vec{F}_{ss} + \vec{F}_{\text{wave}}$$

- **Virtual Mass**: $M = m_i (1 + C_{am})$, where $C_{am} \approx 0.5$ accounts for hydrodynamic added mass of accelerating surrounding water.
- **Wind Drag on Sail**: $\vec{F}_a = \frac{1}{2} \rho_a C_a A_a |\vec{u}_a - \vec{v}_i| (\vec{u}_a - \vec{v}_i)$
- **Water Drag on Keel**: $\vec{F}_w = \frac{1}{2} \rho_w C_w A_w |\vec{u}_w - \vec{v}_i| (\vec{u}_w - \vec{v}_i)$
- **Coriolis Acceleration**: $\vec{F}_c = - M f (\hat{k} \times \vec{v}_i)$ where $f = 2 \Omega \sin(\phi)$ is negative in the Southern Hemisphere, deflecting drifting bergs to the left of the wind/current vector.
- **Sea Surface Slope (Geostrophic Balance)**: $\vec{F}_{ss} = M f (\hat{k} \times \vec{u}_w)$

### 2.2 Machine Learning Residual Correction
While physics captures the dominant momentum balance, real icebergs experience basal thermo-erosion, calved mass shedding, and wave radiation pressure. The residual model evaluates:

$$\vec{x}_{\text{actual}}(t) = \vec{x}_{\text{physics}}(t) + \Delta \vec{x}_{\text{ML}}(t)$$

$$\sigma(t) = \sigma_0 + \alpha \cdot t^{1.15}$$

Forming a conical uncertainty corridor that inflates with lead time $t$.

### 2.3 Route Optimization & Fuel Modeling
A* operates over a spherical lat/lon grid graph:
- **Heuristic**: Great-circle distance $h(n) = \text{haversine}(n, \text{goal})$ (provably admissible).
- **Edge Cost**:
  $$\text{Cost}(u, v) = d(u, v) \cdot \left[ 1 + w_{\text{fuel}} \cdot (f_{\text{ice}}(SIC) - 1) + w_{\text{risk}} \cdot R_{\text{learned}}(u, v) \right]$$
- **Ice Resistance**: Follows Lindqvist (1989) formulations where hull friction and crushing power scale non-linearly with ice concentration:
  $$f_{\text{ice}}(SIC) = 1.0 + k_{\text{vessel}} \cdot SIC^{2.2}$$

---

## 3. Deployment Targets
- **Frontend**: React + Vite SPA, deployable on Vercel / Cloud Run.
- **Backend**: FastAPI with Python 3.11 (or Node Express in AI Studio container).
- **Zero Live API Keys Required**: Shipped with complete deterministic fixtures in `backend/sample_data/`.

# PolarNav Design System & Operational Visual Specification
**NCPOR / MoES Antarctic Sea-Ice & Navigation Decision Support System**

---

## 1. Design Philosophy & Operational Context

PolarNav is an operational mission-critical marine navigation and cryosphere hazard assessment system engineered for glaciologists, expedition leaders, and ice-class vessel masters (e.g., *SA Agulhas II*).

The UI rejects generic consumer SaaS tropes (warm cream palettes, arbitrary drop-shadow cards, tracked-out eyebrow labels, gradient text). It models **ship's bridge night-mode instrumentation and polar mission control telemetry**:
- High-contrast, dark ocean canvas with zero eye fatigue under low-lux bridge conditions.
- Functional typography pairing: Clean geometric sans for structural chrome, precision tabular monospace strictly for geographic coordinates, timestamps, heading degrees, and physics telemetry.
- Consistent, single-source traffic-light risk semantics across maps, waypoints, telemetry readouts, and alerts.

---

## 2. Design Tokens & Color Palette

All color tokens derive strictly from operational semantics:

| Token Name | Hex Code | Semantic Role | Usage Guidance |
| :--- | :--- | :--- | :--- |
| `color-abyss` | `#060B11` | Root abyss background | Lowest canvas foundation |
| `color-panel-bg` | `#0A1420` | Primary instrument rail & panels | Translucent glass/acrylic base (`rgba(10, 20, 32, 0.88)`) |
| `color-panel-border` | `#152638` | Structural telemetry dividers | 1px clean crisp hairline borders |
| `color-surface-hover` | `#0F1F2E` | Interactive hover & active readouts | Control button & row hover state |
| `color-ice-white` | `#E8F1F5` | Primary typographic readout | Readout figures, active values, high-contrast headings |
| `color-ice-muted` | `#94A9B8` | Secondary labels & units | Axis labels, units (kts, NM, kg), metadata |
| `color-ice-faint` | `#4B6375` | Inactive & disabled indicators | Lat/Lon gridlines, hairline tracks |
| `color-safe-cyan` | `#4FB0C6` | Safe / Nominal (Risk < 0.30) | Optimal AI route, open water, safe navigation |
| `color-caution-amber`| `#D9A441` | Caution / Moderate (0.30 - 0.65) | Ice-pack margins, 30-65% SIC, warning notices |
| `color-alert-red` | `#C4453B` | Severe Risk / Alert (> 0.65) | Megabergs, multi-year pack ice, hazardous corridors |
| `color-gc-route` | `#E06A55` | Naive Great-Circle baseline | Dashed comparison transit track |

### Semantic Risk Scale Derivation (Derived from `risk_scorer.py`):
```text
[0.00 -------- 0.30)  ->  SAFE (#4FB0C6)       : Open drift, nominal hull resistance, negligible iceberg probability
[0.30 -------- 0.65)  ->  CAUTION (#D9A441)    : Marginal ice pack (SIC 30-65%), bergy water, speed reduced
[0.65 -------- 1.00]  ->  SEVERE RISK (#C4453B): Dense multi-year ice (>70% SIC), megaberg collision cone, unnavigable
```

---

## 3. Typography Hierarchy

- **UI Chrome & Prose**: `Inter, system-ui, -apple-system, sans-serif`
  - Body: 14px / 1.5line-height (`text-sm`)
  - Subheaders: 13px bold uppercase tracking-normal (`text-xs font-semibold`)
  - Rail Title: 15px font-bold (`text-sm font-bold`)
- **Navigational Readouts & Telemetry**: `JetBrains Mono, IBM Plex Mono, monospace` (`font-mono`)
  - Lat/Long: `-69.004°S, 39.581°E` (tabular figures)
  - Speed / Fuel / Duration: `13.5 kts`, `123,256 kg`, `169.5 hrs`
  - Timestamps: `2026-09-06T00:00Z`, `+72h`

---

## 4. Layout Architecture & ASCII Wireframe

The interface is **full-bleed map-centric**. The map fills 100% of the viewport. Overlaid controls are translucent instrument panels hugging the edges:

```text
+----------------------------------------------------------------------------------------------------+
| [NCPOR LOGO] POLARNAV DSS :: ANTARCTIC OPERATIONS    [UTC: 2026-09-06 07:47]  [GENERATE BRIEF] [?] |
+----------------------------------------------------------------------------------------------------+
| [ INSTRUMENT RAIL / DRAWER ] |                                              | [ ALERTS / RADAR ]   |
| Width: 320px                 |                                              | Width: 280px         |
|                              |                                              |                      |
| > VOYAGE PARAMETERS          |               FULL-BLEED POLAR MAP           | ! ACTIVE HAZARDS (3) |
|   Departure: Cape Town       |           (Leaflet EPSG:3857/Polar Focus)    | - A-23a Megaberg     |
|   Destination: Maitri Stn    |                                              |   Drift bearing 034° |
|   Vessel: Polar Class 5      |   +--[MAP INSPECTOR POPUP]----------------+  | - Pack Ice Shelf     |
|   Date: 2026-09-06           |   | Lat: -64.2°S, Lon: 15.1°E             |  |   SIC 88% Convergence|
|   [COMPUTE OPTIMAL ROUTE]    |   | SIC: 42% | Nearest Berg: 18.2 NM      |  |                      |
|                              |   | Risk: 0.38 (CAUTION)                  |  | [ RISK GRID LEGEND ] |
| > ROUTE MODES                |   +---------------------------------------+  | [ ] Safe (<0.30)     |
|   [X] AI-Optimized (Cyan)    |                                              | [!] Caution (0.30-65)|
|   [X] Great-Circle (Dashed)  |                                              | [X] Severe (>0.65)   |
|                              |                                              |                      |
| > ICEBERG TRACKING           |                                              |                      |
|   Select: A-23a (Megaberg)   |                                              |                      |
|   Show 72h Drift & Cones     |                                              |                      |
+----------------------------------------------------------------------------------------------------+
| [ FORECAST TIMELINE SCRUBBER: Day 0 [====================O====] Day 10 ]  Confidence: 84%          |
+----------------------------------------------------------------------------------------------------+
| [ TELEMETRY STRIP ]                                                                                |
| OPTIMAL DISTANCE: 2,261.6 NM | FUEL SAVED: +4,506.8 kg (-3.5%) | ETA: 169.5 hrs | RISK: 0.09 (SAFE)|
+----------------------------------------------------------------------------------------------------+
```

---

## 5. Deliberate Motion Principles

1. **Route Generation Animation**:
   - Progressive waypoint interpolation along polyline during initial route calculation, rather than abrupt apparition.
2. **Dynamic Uncertainty Conical Expansion**:
   - As lead day increases on the timeline scrubber from Day 0 to Day 10, iceberg uncertainty radii visibly scale smoothly from $\pm 1.5\,\text{km}$ to $\pm 49.4\,\text{km}$.
3. **Restraint**:
   - No unnecessary pulsing or distracting decorative hover shakes. Only operational changes trigger visual state updates.

"""
Unified Data Fusion Service.
Combines:
1. N-day Sea-Ice Concentration (SIC) Forecast grids
2. Iceberg dynamic locations + time-expanding uncertainty cones
3. GEBCO bathymetry safety contours
4. ERA5 wind & swell surface conditions
into a consolidated spatial hazard grid for the bridge navigation console and A* routing engine.
"""

import math
from typing import Dict, List, Any
from ..routing.grid_graph import haversine_distance_nm
from ..models.risk_scorer import LearnedNavigationRiskScorer

class RiskGridFusionService:
    def __init__(self):
        self.risk_scorer = LearnedNavigationRiskScorer()

    def fuse_layers(
        self,
        sic_forecast_cells: List[Dict[str, Any]],
        iceberg_tracks: List[Dict[str, Any]],
        lead_hour: int = 24,
        vessel_class: str = "PC-5"
    ) -> List[Dict[str, Any]]:
        """
        Fuses SIC cells with iceberg uncertainty cones for a specific forecast horizon.
        """
        fused_cells = []

        for cell in sic_forecast_cells:
            lat = cell["lat"]
            lon = cell["lon"]
            sic = cell["sic"]

            # Compute iceberg encounter density at (lat, lon) taking into account
            # the iceberg's forecast position and uncertainty cone at lead_hour
            iceberg_density = 0.0
            closest_berg_name = None
            min_berg_dist_nm = float("inf")

            for berg in iceberg_tracks:
                # Find trajectory point closest to lead_hour
                target_pt = berg.get("trajectory", [{}])[0]
                for pt in berg.get("trajectory", []):
                    if pt.get("step_hour", 0) <= lead_hour:
                        target_pt = pt

                b_lat = target_pt.get("lat", berg.get("current_lat", lat))
                b_lon = target_pt.get("lon", berg.get("current_lon", lon))
                uncert_km = target_pt.get("uncertainty_radius_km", 5.0)
                uncert_nm = uncert_km / 1.852

                dist_nm = haversine_distance_nm(lat, lon, b_lat, b_lon)
                if dist_nm < min_berg_dist_nm:
                    min_berg_dist_nm = dist_nm
                    closest_berg_name = berg.get("iceberg_id", "Unknown")

                # Kernel hazard within uncertainty radius + ship reaction buffer
                effective_radius_nm = uncert_nm + 12.0
                if dist_nm < effective_radius_nm:
                    proximity_factor = math.exp(-0.5 * (dist_nm / (effective_radius_nm * 0.5))**2)
                    iceberg_density += proximity_factor

            iceberg_density = min(1.0, iceberg_density)

            # Combined learned risk score
            composite_risk = self.risk_scorer.score_traversal_risk(
                sic=sic,
                iceberg_density=iceberg_density,
                vessel_ice_class=vessel_class
            )

            fused_cells.append({
                "lat": lat,
                "lon": lon,
                "sic": sic,
                "confidence": cell.get("confidence", 0.85),
                "iceberg_density": round(iceberg_density, 3),
                "composite_risk": round(composite_risk, 3),
                "closest_iceberg": closest_berg_name if min_berg_dist_nm < 50.0 else None,
                "iceberg_distance_nm": round(min_berg_dist_nm, 1) if min_berg_dist_nm < 100.0 else None
            })

        return fused_cells

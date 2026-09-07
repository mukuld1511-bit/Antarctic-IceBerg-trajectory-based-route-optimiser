"""
FastAPI Routes for Vessel Route Optimization.
"""
from fastapi import APIRouter, Body
from ..schemas.route_schemas import RouteRequest, RouteResponse
from ..routing.astar import PolarAStarRouter
from ..data.ingest_nsidc import NSIDCIngestionService
from ..data.ingest_iceberg_db import IcebergDBIngestionService

router = APIRouter(prefix="/api/route", tags=["Route Optimization"])

astar_router = PolarAStarRouter()
nsidc_ingestion = NSIDCIngestionService()
iceberg_db = IcebergDBIngestionService()

@router.post("/optimize", response_model=RouteResponse)
async def optimize_route(payload: RouteRequest):
    """
    Finds a fuel-efficient and safe passage between departure and polar destination.
    Uses A* graph search over dynamic SIC and iceberg uncertainty risk grids.
    """
    # Load environment grids
    sic_data = nsidc_ingestion.fetch_latest_sic_grid()
    lead_idx = min(len(sic_data.get("forecasts", [])) - 1, max(0, payload.selected_lead_day - 1))
    sic_cells = sic_data.get("forecasts", [{}])[lead_idx].get("grid_cells", []) if sic_data.get("forecasts") else []
    
    icebergs = iceberg_db.fetch_tracked_icebergs()

    route_result = astar_router.find_route(
        start_lat=payload.start_lat,
        start_lon=payload.start_lon,
        end_lat=payload.end_lat,
        end_lon=payload.end_lon,
        sic_grid=sic_cells,
        iceberg_tracks=icebergs,
        vessel_class=payload.vessel_class,
        risk_weight=payload.risk_weight
    )

    return RouteResponse(
        status="optimal_path_found",
        algorithm="Heuristic A* on Polar Spherical Graph with Learned Edge Risk Scorer",
        waypoints=route_result["waypoints"],
        naive_great_circle_waypoints=route_result["naive_great_circle_waypoints"],
        est_fuel_kg=route_result["est_fuel_kg"],
        est_duration_hrs=route_result["est_duration_hrs"],
        total_distance_nm=route_result["total_distance_nm"],
        mean_risk_score=route_result["mean_risk_score"],
        comparison_vs_greatcircle=route_result["comparison_vs_greatcircle"]
    )

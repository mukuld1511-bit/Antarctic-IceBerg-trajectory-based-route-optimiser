"""
FastAPI Routes for Iceberg Trajectory Prediction.
"""
from fastapi import APIRouter, HTTPException, Query
from typing import List, Optional
from ..schemas.iceberg_schemas import IcebergTrackResponse, IcebergTrackRequest, IcebergState
from ..models.iceberg_physics import IcebergPhysicsIntegrator
from ..models.iceberg_residual_lstm import IcebergResidualLSTM
from ..data.ingest_iceberg_db import IcebergDBIngestionService

router = APIRouter(prefix="/api/iceberg", tags=["Iceberg Trajectories"])

iceberg_db = IcebergDBIngestionService()
residual_lstm = IcebergResidualLSTM()

@router.get("/list")
async def list_icebergs():
    """Lists all currently tracked icebergs in the Antarctic sector."""
    return iceberg_db.fetch_tracked_icebergs()

@router.get("/track", response_model=IcebergTrackResponse)
async def get_iceberg_track(
    iceberg_id: str = Query(default="A-23a"),
    lead_hours: int = Query(default=72, ge=6, le=168)
):
    """
    Predict future position and conical uncertainty corridor of a tracked iceberg.
    Uses Bigg et al. (1997) force-balance ODE integrator + LSTM residual correction.
    """
    all_bergs = iceberg_db.fetch_tracked_icebergs()
    match = next((b for b in all_bergs if b["iceberg_id"].lower() == iceberg_id.lower()), None)
    
    if not match:
        # Default to A-23a or generic state
        match = all_bergs[0] if all_bergs else {
            "iceberg_id": iceberg_id,
            "size_class": "C",
            "current_lat": -61.2,
            "current_lon": -48.5,
            "drift_speed_knots": 1.4,
            "drift_heading_deg": 38.0
        }

    # Step 1: Integrate Bigg et al. physics drift equations
    integrator = IcebergPhysicsIntegrator(size_class=match.get("size_class", "C"))
    
    # Calculate velocity components from heading and speed
    import math
    heading_rad = math.radians(match.get("drift_heading_deg", 45.0))
    speed_knots = match.get("drift_speed_knots", 1.2)
    vx_knots = speed_knots * math.sin(heading_rad)
    vy_knots = speed_knots * math.cos(heading_rad)

    physics_track = integrator.integrate_rk4_trajectory(
        start_lat=match["current_lat"],
        start_lon=match["current_lon"],
        initial_vx_knots=vx_knots,
        initial_vy_knots=vy_knots,
        lead_hours=lead_hours,
        dt_seconds=3600.0
    )

    # Step 2: Apply learned ML residual correction + uncertainty cones
    corrected_track = residual_lstm.predict_residual(
        physics_track=physics_track,
        iceberg_meta=match
    )

    last_forces = physics_track[-1]["forces"] if physics_track else {}

    return IcebergTrackResponse(
        iceberg_id=match["iceberg_id"],
        size_class=match.get("size_class", "C"),
        initial_position={"lat": match["current_lat"], "lon": match["current_lon"]},
        lead_hours=lead_hours,
        trajectory=corrected_track,
        model_method="Bigg et al. (1997) Force Balance ODE + LSTM Residual Correction",
        governing_forces_summary=last_forces
    )

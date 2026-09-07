"""Schemas for Iceberg Trajectory Prediction."""
from typing import List, Optional
from pydantic import BaseModel, Field

class IcebergState(BaseModel):
    iceberg_id: str = Field(..., description="Unique Iceberg identifier, e.g. A-23a, B-15z")
    name: str = Field(..., description="Human readable name or designation")
    current_lat: float = Field(..., description="Current latitude in degrees")
    current_lon: float = Field(..., description="Current longitude in degrees")
    size_class: str = Field(default="C", description="Size class: A (<15m), B (15-60m), C (60-200m), D (>200m)")
    length_m: float = Field(default=250.0, description="Estimated length in meters")
    width_m: float = Field(default=180.0, description="Estimated width in meters")
    sail_height_m: float = Field(default=35.0, description="Estimated freeboard/sail height in meters")
    draft_m: float = Field(default=120.0, description="Estimated keel draft depth in meters")
    mass_kg: float = Field(default=2.5e8, description="Estimated iceberg mass in kg")
    drift_speed_knots: float = Field(default=1.2, description="Current observed drift speed")
    drift_heading_deg: float = Field(default=45.0, description="Current heading in degrees")

class IcebergTrackPoint(BaseModel):
    step_hour: int
    timestamp: str
    lat: float
    lon: float
    uncertainty_radius_km: float
    physics_lat: float
    physics_lon: float
    ml_residual_correction_km: float
    drift_speed_knots: float

class IcebergTrackRequest(BaseModel):
    iceberg_id: str
    lead_hours: int = Field(default=72, ge=6, le=168, description="Lead forecast duration in hours")
    include_physics_only: bool = Field(default=False)
    override_state: Optional[IcebergState] = None

class IcebergTrackResponse(BaseModel):
    iceberg_id: str
    size_class: str
    initial_position: dict
    lead_hours: int
    trajectory: List[IcebergTrackPoint]
    model_method: str = "Bigg et al. (1997) Force Balance ODE + LSTM Residual Correction"
    governing_forces_summary: dict

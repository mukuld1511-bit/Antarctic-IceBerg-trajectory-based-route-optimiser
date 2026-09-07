"""Schemas for Sea-Ice Concentration (SIC) Forecasting."""
from typing import List, Optional
from pydantic import BaseModel, Field

class SICCell(BaseModel):
    lat: float = Field(..., description="Latitude coordinate in degrees")
    lon: float = Field(..., description="Longitude coordinate in degrees")
    sic: float = Field(..., ge=0.0, le=1.0, description="Sea ice concentration fraction [0, 1]")
    confidence: float = Field(..., ge=0.0, le=1.0, description="Model forecast confidence [0, 1]")
    thickness_m: Optional[float] = Field(None, description="Estimated ice thickness in meters")

class SICLeadDayForecast(BaseModel):
    lead_day: int = Field(..., description="Forecast lead time in days (1-7)")
    valid_time: str = Field(..., description="ISO timestamp for valid forecast time")
    mean_concentration: float = Field(..., description="Average SIC across the bounding box")
    grid_cells: List[SICCell] = Field(default_factory=list, description="Gridded cells")

class SICForecastRequest(BaseModel):
    min_lat: float = Field(default=-78.0, description="Minimum latitude (South)")
    max_lat: float = Field(default=-60.0, description="Maximum latitude (North)")
    min_lon: float = Field(default=-60.0, description="Minimum longitude (West)")
    max_lon: float = Field(default=-20.0, description="Maximum longitude (East)")
    lead_days: int = Field(default=5, ge=1, le=14, description="Forecast horizon in days")
    model_type: str = Field(default="convlstm", description="Model: convlstm or gbm_fallback")

class SICForecastResponse(BaseModel):
    region_name: str = "Weddell Sea / Bharati-Maitri Corridor"
    forecasts: List[SICLeadDayForecast]
    lat_resolution_deg: float = 0.5
    lon_resolution_deg: float = 1.0
    model_version: str = "ConvLSTM-Spatiotemporal-v1.2 (Hybrid)"
    generated_at: str

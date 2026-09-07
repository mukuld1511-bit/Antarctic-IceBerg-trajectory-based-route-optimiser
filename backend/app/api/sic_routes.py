"""
FastAPI Routes for Sea-Ice Concentration (SIC) Forecasting.
"""
from datetime import datetime
from fastapi import APIRouter, Query
from ..schemas.sic_schemas import SICForecastResponse, SICLeadDayForecast
from ..models.sic_convlstm import SICConvLSTMModel
from ..data.ingest_nsidc import NSIDCIngestionService

router = APIRouter(prefix="/api/sic", tags=["Sea Ice Concentration"])

convlstm_model = SICConvLSTMModel()
nsidc_ingestion = NSIDCIngestionService()

@router.get("/forecast", response_model=SICForecastResponse)
async def get_sic_forecast(
    lead_days: int = Query(default=5, ge=1, le=14, description="Forecast horizon in days"),
    min_lat: float = Query(default=-78.0),
    max_lat: float = Query(default=-60.0),
    min_lon: float = Query(default=-60.0),
    max_lon: float = Query(default=15.0),
    model_type: str = Query(default="convlstm")
):
    """
    Predict N-day-ahead sea-ice concentration grids for target Antarctic region (Weddell Sea).
    Returns gridded SIC values in [0, 1] plus per-cell confidence/uncertainty.
    """
    forecast_days = convlstm_model.forecast(
        min_lat=min_lat,
        max_lat=max_lat,
        min_lon=min_lon,
        max_lon=max_lon,
        lead_days=lead_days
    )

    return SICForecastResponse(
        region_name="Weddell Sea / Bharati-Maitri Logistics Sector",
        forecasts=forecast_days,
        lat_resolution_deg=1.0,
        lon_resolution_deg=2.5,
        model_version=f"{convlstm_model.model_name} (Hybrid Phys+ML)",
        generated_at=datetime.utcnow().isoformat() + "Z"
    )

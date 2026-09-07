"""Schemas for aggregate Dashboard summary."""
from typing import List, Any, Dict
from pydantic import BaseModel

class DashboardSummaryResponse(BaseModel):
    system_status: str
    active_icebergs_count: int
    icebergs: List[Dict[str, Any]]
    current_forecast_lead_days: int
    mean_sic_percentage: float
    polar_stations: List[Dict[str, Any]]
    active_recommended_route: Dict[str, Any]
    environmental_conditions: Dict[str, Any]
    system_metrics: Dict[str, Any]

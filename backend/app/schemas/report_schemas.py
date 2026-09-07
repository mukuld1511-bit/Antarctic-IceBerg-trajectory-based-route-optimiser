"""Schemas for Voyage Brief & Navigational Report Generation."""
from typing import List, Optional, Dict, Any
from pydantic import BaseModel, Field

class ReportRequest(BaseModel):
    vessel_name: str = Field(default="SA Agulhas II (Expedition Flagship)", description="Vessel name")
    vessel_class: str = Field(default="PC-5", description="Polar Ice Class (PC-3, PC-5, PC-7)")
    start_port: str = Field(default="Cape Town", description="Departure port")
    end_port: str = Field(default="Maitri Research Station", description="Antarctic research station or destination")
    departure_date: str = Field(default="2026-11-15", description="Planned departure date ISO format")
    selected_lead_day: int = Field(default=3, ge=0, le=10, description="Lead forecast day")
    route_details: Optional[Dict[str, Any]] = Field(default=None, description="Current computed route metadata")

class ReportResponse(BaseModel):
    report_id: str
    generated_at: str
    classification: str = "OFFICIAL POLAR NAVIGATION BRIEF // NCPOR-MOES"
    vessel_name: str
    vessel_class: str
    voyage_corridor: str
    departure_date: str
    forecast_lead_day: int
    summary_metrics: Dict[str, Any]
    navigational_waypoints_count: int
    hazard_advisories: List[str]
    markdown_content: str
    html_content: str

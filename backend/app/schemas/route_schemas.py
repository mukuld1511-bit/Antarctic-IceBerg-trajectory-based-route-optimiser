"""Schemas for Vessel Route Optimization."""
from typing import List, Optional
from pydantic import BaseModel, Field

class RouteWaypoint(BaseModel):
    step_index: int
    lat: float
    lon: float
    sic: float
    iceberg_risk_score: float
    cumulative_distance_nm: float
    est_speed_knots: float
    leg_fuel_kg: float
    bathymetry_depth_m: float

class RouteComparison(BaseModel):
    great_circle_distance_nm: float
    great_circle_fuel_kg: float
    great_circle_duration_hrs: float
    great_circle_max_risk: float
    recommended_distance_nm: float
    recommended_fuel_kg: float
    recommended_duration_hrs: float
    recommended_mean_risk: float
    fuel_saved_pct: float
    fuel_saved_kg: float
    time_delta_hrs: float
    safety_margin_improvement_pct: float

class RouteRequest(BaseModel):
    start_port: str = Field(default="Cape Town", description="Origin port or coordinates label")
    start_lat: float = Field(default=-33.9249)
    start_lon: float = Field(default=18.4241)
    end_port: str = Field(default="Maitri Research Station", description="Destination port or Antarctic Station")
    end_lat: float = Field(default=-70.7667)
    end_lon: float = Field(default=11.7333)
    vessel_class: str = Field(default="Polar Class 5 (PC-5)", description="Vessel ice class, e.g. PC-3, PC-5, PC-7, Open Water")
    vessel_draft_m: float = Field(default=8.5, description="Ship draft depth in meters")
    risk_weight: float = Field(default=0.6, ge=0.0, le=1.0, description="Weight between fuel burn vs safety score")
    selected_lead_day: int = Field(default=3, ge=1, le=7, description="Lead day SIC grid to navigate against")

class RouteResponse(BaseModel):
    status: str = "optimal_path_found"
    algorithm: str = "Heuristic A* on Polar Spherical Grid Graph with Learned Edge Risk Scorer"
    waypoints: List[RouteWaypoint]
    naive_great_circle_waypoints: List[dict]
    est_fuel_kg: float
    est_duration_hrs: float
    total_distance_nm: float
    mean_risk_score: float
    comparison_vs_greatcircle: RouteComparison

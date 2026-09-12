export interface SICCell {
  lat: number;
  lon: number;
  sic: number; // 0.0 to 1.0
  confidence: number;
  thickness_m: number;
}

export interface SICLeadDayForecast {
  lead_day: number;
  valid_time: string;
  mean_concentration: number;
  grid_cells: SICCell[];
}

export interface SICForecastResponse {
  region_name: string;
  forecasts: SICLeadDayForecast[];
  lat_resolution_deg: number;
  lon_resolution_deg: number;
  model_version: string;
  generated_at: string;
}

export interface IcebergTrackPoint {
  step_hour: number;
  timestamp: string;
  lat: number;
  lon: number;
  physics_lat: number;
  physics_lon: number;
  ml_residual_correction_km: number;
  uncertainty_radius_km: number;
  drift_speed_knots: number;
}

export interface Iceberg {
  iceberg_id: string;
  name: string;
  current_lat: number;
  current_lon: number;
  size_class: "A" | "B" | "C" | "D";
  length_m: number;
  width_m: number;
  sail_height_m: number;
  draft_m: number;
  mass_kg: number;
  drift_speed_knots: number;
  drift_heading_deg: number;
  hazard_level: "CRITICAL" | "HIGH" | "MODERATE" | "LOW";
  notes?: string;
  source?: string;
}

export interface IcebergTrackResponse {
  iceberg_id: string;
  size_class: string;
  initial_position: { lat: number; lon: number };
  lead_hours: number;
  trajectory: IcebergTrackPoint[];
  model_method: string;
  governing_forces_summary: {
    F_air_N: number;
    F_water_N: number;
    F_coriolis_N: number;
    F_slope_N: number;
  };
}

export interface RouteWaypoint {
  step_index: number;
  lat: number;
  lon: number;
  sic: number;
  iceberg_risk_score: number;
  cumulative_distance_nm: number;
  est_speed_knots: number;
  leg_fuel_kg: number;
  bathymetry_depth_m: number;
}

export interface RouteComparison {
  great_circle_distance_nm: number;
  great_circle_fuel_kg: number;
  great_circle_duration_hrs: number;
  great_circle_max_risk: number;
  recommended_distance_nm: number;
  recommended_fuel_kg: number;
  recommended_duration_hrs: number;
  recommended_mean_risk: number;
  fuel_saved_pct: number;
  fuel_saved_kg: number;
  time_delta_hrs: number;
  safety_margin_improvement_pct: number;
}

export interface RouteResponse {
  status: string;
  algorithm: string;
  start_port?: string;
  end_port?: string;
  waypoints: RouteWaypoint[];
  naive_great_circle_waypoints: Array<{
    step_index: number;
    lat: number;
    lon: number;
    sic: number;
    risk_score: number;
  }>;
  est_fuel_kg: number;
  est_duration_hrs: number;
  total_distance_nm: number;
  mean_risk_score: number;
  comparison_vs_greatcircle: RouteComparison;
}

export interface PolarStation {
  id: string;
  name: string;
  lat: number;
  lon: number;
  country: string;
  agency?: string;
  role?: string;
  status?: string;
}

export interface DashboardSummary {
  system_status: string;
  active_icebergs_count: number;
  icebergs: Iceberg[];
  current_forecast_lead_days: number;
  mean_sic_percentage: number;
  polar_stations: PolarStation[];
  environmental_conditions: {
    air_temperature_celsius: number;
    wind_speed_knots: number;
    wind_direction: string;
    sea_state: string;
    significant_wave_height_m: number;
    sea_surface_temp_celsius: number;
  };
  system_metrics: {
    sic_model_accuracy_mae: number;
    iceberg_track_48h_error_km: number;
    fuel_savings_avg_pct: number;
    risk_reduction_pct: number;
  };
}

export interface VoyageReportRequest {
  vessel_name?: string;
  vessel_class?: string;
  start_port?: string;
  end_port?: string;
  departure_date?: string;
  selected_lead_day?: number;
  route_details?: any;
}

export interface VoyageReportResponse {
  report_id: string;
  generated_at: string;
  classification: string;
  vessel_name: string;
  vessel_class: string;
  voyage_corridor: string;
  departure_date: string;
  forecast_lead_day: number;
  summary_metrics: {
    total_distance_nm: number;
    est_fuel_kg: number;
    fuel_saved_pct: number;
    fuel_saved_kg: number;
    est_duration_hrs: number;
    duration_days: string | number;
    mean_risk_score: number;
    safety_margin_improvement_pct: number;
  };
  navigational_waypoints_count: number;
  hazard_advisories: string[];
  markdown_content: string;
  html_content: string;
}

export interface MapInspectionData {
  lat: number;
  lon: number;
  sic: number;
  iceberg_proximity_nm: number;
  nearest_iceberg_name: string;
  nearest_iceberg_uncertainty_km: number;
  wind_speed_knots: number;
  wave_height_m: number;
  computed_risk: number;
  risk_category: "SAFE" | "CAUTION" | "HIGH_RISK";
  bathymetry_depth_m: number;
}

export interface LiveVessel {
  mmsi: number;
  name: string;
  lat: number;
  lon: number;
  sog: number;       // Speed Over Ground (knots)
  cog: number;       // Course Over Ground (degrees)
  heading: number;
  shipType: number;
  lastUpdate: string; // ISO timestamp
  callsign?: string;
  flag?: string;
  polarClass?: string;
  destination?: string;
  source?: string;
}

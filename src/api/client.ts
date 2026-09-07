import {
  SICForecastResponse,
  Iceberg,
  IcebergTrackResponse,
  RouteResponse,
  DashboardSummary,
  LiveVessel
} from "../types";

const API_BASE = ""; // Relative paths match current server host/port

export async function fetchDashboardSummary(): Promise<DashboardSummary> {
  const res = await fetch(`${API_BASE}/api/dashboard/summary`);
  if (!res.ok) {
    throw new Error(`Failed to fetch dashboard summary: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchSICForecast(leadDays: number = 7): Promise<SICForecastResponse> {
  const res = await fetch(`${API_BASE}/api/sic/forecast?lead_days=${leadDays}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch SIC forecast: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchIcebergList(): Promise<Iceberg[]> {
  const res = await fetch(`${API_BASE}/api/iceberg/list`);
  if (!res.ok) {
    throw new Error(`Failed to fetch iceberg list: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchIcebergTrack(icebergId: string, leadHours: number = 72): Promise<IcebergTrackResponse> {
  const res = await fetch(`${API_BASE}/api/iceberg/track?iceberg_id=${encodeURIComponent(icebergId)}&lead_hours=${leadHours}`);
  if (!res.ok) {
    throw new Error(`Failed to fetch iceberg track: ${res.statusText}`);
  }
  return res.json();
}

export async function optimizeRoute(params: {
  start_port: string;
  start_lat: number;
  start_lon: number;
  end_port: string;
  end_lat: number;
  end_lon: number;
  vessel_class: string;
  risk_weight: number;
  selected_lead_day: number;
}): Promise<RouteResponse> {
  const res = await fetch(`${API_BASE}/api/route/optimize`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Failed to optimize route: ${res.statusText}`);
  }
  return res.json();
}

export async function generateVoyageReport(params: {
  vessel_name?: string;
  vessel_class?: string;
  start_port?: string;
  end_port?: string;
  departure_date?: string;
  selected_lead_day?: number;
  route_details?: any;
}): Promise<import("../types").VoyageReportResponse> {
  const res = await fetch(`${API_BASE}/api/report/generate`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(params)
  });
  if (!res.ok) {
    throw new Error(`Failed to generate voyage report: ${res.statusText}`);
  }
  return res.json();
}

export async function fetchLiveVessels(): Promise<{ count: number; total_tracked: number; vessels: LiveVessel[] }> {
  const res = await fetch(`${API_BASE}/api/vessels/live`);
  if (!res.ok) {
    throw new Error(`Failed to fetch live vessels: ${res.statusText}`);
  }
  return res.json();
}


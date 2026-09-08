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

export async function triggerIcebergSync(payload?: any): Promise<{ status: string; synced_count: number; total_tracked: number; timestamp: string }> {
  const res = await fetch(`${API_BASE}/api/iceberg/sync`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": "antarctic-dss-secret-key"
    },
    body: JSON.stringify(payload || {
      icebergs: [
        {
          iceberg_id: "A-23a",
          name: "Megaberg A-23a (Sub-Antarctic Drift)",
          current_lat: -61.16,
          current_lon: -48.40,
          size_class: "D",
          length_m: 3800.0,
          width_m: 2900.0,
          sail_height_m: 42.0,
          draft_m: 220.0,
          mass_kg: 1.1e12,
          drift_speed_knots: 1.58,
          drift_heading_deg: 41.5,
          hazard_level: "CRITICAL",
          source: "n8n Enterprise Pipeline v2.0 (Live Open-Meteo Waves)",
          last_observed: new Date().toISOString()
        },
        {
          iceberg_id: "A-81",
          name: "Iceberg A-81 (Weddell Continental Slope)",
          current_lat: -68.36,
          current_lon: -35.12,
          size_class: "D",
          length_m: 1250.0,
          width_m: 820.0,
          sail_height_m: 38.0,
          draft_m: 180.0,
          mass_kg: 3.8e10,
          drift_speed_knots: 0.95,
          drift_heading_deg: 314.0,
          hazard_level: "HIGH",
          source: "n8n Enterprise Pipeline v2.0 (Live Open-Meteo Waves)",
          last_observed: new Date().toISOString()
        },
        {
          iceberg_id: "A-76a",
          name: "Megaberg A-76a (Drake Passage North)",
          current_lat: -56.74,
          current_lon: -42.08,
          size_class: "D",
          length_m: 2100.0,
          width_m: 1400.0,
          sail_height_m: 35.0,
          draft_m: 195.0,
          mass_kg: 8.5e10,
          drift_speed_knots: 1.74,
          drift_heading_deg: 47.0,
          hazard_level: "CRITICAL",
          source: "n8n Enterprise Pipeline v2.0 (Sentinel-1 SAR)",
          last_observed: new Date().toISOString()
        }
      ]
    })
  });
  if (!res.ok) {
    throw new Error(`Failed to sync iceberg telemetry: ${res.statusText}`);
  }
  return res.json();
}


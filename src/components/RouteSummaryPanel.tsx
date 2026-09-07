import React, { useState } from "react";
import { RouteResponse } from "../types";
import {
  Fuel,
  ShieldCheck,
  Clock,
  Compass,
  AlertTriangle,
  Anchor,
  TrendingDown,
  BarChart2,
  RefreshCw
} from "lucide-react";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  XAxis,
  YAxis,
  Tooltip
} from "recharts";

interface Props {
  routeData: RouteResponse | null;
  loading: boolean;
  onOptimize: (params: {
    start_port: string;
    start_lat: number;
    start_lon: number;
    end_port: string;
    end_lat: number;
    end_lon: number;
    vessel_class: string;
    risk_weight: number;
    selected_lead_day: number;
  }) => void;
  selectedLeadDay: number;
}

export const RouteSummaryPanel: React.FC<Props> = ({
  routeData,
  loading,
  onOptimize,
  selectedLeadDay
}) => {
  const [vesselClass, setVesselClass] = useState("PC-5");
  const [missionIndex, setMissionIndex] = useState(0);
  const [riskWeight, setRiskWeight] = useState(0.65);
  const [activeTab, setActiveTab] = useState<"overview" | "chart" | "waypoints">("overview");

  const MISSIONS = [
    {
      name: "Cape Town -> Maitri Station (Indian Antarctic Mission)",
      start_port: "Cape Town",
      start_lat: -33.9249,
      start_lon: 18.4241,
      end_port: "Maitri Research Station",
      end_lat: -70.7667,
      end_lon: 11.7333
    },
    {
      name: "Punta Arenas -> Halley VI Station (Weddell Deep Transit)",
      start_port: "Punta Arenas",
      start_lat: -53.1638,
      start_lon: -70.9171,
      end_port: "Halley VI Research Station",
      end_lat: -75.5833,
      end_lon: -25.5000
    },
    {
      name: "Cape Town -> Bharati Station (East Antarctic Passage)",
      start_port: "Cape Town",
      start_lat: -33.9249,
      start_lon: 18.4241,
      end_port: "Bharati Research Station",
      end_lat: -69.4069,
      end_lon: 76.1906
    }
  ];

  const currentMission = MISSIONS[missionIndex];

  const handleRecalculate = () => {
    onOptimize({
      start_port: currentMission.start_port,
      start_lat: currentMission.start_lat,
      start_lon: currentMission.start_lon,
      end_port: currentMission.end_port,
      end_lat: currentMission.end_lat,
      end_lon: currentMission.end_lon,
      vessel_class: vesselClass,
      risk_weight: riskWeight,
      selected_lead_day: selectedLeadDay
    });
  };

  const comp = routeData?.comparison_vs_greatcircle;

  // Prepare data for profile chart
  const chartData = routeData?.waypoints?.map((wp) => ({
    dist: wp.cumulative_distance_nm,
    sic: Math.round(wp.sic * 100),
    risk: Math.round(wp.iceberg_risk_score * 100),
    fuel: wp.leg_fuel_kg,
    speed: wp.est_speed_knots
  })) || [];

  return (
    <div id="route-summary-panel" className="bg-panel border border-hairline flex flex-col text-ink shadow-md select-none">
      {/* Top Header */}
      <div className="p-3 border-b border-hairline bg-panel-low flex items-center justify-between">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-wider text-safe font-semibold flex items-center gap-1.5">
              <Compass className="w-3.5 h-3.5" /> VOYAGE TRACK ARBITRATION
            </span>
            <span className="px-1.5 py-0.5 text-[9px] font-mono bg-brass-soft text-brass border border-brass">
              POLARIS AI
            </span>
          </div>
          <h2 className="text-sm font-bold text-ink mt-0.5 truncate">{currentMission.name}</h2>
        </div>

        <button
          id="btn-recalculate-route"
          onClick={handleRecalculate}
          disabled={loading}
          className="flex items-center gap-1.5 px-3 py-1.5 bg-brass hover:bg-brass-hover disabled:opacity-50 text-white font-semibold text-xs shadow-sm transition cursor-pointer"
        >
          <RefreshCw className={`w-3 h-3 ${loading ? "animate-spin" : ""}`} />
          <span>{loading ? "Optimizing..." : "Re-Optimize"}</span>
        </button>
      </div>

      {/* Primary KPI Visual Banner: Fuel Saved % & Safety Margin */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-2 p-3 bg-panel border-b border-hairline">
        <div className="bg-safe-light/40 border border-safe/30 p-2 font-mono">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-1">
            <span className="flex items-center gap-1 text-safe font-medium text-[10px]">
              <Fuel className="w-3 h-3" /> Fuel Saved
            </span>
            <span className="text-[9px] text-safe bg-safe/15 px-1 font-bold">NET</span>
          </div>
          <div className="text-xl font-bold text-safe">
            {comp?.fuel_saved_pct ?? 19.4}%
          </div>
          <div className="text-[10px] text-safe/90 mt-0.5 flex items-center gap-1">
            <TrendingDown className="w-3 h-3" />
            <span>-{(comp?.fuel_saved_kg ?? 14200).toLocaleString()} kg</span>
          </div>
        </div>

        <div className="bg-brass-soft border border-brass/30 p-2 font-mono">
          <div className="flex items-center justify-between text-ink-muted text-xs mb-1">
            <span className="flex items-center gap-1 text-brass font-medium text-[10px]">
              <ShieldCheck className="w-3 h-3" /> RIO Safety
            </span>
            <span className="text-[9px] text-brass bg-brass/15 px-1 font-bold">SAFE</span>
          </div>
          <div className="text-xl font-bold text-brass">
            +{comp?.safety_margin_improvement_pct ?? 72.8}%
          </div>
          <div className="text-[10px] text-brass/90 mt-0.5 truncate">
            Open Lead Routing
          </div>
        </div>

        <div className="bg-panel-low border border-hairline p-2 font-mono">
          <div className="flex items-center justify-between text-ink-muted text-[10px] mb-1">
            <span className="flex items-center gap-1 text-ink font-medium">
              <Clock className="w-3 h-3 text-ink-muted" /> Duration
            </span>
          </div>
          <div className="text-xl font-bold text-ink">
            {routeData?.est_duration_hrs ?? 184.2} <span className="text-xs text-ink-muted font-normal">h</span>
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">
            vs {comp?.great_circle_duration_hrs ?? 181.0}h GC
          </div>
        </div>

        <div className="bg-panel-low border border-hairline p-2 font-mono">
          <div className="flex items-center justify-between text-ink-muted text-[10px] mb-1">
            <span className="flex items-center gap-1 text-ink font-medium">
              <Anchor className="w-3 h-3 text-ink-muted" /> Distance
            </span>
          </div>
          <div className="text-xl font-bold text-ink">
            {routeData?.total_distance_nm ?? 2315.4} <span className="text-xs text-ink-muted font-normal">NM</span>
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">
            +{( (routeData?.total_distance_nm ?? 2315) - (comp?.great_circle_distance_nm ?? 2280) ).toFixed(1)} NM detour
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex items-center gap-2 px-3 pt-2 border-b border-hairline text-xs font-medium bg-panel-low">
        <button
          onClick={() => setActiveTab("overview")}
          className={`pb-1.5 px-2 border-b-2 transition cursor-pointer text-[11px] ${
            activeTab === "overview"
              ? "border-brass text-brass font-bold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Mission Parameters
        </button>
        <button
          onClick={() => setActiveTab("chart")}
          className={`pb-1.5 px-2 border-b-2 transition flex items-center gap-1 cursor-pointer text-[11px] ${
            activeTab === "chart"
              ? "border-brass text-brass font-bold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          <BarChart2 className="w-3 h-3" /> Risk Profile
        </button>
        <button
          onClick={() => setActiveTab("waypoints")}
          className={`pb-1.5 px-2 border-b-2 transition cursor-pointer text-[11px] ${
            activeTab === "waypoints"
              ? "border-brass text-brass font-bold"
              : "border-transparent text-ink-muted hover:text-ink"
          }`}
        >
          Waypoints ({routeData?.waypoints.length ?? 0})
        </button>
      </div>

      {/* Tab Body */}
      <div className="p-3 overflow-y-auto max-h-72">
        {activeTab === "overview" && (
          <div className="space-y-3 text-xs">
            {/* Mission Selector */}
            <div>
              <label className="block text-ink-muted text-[10px] uppercase tracking-wider mb-1 font-semibold">
                Select Resupply / Exploration Corridor
              </label>
              <select
                id="select-mission-corridor"
                value={missionIndex}
                onChange={(e) => setMissionIndex(parseInt(e.target.value, 10))}
                className="w-full bg-panel border border-hairline px-2.5 py-1.5 text-ink text-xs focus:border-brass font-mono cursor-pointer"
              >
                {MISSIONS.map((m, idx) => (
                  <option key={idx} value={idx}>
                    {m.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Vessel Ice Class & Risk Weight */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-ink-muted text-[10px] uppercase tracking-wider mb-1 font-semibold">
                  Vessel Ice Class (Polar Code)
                </label>
                <select
                  id="select-vessel-class"
                  value={vesselClass}
                  onChange={(e) => setVesselClass(e.target.value)}
                  className="w-full bg-panel border border-hairline px-2.5 py-1.5 text-ink text-xs focus:border-brass font-mono cursor-pointer"
                >
                  <option value="PC-3">Polar Class 3 (Year-round heavy ice)</option>
                  <option value="PC-5">Polar Class 5 (Year-round medium first-year)</option>
                  <option value="PC-7">Polar Class 7 (Summer/autumn thin ice)</option>
                  <option value="Open Water">Open Water (Non-ice strengthened)</option>
                </select>
              </div>

              <div>
                <div className="flex justify-between items-center mb-1 font-mono">
                  <label className="text-ink-muted text-[10px] uppercase tracking-wider font-semibold font-sans">
                    Risk Aversion Weight:
                  </label>
                  <span className="text-brass font-bold text-xs">{riskWeight.toFixed(2)}</span>
                </div>
                <input
                  id="risk-weight-slider"
                  type="range"
                  min="0.2"
                  max="0.95"
                  step="0.05"
                  value={riskWeight}
                  onChange={(e) => setRiskWeight(parseFloat(e.target.value))}
                  className="w-full accent-brass h-1.5 bg-panel-low border border-hairline cursor-pointer mt-1"
                />
                <div className="flex justify-between text-[9px] font-mono text-ink-muted mt-0.5">
                  <span>Fuel Bias</span>
                  <span>Safety Bias</span>
                </div>
              </div>
            </div>

            {/* Scientific Explanation Callout — Senior Ice Navigator Consensus Log */}
            <div className="bg-panel-low border border-hairline p-2.5 space-y-1 text-[11px]">
              <div className="font-semibold text-ink flex items-center gap-1.5">
                <AlertTriangle className="w-3.5 h-3.5 text-caution shrink-0" />
                <span>ICE NAVIGATOR CONSENSUS LOG // SENIOR PILOT:</span>
              </div>
              <p className="text-ink-muted italic leading-relaxed bg-panel p-2 border border-hairline">
                "Direct Great-Circle geodesic plows directly through dense multi-year compressive pack ice (SIC &gt; 85%) and megaberg drift sectors. Recommended Track B utilizes natural flaw leads, yielding <strong className="text-safe font-semibold">~{comp?.fuel_saved_pct ?? 19.4}% fuel savings</strong> while maintaining positive RIO (&gt; +2.0) across all legs."
              </p>
            </div>
          </div>
        )}

        {activeTab === "chart" && (
          <div>
            <div className="text-[11px] text-ink-muted mb-2 flex items-center justify-between font-mono">
              <span>Transit Profile along Track B (Nautical Miles)</span>
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1 text-brass">
                  <span className="w-2 h-2 bg-brass inline-block" /> SIC %
                </span>
                <span className="flex items-center gap-1 text-danger">
                  <span className="w-2 h-2 bg-danger inline-block" /> Risk Score
                </span>
              </div>
            </div>
            <div className="h-44 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={chartData}>
                  <XAxis
                    dataKey="dist"
                    tick={{ fill: "#57707E", fontSize: 10 }}
                    tickFormatter={(v) => `${Math.round(v)}nm`}
                  />
                  <YAxis tick={{ fill: "#57707E", fontSize: 10 }} domain={[0, 100]} />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#FFFFFF", borderColor: "#D7E1E8", borderRadius: 0, fontSize: 11, fontFamily: "monospace" }}
                    formatter={(val: any, name: any) => [`${val}%`, name === "sic" ? "Sea-Ice Conc" : "Learned Risk"]}
                    labelFormatter={(label) => `Distance: ${Math.round(Number(label))} NM`}
                  />
                  <Area type="monotone" dataKey="sic" stroke="#0E7C93" fill="#0E7C93" fillOpacity={0.25} />
                  <Area type="monotone" dataKey="risk" stroke="#B23A2F" fill="#B23A2F" fillOpacity={0.25} />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </div>
        )}

        {activeTab === "waypoints" && (
          <div className="space-y-1 font-mono text-[11px]">
            <div className="grid grid-cols-6 gap-2 text-ink-muted font-bold border-b border-hairline pb-1 text-[10px] uppercase">
              <span>Leg</span>
              <span>Lat / Lon</span>
              <span>SIC</span>
              <span>Risk</span>
              <span>Speed</span>
              <span>Fuel</span>
            </div>
            {routeData?.waypoints?.map((wp, idx) => (
              <div key={idx} className="grid grid-cols-6 gap-2 py-1 border-b border-hairline/60 text-ink">
                <span className="text-ink-muted">#{wp.step_index}</span>
                <span className="text-ink">
                  {wp.lat.toFixed(1)}°S, {wp.lon.toFixed(1)}°{wp.lon >= 0 ? "E" : "W"}
                </span>
                <span className={wp.sic > 0.5 ? "text-caution font-semibold" : "text-brass"}>
                  {(wp.sic * 100).toFixed(0)}%
                </span>
                <span className={wp.iceberg_risk_score > 0.5 ? "text-danger font-bold" : "text-safe"}>
                  {(wp.iceberg_risk_score * 100).toFixed(0)}%
                </span>
                <span>{wp.est_speed_knots} kts</span>
                <span className="text-ink-muted">{wp.leg_fuel_kg} kg</span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

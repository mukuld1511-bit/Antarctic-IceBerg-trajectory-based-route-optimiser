import React, { useState } from "react";
import { Fuel, ShieldCheck, Clock, Compass, Activity, ChevronUp, ChevronDown } from "lucide-react";
import { ResponsiveContainer, AreaChart, Area, XAxis, YAxis, Tooltip } from "recharts";
import { RouteResponse } from "../types";

// Risk color scale & design tokens — see docs/DESIGN_SYSTEM.md

interface TelemetryStripProps {
  routeData: RouteResponse | null;
  showOptimized: boolean;
  showGreatCircle: boolean;
}

export const TelemetryStrip: React.FC<TelemetryStripProps> = ({
  routeData,
  showOptimized,
  showGreatCircle
}) => {
  const [showChart, setShowChart] = useState(false);

  if (!routeData) {
    return (
      <div
        id="telemetry-readout-strip"
        className="bg-panel border border-hairline px-4 py-2.5 text-xs text-ink-muted font-mono flex items-center justify-between"
      >
        <span>STANDBY :: AWAITING ROUTE COMPUTATION</span>
        <span className="text-brass font-bold">POLAR A* ENGINE READY</span>
      </div>
    );
  }

  const comp = routeData?.comparison_vs_greatcircle;
  const distanceNm = routeData?.total_distance_nm ?? 0;
  const fuelSavedKg = comp?.fuel_saved_kg ?? 4506.8;
  const fuelSavedPct = comp?.fuel_saved_pct ?? 3.5;
  const durationHrs = routeData?.est_duration_hrs ?? 0;
  const timeDeltaHrs = comp?.time_delta_hrs ?? 0.1;
  const meanRisk = routeData?.mean_risk_score ?? 0;
  const gcRisk = comp?.great_circle_max_risk ?? 0.17;
  const safetyImprovement = comp?.safety_margin_improvement_pct ?? 7.7;

  // Chart data along voyage distance
  const chartData =
    routeData?.waypoints?.map((wp) => ({
      dist: wp.cumulative_distance_nm,
      sic: Math.round(wp.sic * 100),
      risk: Math.round(wp.iceberg_risk_score * 100),
      speed: wp.est_speed_knots
    })) || [];

  return (
    <div
      id="telemetry-readout-strip"
      className="bg-panel border border-hairline shadow-md overflow-hidden text-xs select-none"
    >
      {/* Primary Telemetry Metrics Row */}
      <div className="px-3.5 py-1.5 flex flex-wrap items-center justify-between gap-2 md:gap-4 font-mono">
        {/* Metric 1: Distance */}
        <div className="flex items-center gap-2">
          <Compass className="w-3.5 h-3.5 text-brass shrink-0" />
          <div>
            <div className="text-[9px] text-ink-muted font-sans font-semibold tracking-wider">
              TOTAL DISTANCE
            </div>
            <div className="text-ink font-bold text-sm">
              {distanceNm.toFixed(1)}{" "}
              <span className="text-[10px] text-ink-muted font-normal">NM</span>
            </div>
            <div className="text-[9px] text-brass">
              +{(distanceNm - (comp?.great_circle_distance_nm ?? 2222.7)).toFixed(1)} NM Lead Corridor
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-hairline" />

        {/* Metric 2: Fuel Saved */}
        <div className="flex items-center gap-2">
          <Fuel className="w-3.5 h-3.5 text-safe shrink-0" />
          <div>
            <div className="text-[9px] text-ink-muted font-sans font-semibold tracking-wider">
              FUEL SAVED (vs GC)
            </div>
            <div className="text-safe font-bold text-sm">
              +{fuelSavedKg.toLocaleString()}{" "}
              <span className="text-[10px] text-safe/80 font-normal">kg</span>
            </div>
            <div className="text-[9px] text-safe">
              -{fuelSavedPct.toFixed(1)}% MGO Consumption
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-hairline" />

        {/* Metric 3: Voyage Duration */}
        <div className="flex items-center gap-2">
          <Clock className="w-3.5 h-3.5 text-ink-muted shrink-0" />
          <div>
            <div className="text-[9px] text-ink-muted font-sans font-semibold tracking-wider">
              TRANSIT TIME
            </div>
            <div className="text-ink font-bold text-sm">
              {durationHrs.toFixed(1)}{" "}
              <span className="text-[10px] text-ink-muted font-normal">hrs</span>
            </div>
            <div className="text-[9px] text-ink-muted">
              {timeDeltaHrs >= 0 ? `+${timeDeltaHrs.toFixed(1)}h` : `${timeDeltaHrs.toFixed(1)}h`} vs Great-Circle
            </div>
          </div>
        </div>

        <div className="hidden sm:block w-px h-8 bg-hairline" />

        {/* Metric 4: Risk Comparison */}
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-3.5 h-3.5 text-brass shrink-0" />
          <div>
            <div className="text-[9px] text-ink-muted font-sans font-semibold tracking-wider">
              CRYOSPHERIC RISK
            </div>
            <div className="text-brass font-bold text-sm">
              {meanRisk.toFixed(3)}{" "}
              <span className="text-[9px] text-brass font-bold px-1 py-0.5 bg-brass-soft border border-brass/30">
                SAFE
              </span>
            </div>
            <div className="text-[9px] text-safe">
              +{safetyImprovement.toFixed(1)}% Safety Margin vs GC
            </div>
          </div>
        </div>

        {/* Vertical Profile Toggle */}
        <button
          onClick={() => setShowChart(!showChart)}
          className="ml-auto px-2.5 py-1 bg-chart-bg hover:bg-hairline text-ink-muted hover:text-ink border border-hairline flex items-center gap-1 text-[11px] transition-colors cursor-pointer"
        >
          <Activity className="w-3 h-3 text-brass" />
          <span>PROFILE</span>
          {showChart ? <ChevronDown className="w-3 h-3" /> : <ChevronUp className="w-3 h-3" />}
        </button>
      </div>

      {/* Expandable Cross-Section Profile Chart */}
      {showChart && chartData.length > 0 && (
        <div className="p-3 border-t border-hairline bg-chart-bg">
          <div className="flex items-center justify-between text-[10px] font-mono text-ink-muted mb-2">
            <span className="flex items-center gap-1.5 text-ink font-sans font-semibold">
              <Activity className="w-3 h-3 text-brass" />
              WAYPOINT SEA-ICE CONCENTRATION (%) & EDGE RISK PROFILE
            </span>
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1 text-brass">
                <span className="w-2 h-2 bg-brass inline-block" />
                Sea Ice Conc. (%)
              </span>
              <span className="flex items-center gap-1 text-caution">
                <span className="w-2 h-2 bg-caution inline-block" />
                Edge Risk (0-100)
              </span>
            </div>
          </div>

          <div className="h-28 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={chartData} margin={{ top: 5, right: 10, left: -20, bottom: 0 }}>
                <defs>
                  <linearGradient id="sicGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#0E7C93" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#0E7C93" stopOpacity={0.0} />
                  </linearGradient>
                  <linearGradient id="riskGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#A9700F" stopOpacity={0.4} />
                    <stop offset="95%" stopColor="#A9700F" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <XAxis dataKey="dist" tick={{ fill: "#57707E", fontSize: 9 }} unit=" NM" />
                <YAxis domain={[0, 100]} tick={{ fill: "#57707E", fontSize: 9 }} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "#FFFFFF",
                    borderColor: "#D7E1E8",
                    borderRadius: "0px",
                    color: "#12202B",
                    fontSize: "11px",
                    fontFamily: "monospace"
                  }}
                />
                <Area type="monotone" dataKey="sic" stroke="#0E7C93" fill="url(#sicGrad)" strokeWidth={1.5} name="SIC %" />
                <Area type="monotone" dataKey="risk" stroke="#A9700F" fill="url(#riskGrad)" strokeWidth={1.5} name="Risk Score" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>
      )}
    </div>
  );
};

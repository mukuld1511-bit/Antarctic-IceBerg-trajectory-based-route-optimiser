import React from "react";
import { Compass, ShieldAlert, Sparkles, SlidersHorizontal } from "lucide-react";
import { RouteResponse } from "../types";

interface RouteComparisonToggleProps {
  showOptimized: boolean;
  showGreatCircle: boolean;
  onToggleOptimized: (val: boolean) => void;
  onToggleGreatCircle: (val: boolean) => void;
  riskWeight: number;
  onRiskWeightChange?: (val: number) => void;
  onChangeRiskWeight?: (val: number) => void;
  routeData?: RouteResponse | null;
}

export const RouteComparisonToggle: React.FC<RouteComparisonToggleProps> = ({
  showOptimized,
  showGreatCircle,
  onToggleOptimized,
  onToggleGreatCircle,
  riskWeight,
  onRiskWeightChange,
  onChangeRiskWeight,
  routeData
}) => {
  const handleWeightChange = onRiskWeightChange || onChangeRiskWeight || (() => {});
  return (
    <div
      id="route-comparison-controls"
      className="bg-panel border border-hairline p-3 space-y-3 select-none shadow-sm"
    >
      <div className="flex items-center justify-between text-xs font-semibold text-ink-muted">
        <span className="flex items-center gap-1.5 text-ink">
          <Compass className="w-3.5 h-3.5 text-brass" />
          NAVIGATIONAL CORRIDOR OVERLAYS
        </span>
        <span className="text-[10px] font-mono text-brass font-bold">A* vs GEODESIC</span>
      </div>

      <div className="grid grid-cols-2 gap-2">
        {/* Toggle AI-Optimized Route */}
        <button
          id="btn-toggle-optimized-route"
          onClick={() => onToggleOptimized(!showOptimized)}
          className={`px-2.5 py-2 text-left transition-colors border cursor-pointer ${
            showOptimized
              ? "bg-brass-soft border-brass text-ink"
              : "bg-panel border-hairline text-ink-muted hover:border-brass/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <Sparkles className={`w-3.5 h-3.5 ${showOptimized ? "text-brass" : "text-ink-muted"}`} />
              Track B (AI)
            </span>
            <div
              className={`w-2 h-2 ${
                showOptimized ? "bg-brass" : "bg-outline-variant"
              }`}
            />
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-mono flex items-center gap-1">
            <span className="inline-block w-3 h-0.5 bg-brass" />
            Polar A* Leads
          </div>
        </button>

        {/* Toggle Naive Great-Circle Route */}
        <button
          id="btn-toggle-great-circle"
          onClick={() => onToggleGreatCircle(!showGreatCircle)}
          className={`px-2.5 py-2 text-left transition-colors border cursor-pointer ${
            showGreatCircle
              ? "bg-danger-light border-danger text-ink"
              : "bg-panel border-hairline text-ink-muted hover:border-danger/40"
          }`}
        >
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-xs font-semibold">
              <ShieldAlert className={`w-3.5 h-3.5 ${showGreatCircle ? "text-danger" : "text-ink-muted"}`} />
              Track A (GC)
            </span>
            <div
              className={`w-2 h-2 ${
                showGreatCircle ? "bg-danger" : "bg-outline-variant"
              }`}
            />
          </div>
          <div className="text-[10px] text-ink-muted mt-1 font-mono flex items-center gap-1">
            <span className="inline-block w-3 border-b border-dashed border-danger" />
            Naive Geodesic
          </div>
        </button>
      </div>

      {/* Safety vs Fuel Weight Slider */}
      <div className="pt-2 border-t border-hairline">
        <div className="flex items-center justify-between text-[11px] font-mono mb-1 text-ink-muted">
          <span className="flex items-center gap-1 text-[10px] text-ink-muted font-sans">
            <SlidersHorizontal className="w-3 h-3 text-brass" />
            OPTIMIZATION BIAS
          </span>
          <span className="text-ink font-bold">
            {riskWeight > 0.65 ? "MAX SAFETY" : riskWeight < 0.35 ? "MIN FUEL" : "BALANCED"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-[9px] font-mono text-brass font-bold">FUEL</span>
          <input
            id="slider-risk-weight"
            type="range"
            min={0.1}
            max={0.9}
            step={0.05}
            value={riskWeight}
            onChange={(e) => handleWeightChange(parseFloat(e.target.value))}
            className="w-full h-1 bg-panel-low border border-hairline appearance-none cursor-pointer accent-brass"
          />
          <span className="text-[9px] font-mono text-caution font-bold">SAFETY</span>
        </div>
      </div>
    </div>
  );
};

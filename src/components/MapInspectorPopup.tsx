import React from "react";
import { X, Crosshair, Wind, Waves, Disc, AlertTriangle, ShieldCheck, MapPin } from "lucide-react";
import { MapInspectionData } from "../types";

interface MapInspectorPopupProps {
  data: MapInspectionData | null;
  onClose: () => void;
  uiMode?: "naval" | "civilian";
  docked?: boolean;
}

export const MapInspectorPopup: React.FC<MapInspectorPopupProps> = ({
  data,
  onClose,
  uiMode = "naval",
  docked = false
}) => {
  if (!data) return null;

  const isHighRisk = data.computed_risk >= 0.65;
  const isCaution = data.computed_risk >= 0.3 && data.computed_risk < 0.65;
  const riskColor = isHighRisk ? "#B23A2F" : isCaution ? "#A9700F" : "#0E7C93";
  const riskBadge = isHighRisk ? "SEVERE HAZARD" : isCaution ? "CAUTIONARY" : "NOMINAL / SAFE";

  const latFormatted = `${Math.abs(data.lat).toFixed(2)}°${data.lat < 0 ? "S" : "N"}`;
  const lonFormatted = `${Math.abs(data.lon).toFixed(2)}°${data.lon < 0 ? "W" : "E"}`;

  if (uiMode === "civilian") {
    const iceCoverPercent = Math.round(data.sic * 100);
    const icebergDistanceKm = Math.round(data.iceberg_proximity_nm * 1.852);
    const windSpeedKmh = Math.round(data.wind_speed_knots * 1.852);

    return (
      <div
        id="map-point-inspector-popup"
        className={`${
          docked
            ? "relative w-full"
            : "absolute z-[1000] top-4 right-4 md:right-84 w-80"
        } bg-white/95 backdrop-blur-md border border-[#D7E1E8] rounded-2xl shadow-2xl p-4 text-xs select-none`}
      >
        {/* Friendly Header */}
        <div className="flex items-center justify-between pb-2.5 border-b border-[#E2E8F0]">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-full bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center">
              <MapPin className="w-3.5 h-3.5" />
            </div>
            <span className="font-bold text-xs text-[#0F172A]">Location Inspector</span>
          </div>
          <button
            id="btn-close-inspector"
            onClick={onClose}
            className="p-1 text-[#94A3B8] hover:text-[#0F172A] rounded-lg hover:bg-[#F1F5F9] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Friendly Coordinates & Depth */}
        <div className="my-2.5 p-2.5 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] flex items-center justify-between">
          <div>
            <div className="text-[10px] text-[#64748B] font-medium">Position</div>
            <div className="text-xs font-bold text-[#0F172A]">
              {latFormatted}, {lonFormatted}
            </div>
          </div>
          <div className="text-right">
            <div className="text-[10px] text-[#64748B] font-medium">Ocean Depth</div>
            <div className="text-xs font-bold text-[#0F172A]">
              ~{Math.round(data.bathymetry_depth_m)} m deep
            </div>
          </div>
        </div>

        {/* Safety Badge */}
        <div
          className={`p-2.5 rounded-xl mb-2.5 border flex items-center gap-2 ${
            isHighRisk
              ? "bg-[#FEF2F2] border-[#FECACA] text-[#991B1B]"
              : isCaution
              ? "bg-[#FFFBEB] border-[#FDE68A] text-[#92400E]"
              : "bg-[#F0FDF4] border-[#BBF7D0] text-[#166534]"
          }`}
        >
          {isHighRisk ? (
            <AlertTriangle className="w-4 h-4 text-[#DC2626] shrink-0" />
          ) : (
            <ShieldCheck className="w-4 h-4 text-[#16A34A] shrink-0" />
          )}
          <div>
            <div className="font-bold text-xs">
              {isHighRisk
                ? "Heavy Ice Area (Avoided by Route)"
                : isCaution
                ? "Moderate Ice Floes (Safe at Normal Speed)"
                : "Clear Open Sea (Smooth Sailing)"}
            </div>
            <div className="text-[10px] opacity-80 mt-0.5">
              {isHighRisk
                ? "Thick ice shelves detected here."
                : isCaution
                ? "Scattered pack ice."
                : "Safe open waters for navigation."}
            </div>
          </div>
        </div>

        {/* Plain Language Environmental Factors */}
        <div className="space-y-1.5 text-[11px]">
          <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B]">Sea Ice Cover:</span>
            <span className="font-bold text-[#0F172A]">
              {iceCoverPercent}% ({iceCoverPercent < 15 ? "Open water" : iceCoverPercent < 50 ? "Light drift" : "Dense pack"})
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B]">Nearest Iceberg:</span>
            <span className="font-bold text-[#0F172A]">
              {data.nearest_iceberg_name} ({icebergDistanceKm} km away)
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] flex items-center gap-1">
              <Wind className="w-3 h-3 text-[#0E7C93]" />
              Wind Speed:
            </span>
            <span className="font-bold text-[#0F172A]">
              {windSpeedKmh} km/h
            </span>
          </div>

          <div className="flex items-center justify-between p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="text-[#64748B] flex items-center gap-1">
              <Waves className="w-3 h-3 text-[#0E7C93]" />
              Ocean Waves:
            </span>
            <span className="font-bold text-[#0F172A]">
              {data.wave_height_m.toFixed(1)} meters
            </span>
          </div>
        </div>
      </div>
    );
  }

  // Naval ECDIS Bridge Mode Inspector (High-Density)
  return (
    <div
      id="map-point-inspector-popup"
      className={`${
        docked
          ? "relative w-full"
          : "absolute z-[1000] top-3 right-4 md:right-84 w-80"
      } bg-panel/95 backdrop-blur-md border border-hairline rounded-none shadow-2xl p-3 text-xs select-none`}
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2.5 border-b border-hairline">
        <div className="flex items-center gap-1.5">
          <Crosshair className="w-4 h-4 text-brass" />
          <span className="font-semibold text-ink uppercase tracking-wider">COORDINATE INSPECTOR</span>
        </div>
        <button
          id="btn-close-inspector"
          onClick={onClose}
          className="p-1 text-ink-muted hover:text-ink rounded-none hover:bg-panel-low transition-colors"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Coordinate & Depth Readout */}
      <div className="my-3 p-2 rounded-none bg-panel-low border border-hairline flex items-center justify-between font-mono">
        <div>
          <div className="text-[10px] text-ink-muted">POLAR POSITION</div>
          <div className="text-sm font-bold text-ink tracking-tight">
            {latFormatted}, {lonFormatted}
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-ink-muted">BATHYMETRY</div>
          <div className="text-xs font-semibold text-ink-muted">
            -{Math.round(data.bathymetry_depth_m)} m
          </div>
        </div>
      </div>

      {/* Risk Assessment Score Banner */}
      <div
        className="p-2.5 rounded-none mb-3 border flex items-center justify-between font-mono"
        style={{
          backgroundColor: `${riskColor}15`,
          borderColor: `${riskColor}50`
        }}
      >
        <div>
          <div className="text-[10px] flex items-center gap-1" style={{ color: riskColor }}>
            {isHighRisk ? <AlertTriangle className="w-3 h-3" /> : <ShieldCheck className="w-3 h-3" />}
            <span className="font-bold">{riskBadge}</span>
          </div>
          <div className="text-[10px] text-ink-muted mt-0.5">Learned Edge Scorer</div>
        </div>
        <div className="text-right">
          <div className="text-lg font-bold" style={{ color: riskColor }}>
            {data.computed_risk.toFixed(3)}
          </div>
          <div className="text-[9px] text-ink-muted">0.00 (Min) – 1.00 (Max)</div>
        </div>
      </div>

      {/* Raw Contributing Physics Factors */}
      <div className="space-y-2">
        <div className="text-[10px] font-semibold text-ink-muted tracking-wider uppercase font-sans">
          Physical Contributing Factors
        </div>

        {/* Sea Ice Concentration */}
        <div className="flex items-center justify-between p-1.5 rounded-none bg-panel-low/60 border border-hairline/50">
          <span className="text-ink-muted">Sea Ice Concentration (SIC):</span>
          <span className="font-mono font-bold text-ink">
            {(data.sic * 100).toFixed(1)}%
          </span>
        </div>

        {/* Iceberg Proximity */}
        <div className="flex items-center justify-between p-1.5 rounded-none bg-panel-low/60 border border-hairline/50">
          <span className="text-ink-muted flex items-center gap-1">
            <Disc className="w-3 h-3 text-caution" />
            Nearest Iceberg:
          </span>
          <span className="font-mono text-ink text-right">
            <strong>{data.nearest_iceberg_name}</strong> ({data.iceberg_proximity_nm.toFixed(1)} NM)
          </span>
        </div>

        {/* Iceberg Uncertainty Radius */}
        <div className="flex items-center justify-between p-1.5 rounded-none bg-panel-low/60 border border-hairline/50">
          <span className="text-ink-muted">Cone Uncertainty (σ):</span>
          <span className="font-mono text-caution">
            ±{data.nearest_iceberg_uncertainty_km.toFixed(1)} km
          </span>
        </div>

        {/* Wind Conditions */}
        <div className="flex items-center justify-between p-1.5 rounded-none bg-panel-low/60 border border-hairline/50">
          <span className="text-ink-muted flex items-center gap-1">
            <Wind className="w-3 h-3 text-brass" />
            Surface Wind Field:
          </span>
          <span className="font-mono text-ink">
            {data.wind_speed_knots.toFixed(1)} kts (Katabatic)
          </span>
        </div>

        {/* Wave Height */}
        <div className="flex items-center justify-between p-1.5 rounded-none bg-panel-low/60 border border-hairline/50">
          <span className="text-ink-muted flex items-center gap-1">
            <Waves className="w-3 h-3 text-brass" />
            Significant Wave Height:
          </span>
          <span className="font-mono text-ink">
            {data.wave_height_m.toFixed(1)} m
          </span>
        </div>
      </div>
    </div>
  );
};

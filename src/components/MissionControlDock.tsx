import React from "react";
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Compass,
  Fuel,
  Clock,
  Ship,
  ShieldCheck
} from "lucide-react";
import { RouteResponse } from "../types";

export interface MissionControlDockProps {
  // Route Data & Telemetry
  routeData: RouteResponse | null;
  selectedLeadDay: number;
  onSelectLeadDay: (day: number) => void;
  // Scrubber / Simulation Controls
  isPlaying: boolean;
  onTogglePlay: () => void;
  playbackSpeed: number;
  onSpeedChange: (speed: number) => void;
  onStepBackward: () => void;
  onStepForward: () => void;
  modelConfidence?: number;
  // Layer Toggles
  showSIC: boolean;
  onToggleSIC: () => void;
  showIcebergs: boolean;
  onToggleIcebergs: () => void;
  showVessels: boolean;
  onToggleVessels: () => void;
  showRecommendedRoute: boolean;
  onToggleRecommendedRoute: () => void;
}

export const MissionControlDock: React.FC<MissionControlDockProps> = ({
  routeData,
  selectedLeadDay,
  onSelectLeadDay,
  isPlaying,
  onTogglePlay,
  playbackSpeed,
  onSpeedChange,
  onStepBackward,
  onStepForward,
  modelConfidence = 86,
  showSIC,
  onToggleSIC,
  showIcebergs,
  onToggleIcebergs,
  showVessels,
  onToggleVessels,
  showRecommendedRoute,
  onToggleRecommendedRoute
}) => {
  const comp = routeData?.comparison_vs_greatcircle;
  const distanceNm = routeData?.total_distance_nm ?? 2239.3;
  const fuelSavedKg = comp?.fuel_saved_kg ?? 4128.2;
  const durationHrs = routeData?.est_duration_hrs ?? 167.2;

  // Day step labels
  const leadDays = [0, 1, 2, 3, 4, 5, 6, 7];

  return (
    <div
      id="mission-control-dock"
      className="glass-dock rounded-xl p-2 md:p-2.5 shadow-2xl flex flex-col lg:flex-row items-center justify-between gap-3 text-xs select-none pointer-events-auto border border-[#D7E1E8]/80 transition-all duration-300"
    >
      {/* 1. LEFT WING: Compact Voyage Telemetry KPIs */}
      <div className="flex items-center gap-2.5 md:gap-4 shrink-0 px-2 border-b lg:border-b-0 lg:border-r border-[#D7E1E8]/70 pb-2 lg:pb-0 w-full lg:w-auto justify-around lg:justify-start">
        {/* Distance KPI */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#0E7C93]/10 flex items-center justify-center text-[#0E7C93] shrink-0">
            <Compass className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-sans font-semibold text-[#57707E] uppercase tracking-wider">
              Distance
            </div>
            <div className="text-[13px] font-mono font-bold text-[#12202B] leading-tight">
              {distanceNm.toFixed(0)} <span className="text-[10px] text-[#57707E] font-normal">NM</span>
            </div>
          </div>
        </div>

        {/* Fuel Saved KPI */}
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#059669]/10 flex items-center justify-center text-[#059669] shrink-0">
            <Fuel className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-sans font-semibold text-[#57707E] uppercase tracking-wider">
              Fuel Saved
            </div>
            <div className="text-[13px] font-mono font-bold text-[#059669] leading-tight">
              +{fuelSavedKg.toLocaleString("en-US", { maximumFractionDigits: 0 })}{" "}
              <span className="text-[10px] text-[#059669]/80 font-normal">kg</span>
            </div>
          </div>
        </div>

        {/* Transit Time KPI */}
        <div className="hidden sm:flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-[#A9700F]/10 flex items-center justify-center text-[#A9700F] shrink-0">
            <Clock className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[9px] font-sans font-semibold text-[#57707E] uppercase tracking-wider">
              ETA Transit
            </div>
            <div className="text-[13px] font-mono font-bold text-[#12202B] leading-tight">
              {durationHrs.toFixed(0)} <span className="text-[10px] text-[#57707E] font-normal">hr</span>
            </div>
          </div>
        </div>
      </div>

      {/* 2. CENTER STAGE: 7-Day Lead Time Timeline Scrubber */}
      <div className="flex-1 flex flex-col md:flex-row items-center gap-2 md:gap-3 w-full justify-center px-1">
        {/* Play / Step Buttons Cluster */}
        <div className="flex items-center gap-1 shrink-0">
          <button
            type="button"
            onClick={onStepBackward}
            disabled={selectedLeadDay <= 0}
            className="w-7 h-7 rounded-md bg-[#EFF4F7] hover:bg-[#D7E1E8] text-[#12202B] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Step Back 24h"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          <button
            type="button"
            onClick={onTogglePlay}
            className={`px-3 py-1.5 rounded-md flex items-center gap-1.5 font-sans font-bold text-xs shadow-sm transition-all cursor-pointer ${
              isPlaying
                ? "bg-[#A9700F] text-white hover:bg-[#8E5E0B]"
                : "bg-[#0E7C93] text-white hover:bg-[#0A5C6D]"
            }`}
            title={isPlaying ? "Pause 7-day simulation" : "Play continuous kinematic drift simulation"}
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>PAUSE</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>PLAY</span>
              </>
            )}
          </button>

          <button
            type="button"
            onClick={onStepForward}
            disabled={selectedLeadDay >= 7}
            className="w-7 h-7 rounded-md bg-[#EFF4F7] hover:bg-[#D7E1E8] text-[#12202B] flex items-center justify-center disabled:opacity-30 disabled:cursor-not-allowed cursor-pointer transition-colors"
            title="Step Forward 24h"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>
        </div>

        {/* 7-Day Pill Step Bar */}
        <div className="flex items-center gap-1 bg-[#EFF4F7] p-1 rounded-lg border border-[#D7E1E8]/70 overflow-x-auto max-w-full">
          {leadDays.map((day) => {
            const isActive = selectedLeadDay === day;
            return (
              <button
                key={day}
                type="button"
                onClick={() => onSelectLeadDay(day)}
                className={`px-2.5 py-1 rounded-md text-[11px] font-mono font-semibold transition-all cursor-pointer shrink-0 ${
                  isActive
                    ? "bg-[#0E7C93] text-white shadow-sm font-bold scale-[1.04]"
                    : "text-[#57707E] hover:text-[#12202B] hover:bg-white/60"
                }`}
              >
                {day === 0 ? "TODAY" : `D+${day}`}
              </button>
            );
          })}
        </div>

        {/* Confidence & Speed */}
        <div className="hidden xl:flex items-center gap-2 text-[10.5px] font-mono text-[#57707E] shrink-0">
          <div className="flex items-center gap-1 bg-white/70 px-2 py-0.5 rounded border border-[#D7E1E8]">
            <ShieldCheck className="w-3 h-3 text-[#0E7C93]" />
            <span>CONF:</span>
            <strong className="text-[#0E7C93]">{Math.max(68, 96 - selectedLeadDay * 4)}%</strong>
          </div>

          <button
            type="button"
            onClick={() => onSpeedChange(playbackSpeed >= 2 ? 0.5 : playbackSpeed === 0.5 ? 1 : 2)}
            className="px-1.5 py-0.5 rounded bg-white/70 hover:bg-white border border-[#D7E1E8] font-bold text-[#12202B] cursor-pointer"
            title="Playback Speed"
          >
            {playbackSpeed}x
          </button>
        </div>
      </div>

      {/* 3. RIGHT WING: Quick Layer Toggles */}
      <div className="flex items-center gap-1 shrink-0 px-2 border-t lg:border-t-0 lg:border-l border-[#D7E1E8]/70 pt-2 lg:pt-0 w-full lg:w-auto justify-around lg:justify-end">
        {/* Iceberg Layer Toggle */}
        <button
          type="button"
          onClick={onToggleIcebergs}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer border ${
            showIcebergs
              ? "bg-[#A9700F]/10 border-[#A9700F] text-[#A9700F] font-bold"
              : "bg-white/60 border-[#D7E1E8] text-[#57707E] hover:text-[#12202B]"
          }`}
          title="Toggle Iceberg Markers & Drift Cones"
        >
          <span>🧊</span>
          <span>BERGS</span>
        </button>

        {/* Sea Ice Concentration Toggle */}
        <button
          type="button"
          onClick={onToggleSIC}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer border ${
            showSIC
              ? "bg-[#0E7C93]/10 border-[#0E7C93] text-[#0E7C93] font-bold"
              : "bg-white/60 border-[#D7E1E8] text-[#57707E] hover:text-[#12202B]"
          }`}
          title="Toggle Sea-Ice Concentration Satellite Heatmap"
        >
          <span>🌊</span>
          <span>ICE</span>
        </button>

        {/* Live Vessels Toggle */}
        <button
          type="button"
          onClick={onToggleVessels}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer border ${
            showVessels
              ? "bg-[#059669]/10 border-[#059669] text-[#059669] font-bold"
              : "bg-white/60 border-[#D7E1E8] text-[#57707E] hover:text-[#12202B]"
          }`}
          title="Toggle Live AIS Telemetry Vessels"
        >
          <Ship className="w-3 h-3" />
          <span>FLEET</span>
        </button>

        {/* Route Toggle */}
        <button
          type="button"
          onClick={onToggleRecommendedRoute}
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-md text-[11px] font-mono transition-all cursor-pointer border ${
            showRecommendedRoute
              ? "bg-[#059669]/10 border-[#059669] text-[#059669] font-bold"
              : "bg-white/60 border-[#D7E1E8] text-[#57707E] hover:text-[#12202B]"
          }`}
          title="Toggle Recommended A* Optimal Route"
        >
          <Compass className="w-3 h-3 text-[#059669]" />
          <span>ROUTE</span>
        </button>
      </div>
    </div>
  );
};

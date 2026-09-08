import React, { useEffect } from "react";
import { Play, Pause, RotateCcw, Calendar, ShieldCheck, SkipBack, SkipForward, FastForward, Activity } from "lucide-react";

export interface ForecastScrubberProps {
  currentLeadDay?: number;
  selectedLeadDay?: number;
  maxLeadDays?: number;
  forecasts?: any[];
  onLeadDayChange?: (day: number) => void;
  onSelectLeadDay?: (day: number) => void;
  isPlaying: boolean;
  onTogglePlay: () => void;
  modelConfidence?: number;
  playbackSpeed?: number;
  onSpeedChange?: (speed: number) => void;
  onStepForward?: () => void;
  onStepBackward?: () => void;
}

export const ForecastScrubber: React.FC<ForecastScrubberProps> = ({
  currentLeadDay,
  selectedLeadDay,
  maxLeadDays: propMaxLeadDays,
  forecasts = [],
  onLeadDayChange,
  onSelectLeadDay,
  isPlaying,
  onTogglePlay,
  modelConfidence,
  playbackSpeed = 1.0,
  onSpeedChange,
  onStepForward,
  onStepBackward
}) => {
  const activeLeadDay = selectedLeadDay !== undefined ? selectedLeadDay : (currentLeadDay !== undefined ? currentLeadDay : 0);
  const maxLeadDays = propMaxLeadDays ?? (forecasts && forecasts.length > 0 ? forecasts.length : 7);

  const handleLeadChange = (day: number) => {
    const clamped = Math.max(0, Math.min(maxLeadDays, day));
    if (onSelectLeadDay) onSelectLeadDay(clamped);
    if (onLeadDayChange) onLeadDayChange(clamped);
  };

  const handleStepPrev = () => {
    if (onStepBackward) {
      onStepBackward();
    } else {
      handleLeadChange(activeLeadDay - 1);
    }
  };

  const handleStepNext = () => {
    if (onStepForward) {
      onStepForward();
    } else {
      handleLeadChange(activeLeadDay + 1);
    }
  };

  // Keyboard navigation shortcuts: Space to toggle play, Arrow Left/Right to step
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input or textarea
      if (["INPUT", "TEXTAREA", "SELECT"].includes((e.target as HTMLElement)?.tagName)) return;

      if (e.code === "Space") {
        e.preventDefault();
        onTogglePlay();
      } else if (e.code === "ArrowRight") {
        e.preventDefault();
        handleStepNext();
      } else if (e.code === "ArrowLeft") {
        e.preventDefault();
        handleStepPrev();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [onTogglePlay, activeLeadDay, maxLeadDays]);

  // Model confidence calculation
  const activeForecast = Array.isArray(forecasts) ? forecasts.find((f) => f?.lead_day === activeLeadDay) : null;
  const computedConfidence = activeForecast?.confidence
    ? Math.round(activeForecast.confidence * 100)
    : Math.max(68, Math.round(96 - activeLeadDay * 3.2));
  const confidence = modelConfidence ?? computedConfidence;

  // Operational validity date
  const baseDate = new Date("2026-09-06T00:00:00Z");
  const validDate = new Date(baseDate.getTime() + activeLeadDay * 24 * 60 * 60 * 1000);
  const dateStr = validDate.toLocaleDateString("en-GB", {
    weekday: "short",
    day: "2-digit",
    month: "short",
    year: "numeric"
  }).toUpperCase();

  // Day step condition labels
  const dayConditions = [
    "BASE ANALYSIS (0h)",
    "PACK CONVERGENCE (+24h)",
    "KATABATIC GALE (+48h)",
    "COMPACTION SURGE (+72h)",
    "SHEAR ZONE (+96h)",
    "POLAR LOW PASS (+120h)",
    "OPEN WATER SWELL (+144h)",
    "ENSEMBLE LIMIT (+168h)"
  ];

  // Percentage progress along scrubber track
  const progressPct = (activeLeadDay / maxLeadDays) * 100;
  const fleetDriftNm = (activeLeadDay * 14.2).toFixed(1);

  return (
    <div
      id="forecast-scrubber-instrument"
      className="bg-panel border border-hairline px-3.5 py-1.5 shadow-md flex flex-col gap-1.5 text-xs select-none relative overflow-hidden"
    >
      {/* Top Telemetry & Status Readout Bar */}
      <div className="flex flex-wrap items-center justify-between gap-2 text-[10.5px] font-mono border-b border-hairline pb-1">
        {/* Left: Simulation State Badge & Date */}
        <div className="flex items-center gap-2.5">
          <div
            className={`px-2 py-0.5 border text-[10px] font-bold flex items-center gap-1.5 transition-all ${
              isPlaying
                ? "bg-brass text-white border-brass shadow-sm"
                : "bg-panel-low text-ink-muted border-hairline"
            }`}
          >
            <span
              className={`w-2 h-2 rounded-full ${
                isPlaying ? "bg-white animate-ping" : "bg-ink-muted"
              }`}
            />
            <span>{isPlaying ? "SIMULATION ACTIVE" : "CHRONOMETER PAUSED"}</span>
          </div>

          <div className="flex items-center gap-1.5 text-ink">
            <Calendar className="w-3.5 h-3.5 text-brass" />
            <strong className="font-bold">{dateStr}</strong>
            <span className="text-ink-muted">12:00Z</span>
          </div>
        </div>

        {/* Center: Kinematic Step Subtitle */}
        <div className="hidden md:flex items-center gap-2">
          <span className="text-ink-muted">STEP:</span>
          <span className="font-bold text-brass">
            {dayConditions[activeLeadDay] || `+${activeLeadDay * 24}h`}
          </span>
          <span className="text-hairline">|</span>
          <span className="text-ink-muted flex items-center gap-1">
            <Activity className="w-3 h-3 text-caution" />
            EST. FLEET DRIFT: <strong className="text-ink">+{fleetDriftNm} NM</strong>
          </span>
        </div>

        {/* Right: Confidence & Uncertainty */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1">
            <ShieldCheck className="w-3.5 h-3.5 text-brass" />
            <span className="text-ink-muted">CONF:</span>
            <strong className={confidence > 80 ? "text-brass" : "text-caution"}>
              {confidence}%
            </strong>
          </div>
          <div className="text-ink-muted hidden sm:inline">
            σ: <span className="text-caution font-bold">±{(1.5 + activeLeadDay * 6.8).toFixed(1)} km</span>
          </div>
        </div>
      </div>

      {/* Scrubber Controls, Progress Track & Step Indicators */}
      <div className="flex flex-col md:flex-row items-center gap-3 md:gap-4">
        {/* Playback Buttons Strip */}
        <div className="flex items-center gap-1.5 shrink-0 self-start md:self-center">
          {/* Step Backward 24h */}
          <button
            id="btn-scrubber-step-prev"
            onClick={handleStepPrev}
            disabled={activeLeadDay <= 0}
            className="p-1.5 bg-panel-low hover:bg-hairline text-ink border border-hairline disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Step backward 24 hours (Left Arrow)"
          >
            <SkipBack className="w-3.5 h-3.5" />
          </button>

          {/* Play / Pause Toggle */}
          <button
            id="btn-scrubber-play-pause"
            onClick={onTogglePlay}
            className={`px-3 py-1.5 flex items-center gap-1.5 font-bold transition-all border cursor-pointer ${
              isPlaying
                ? "bg-caution text-white border-caution shadow-sm"
                : "bg-brass hover:bg-brass-hover text-white border-brass shadow-sm"
            }`}
            title={isPlaying ? "Pause automated simulation (Space)" : "Run 7-day ConvLSTM kinematic timeline (Space)"}
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

          {/* Step Forward 24h */}
          <button
            id="btn-scrubber-step-next"
            onClick={handleStepNext}
            disabled={activeLeadDay >= maxLeadDays}
            className="p-1.5 bg-panel-low hover:bg-hairline text-ink border border-hairline disabled:opacity-30 disabled:cursor-not-allowed transition-colors cursor-pointer"
            title="Step forward 24 hours (Right Arrow)"
          >
            <SkipForward className="w-3.5 h-3.5" />
          </button>

          {/* Reset to T=0 */}
          <button
            id="btn-scrubber-reset"
            onClick={() => handleLeadChange(0)}
            className="p-1.5 bg-panel-low text-ink-muted hover:text-ink border border-hairline hover:border-ink-muted cursor-pointer transition-colors"
            title="Reset to Day 0 (Current Analysis State)"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>

          {/* Playback Speed Switcher */}
          {onSpeedChange && (
            <div className="flex items-center ml-1 border border-hairline overflow-hidden font-mono text-[10px]">
              {[0.5, 1.0, 2.0].map((spd) => (
                <button
                  key={spd}
                  onClick={() => onSpeedChange(spd)}
                  className={`px-1.5 py-1 transition-colors cursor-pointer ${
                    playbackSpeed === spd
                      ? "bg-brass text-white font-bold"
                      : "bg-panel-low text-ink-muted hover:text-ink"
                  }`}
                  title={`Set playback speed to ${spd}x`}
                >
                  {spd}x
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Dynamic Scrub Rail & Step Markers */}
        <div className="flex-1 w-full flex flex-col justify-center">
          {/* Track Bar with Smooth Animated Fill & Glow */}
          <div className="relative w-full h-3 bg-panel-low border border-hairline flex items-center cursor-pointer group">
            {/* Smooth Fill Track */}
            <div
              className="absolute left-0 top-0 bottom-0 bg-brass transition-all duration-300 ease-out"
              style={{ width: `${progressPct}%` }}
            >
              {/* Animated Shimmer Line when playing */}
              {isPlaying && (
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-sweep-shimmer" />
              )}
            </div>

            {/* Sliding Playhead Diamond Indicator */}
            <div
              className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-4 h-4 bg-white border-2 border-brass rotate-45 shadow-md pointer-events-none transition-all duration-300 ease-out z-20"
              style={{ left: `${progressPct}%` }}
            />

            {/* Range Input Overlay for Dragging */}
            <input
              id="slider-forecast-lead"
              type="range"
              min={0}
              max={maxLeadDays}
              step={1}
              value={activeLeadDay}
              onChange={(e) => handleLeadChange(parseInt(e.target.value, 10))}
              className="absolute inset-0 w-full h-full opacity-0 cursor-pointer z-30"
              aria-label="Forecast Lead Day Scrub Slider"
            />
          </div>

          {/* Interactive Day Step Markers */}
          <div className="grid grid-cols-8 gap-1 text-[10px] font-mono mt-1.5">
            {Array.from({ length: maxLeadDays + 1 }).map((_, idx) => {
              const isSelected = activeLeadDay === idx;
              const isPast = activeLeadDay > idx;
              return (
                <button
                  key={idx}
                  onClick={() => handleLeadChange(idx)}
                  className={`py-1 text-center border transition-all cursor-pointer flex flex-col items-center justify-center leading-none ${
                    isSelected
                      ? "bg-brass text-white font-bold border-brass shadow-sm scale-105 z-10"
                      : isPast
                      ? "bg-panel-low text-ink-muted border-hairline hover:border-brass/60"
                      : "bg-panel text-outline border-hairline hover:border-brass/60 hover:text-ink"
                  }`}
                  title={`Select Day +${idx} (${idx === 0 ? "Initial Analysis" : `+${idx * 24}h Horizon`})`}
                >
                  <span className="text-[10px]">{idx === 0 ? "NOW" : `D+${idx}`}</span>
                  <span className="text-[8px] opacity-75 mt-0.5 font-sans">
                    {idx === 0 ? "0h" : `+${idx * 24}h`}
                  </span>
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};


import React, { useEffect, useState } from "react";
import { Play, Pause, SkipBack, SkipForward, Calendar } from "lucide-react";
import { SICLeadDayForecast } from "../types";

interface Props {
  forecasts: SICLeadDayForecast[];
  selectedLeadDay: number;
  onSelectLeadDay: (day: number) => void;
  sicOpacity: number;
  onChangeOpacity: (val: number) => void;
  showSIC: boolean;
  onToggleSIC: () => void;
  showIcebergs: boolean;
  onToggleIcebergs: () => void;
  showRecommendedRoute: boolean;
  onToggleRecommendedRoute: () => void;
  showGreatCircle: boolean;
  onToggleGreatCircle: () => void;
}

export const ForecastTimeline: React.FC<Props> = ({
  forecasts = [],
  selectedLeadDay,
  onSelectLeadDay,
  sicOpacity,
  onChangeOpacity,
  showSIC,
  onToggleSIC,
  showIcebergs,
  onToggleIcebergs,
  showRecommendedRoute,
  onToggleRecommendedRoute,
  showGreatCircle,
  onToggleGreatCircle
}) => {
  const [isPlaying, setIsPlaying] = useState(false);
  const maxDay = forecasts && forecasts.length > 0 ? forecasts.length : 7;
  const currentForecast = (Array.isArray(forecasts) ? forecasts.find((f) => f?.lead_day === selectedLeadDay) : null) || forecasts?.[0];

  useEffect(() => {
    if (!isPlaying) return;
    const timer = setInterval(() => {
      onSelectLeadDay(selectedLeadDay >= maxDay ? 1 : selectedLeadDay + 1);
    }, 1600);
    return () => clearInterval(timer);
  }, [isPlaying, selectedLeadDay, maxDay, onSelectLeadDay]);

  const formatDate = (isoStr?: string) => {
    if (!isoStr) return `Day +${selectedLeadDay}`;
    try {
      const d = new Date(isoStr);
      return d.toLocaleDateString("en-US", { month: "short", day: "numeric", weekday: "short" }) + " 12:00Z";
    } catch {
      return `Day +${selectedLeadDay}`;
    }
  };

  return (
    <div id="forecast-timeline-panel" className="bg-panel border border-hairline p-3 md:p-4 text-ink shadow-md select-none">
      <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-hairline">
        <div className="flex items-center gap-3">
          <div className="p-2 bg-brass-soft border border-brass text-brass">
            <Calendar className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="text-xs uppercase tracking-wider text-brass font-semibold">Spatiotemporal Forecast Horizon</span>
              <span className="px-1.5 py-0.5 text-[10px] font-mono bg-brass-soft text-brass border border-brass">
                Lead Day +{selectedLeadDay} of {maxDay}
              </span>
            </div>
            <div className="text-sm font-medium text-ink">
              Valid: <span className="text-ink font-semibold">{formatDate(currentForecast?.valid_time)}</span>
              {currentForecast && (
                <span className="ml-3 text-xs text-ink-muted">
                  Mean Basin SIC: <strong className="text-brass font-mono">{(currentForecast.mean_concentration * 100).toFixed(1)}%</strong>
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Playback Controls */}
        <div className="flex items-center gap-2">
          <button
            id="btn-timeline-back"
            onClick={() => onSelectLeadDay(Math.max(1, selectedLeadDay - 1))}
            disabled={selectedLeadDay <= 1}
            className="p-1.5 bg-panel-low hover:bg-chart-bg border border-hairline disabled:opacity-40 transition cursor-pointer text-ink"
            title="Previous Day"
          >
            <SkipBack className="w-4 h-4" />
          </button>
          <button
            id="btn-timeline-play"
            onClick={() => setIsPlaying(!isPlaying)}
            className="flex items-center gap-1.5 px-3 py-1.5 bg-brass hover:bg-brass-hover text-white font-semibold text-xs shadow-sm transition cursor-pointer"
          >
            {isPlaying ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" /> Pause
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" /> Play Loop
              </>
            )}
          </button>
          <button
            id="btn-timeline-forward"
            onClick={() => onSelectLeadDay(Math.min(maxDay, selectedLeadDay + 1))}
            disabled={selectedLeadDay >= maxDay}
            className="p-1.5 bg-panel-low hover:bg-chart-bg border border-hairline disabled:opacity-40 transition cursor-pointer text-ink"
            title="Next Day"
          >
            <SkipForward className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Scrub Slider */}
      <div className="pt-3 pb-2">
        <div className="flex justify-between text-[11px] font-mono text-ink-muted mb-1.5">
          {Array.from({ length: maxDay }, (_, i) => i + 1).map((d) => (
            <button
              key={d}
              onClick={() => onSelectLeadDay(d)}
              className={`px-2 py-0.5 border transition cursor-pointer ${
                d === selectedLeadDay
                  ? "bg-brass text-white font-bold border-brass"
                  : "hover:text-ink hover:bg-panel-low border-hairline bg-panel"
              }`}
            >
              D+{d}
            </button>
          ))}
        </div>
        <input
          id="forecast-scrub-slider"
          type="range"
          min="1"
          max={maxDay}
          step="1"
          value={selectedLeadDay}
          onChange={(e) => onSelectLeadDay(parseInt(e.target.value, 10))}
          className="w-full accent-brass cursor-pointer h-1.5 bg-panel-low border border-hairline appearance-none"
        />
      </div>

      {/* Layer Toggles & Opacity */}
      <div className="pt-3 border-t border-hairline flex flex-wrap items-center justify-between gap-3 text-xs">
        <div className="flex flex-wrap items-center gap-2">
          <button
            id="toggle-sic-layer"
            onClick={onToggleSIC}
            className={`px-2.5 py-1 border font-medium transition cursor-pointer ${
              showSIC
                ? "bg-brass-soft border-brass text-brass shadow-sm"
                : "bg-panel border-hairline text-ink-muted"
            }`}
          >
            SIC Heatmap {showSIC ? "ON" : "OFF"}
          </button>
          <button
            id="toggle-iceberg-layer"
            onClick={onToggleIcebergs}
            className={`px-2.5 py-1 border font-medium transition cursor-pointer ${
              showIcebergs
                ? "bg-caution-light border-caution text-caution shadow-sm"
                : "bg-panel border-hairline text-ink-muted"
            }`}
          >
            Icebergs & Cones {showIcebergs ? "ON" : "OFF"}
          </button>
          <button
            id="toggle-rec-route-layer"
            onClick={onToggleRecommendedRoute}
            className={`px-2.5 py-1 border font-medium transition cursor-pointer ${
              showRecommendedRoute
                ? "bg-safe-light/40 border-safe text-safe shadow-sm"
                : "bg-panel border-hairline text-ink-muted"
            }`}
          >
            AI Optimal Route {showRecommendedRoute ? "ON" : "OFF"}
          </button>
          <button
            id="toggle-gc-route-layer"
            onClick={onToggleGreatCircle}
            className={`px-2.5 py-1 border font-medium transition cursor-pointer ${
              showGreatCircle
                ? "bg-danger-light border-danger text-danger shadow-sm"
                : "bg-panel border-hairline text-ink-muted"
            }`}
          >
            Naive Great-Circle {showGreatCircle ? "ON" : "OFF"}
          </button>
        </div>

        {/* Heatmap Opacity Slider */}
        <div className="flex items-center gap-2">
          <span className="text-ink-muted text-[11px]">SIC Opacity:</span>
          <input
            id="sic-opacity-slider"
            type="range"
            min="0.2"
            max="1.0"
            step="0.05"
            value={sicOpacity}
            onChange={(e) => onChangeOpacity(parseFloat(e.target.value))}
            className="w-20 accent-brass h-1.5 bg-panel-low border border-hairline cursor-pointer"
          />
          <span className="text-brass font-mono text-[11px] w-8">{(sicOpacity * 100).toFixed(0)}%</span>
        </div>
      </div>
    </div>
  );
};

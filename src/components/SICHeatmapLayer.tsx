import React from "react";
import { SICCell } from "../types";

interface Props {
  cells: SICCell[];
  opacity: number;
  showThickness: boolean;
}

export const getSICColor = (sic: number): string => {
  if (sic < 0.15) return "rgba(30, 75, 125, 0.25)";
  if (sic < 0.35) return "rgba(56, 150, 200, 0.55)";
  if (sic < 0.60) return "rgba(75, 205, 230, 0.75)";
  if (sic < 0.80) return "rgba(160, 235, 245, 0.88)";
  return "rgba(240, 250, 255, 0.95)";
};

export const getSICTextColor = (sic: number): string => {
  if (sic < 0.35) return "#0E7C93";
  if (sic < 0.70) return "#0A5767";
  return "#12202B";
};

export const SICHeatmapLegend: React.FC = () => {
  const steps = [
    { label: "Open Water (<15%)", color: "rgba(30, 75, 125, 0.4)" },
    { label: "Open Pack (15-40%)", color: "rgba(56, 150, 200, 0.6)" },
    { label: "Close Pack (40-70%)", color: "rgba(75, 205, 230, 0.8)" },
    { label: "Consolidated (70-85%)", color: "rgba(160, 235, 245, 0.9)" },
    { label: "Fast / Heavy Multi-year (>85%)", color: "rgba(245, 250, 255, 0.98)" },
  ];

  return (
    <div id="sic-legend" className="bg-panel/95 backdrop-blur-md border border-hairline rounded-none p-2.5 text-xs text-ink shadow-xl">
      <div className="font-semibold text-ink mb-1.5 flex items-center justify-between uppercase tracking-wider">
        <span>Sea-Ice Concentration (SIC)</span>
        <span className="text-[10px] text-brass font-mono">AMSR2 / SSMIS</span>
      </div>
      <div className="flex flex-col gap-1">
        {steps.map((s, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <span
              className="w-3.5 h-3.5 rounded-none border border-hairline shadow-sm shrink-0"
              style={{ backgroundColor: s.color }}
            />
            <span className="text-[11px] text-ink-muted">{s.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
};

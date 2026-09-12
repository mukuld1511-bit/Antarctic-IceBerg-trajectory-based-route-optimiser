import React from "react";
import { SICCell } from "../types";

interface Props {
  cells: SICCell[];
  opacity: number;
  showThickness: boolean;
}

export const getSICColor = (sic: number): string => {
  if (sic < 0.15) return "rgba(45, 160, 215, 0.35)";
  if (sic < 0.40) return "rgba(70, 190, 235, 0.60)";
  if (sic < 0.70) return "rgba(135, 228, 253, 0.80)";
  if (sic < 0.88) return "rgba(215, 248, 255, 0.92)";
  return "rgba(255, 255, 255, 0.98)";
};

export const getSICTextColor = (sic: number): string => {
  if (sic < 0.40) return "#0284C7";
  if (sic < 0.75) return "#0369A1";
  return "#0F172A";
};

export const SICHeatmapLegend: React.FC = () => {
  const steps = [
    { label: "Marginal Ice Zone (<15%)", color: "rgba(45, 160, 215, 0.50)" },
    { label: "Open Pack (15-40%)", color: "rgba(70, 190, 235, 0.70)" },
    { label: "Close Pack (40-70%)", color: "rgba(135, 228, 253, 0.85)" },
    { label: "Consolidated Pack (70-88%)", color: "rgba(215, 248, 255, 0.94)" },
    { label: "Fast Ice / Polar Shelf (>88%)", color: "rgba(255, 255, 255, 0.98)" },
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

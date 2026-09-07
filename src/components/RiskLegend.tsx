import React from "react";
import { Info } from "lucide-react";

interface RiskLegendProps {
  compact?: boolean;
}

export const RiskLegend: React.FC<RiskLegendProps> = ({ compact = false }) => {
  return (
    <div
      id="risk-grid-legend-panel"
      className="bg-panel/95 backdrop-blur-md border border-hairline rounded-none p-3 text-xs shadow-xl"
    >
      <div className="flex items-center justify-between pb-2 border-b border-hairline mb-2.5">
        <span className="font-semibold text-ink flex items-center gap-1.5 uppercase tracking-wider">
          <Info className="w-3.5 h-3.5 text-brass" />
          CRYOSPHERIC RISK KEY
        </span>
        <span className="text-[10px] font-mono text-ink-muted">risk_scorer.py</span>
      </div>

      <div className="space-y-2">
        {/* Nominal / Safe */}
        <div className="flex items-start gap-2.5">
          <div className="w-3 h-3 rounded-none bg-brass mt-0.5 shrink-0 shadow-[0_0_6px_rgba(14,124,147,0.3)]" />
          <div className="flex-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-brass font-bold">SAFE (0.00 - 0.29)</span>
              <span className="text-ink-muted">Open / Marginal</span>
            </div>
            {!compact && (
              <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                SIC &lt; 30%, negligible iceberg probability. Standard cruising speeds permitted.
              </p>
            )}
          </div>
        </div>

        {/* Caution */}
        <div className="flex items-start gap-2.5">
          <div className="w-3 h-3 rounded-none bg-caution mt-0.5 shrink-0 shadow-[0_0_6px_rgba(169,112,15,0.3)]" />
          <div className="flex-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-caution font-bold">CAUTION (0.30 - 0.65)</span>
              <span className="text-ink-muted">Pack Ice / Bergy</span>
            </div>
            {!compact && (
              <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                SIC 30–65% or proximity to drifting iceberg cones. Speed restricted to 8–10 kts.
              </p>
            )}
          </div>
        </div>

        {/* High / Extreme Risk */}
        <div className="flex items-start gap-2.5">
          <div className="w-3 h-3 rounded-none bg-danger mt-0.5 shrink-0 shadow-[0_0_6px_rgba(178,58,47,0.3)]" />
          <div className="flex-1">
            <div className="flex items-center justify-between font-mono text-[11px]">
              <span className="text-danger font-bold">HIGH RISK (&gt; 0.65)</span>
              <span className="text-ink-muted">Unnavigable Zone</span>
            </div>
            {!compact && (
              <p className="text-[10px] text-ink-muted leading-tight mt-0.5">
                Dense multi-year ice (&gt;70% SIC) or direct iceberg trajectory intersection. Reroute mandatory.
              </p>
            )}
          </div>
        </div>
      </div>

      {/* Map Feature Glyphs */}
      <div className="mt-3 pt-2.5 border-t border-hairline grid grid-cols-2 gap-2 text-[10px] font-mono text-ink-muted">
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 h-0.5 bg-brass inline-block" />
          <span>Optimal Route</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2.5 border-b border-dashed border-danger inline-block" />
          <span>Great-Circle</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-none border border-caution inline-block" />
          <span>Iceberg Cone (σ)</span>
        </div>
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 bg-safe rounded-none inline-block" />
          <span>Research Stn</span>
        </div>
      </div>
    </div>
  );
};

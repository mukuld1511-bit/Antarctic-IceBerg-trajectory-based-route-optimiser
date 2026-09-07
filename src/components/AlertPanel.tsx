import React from "react";
import { ShieldAlert, AlertTriangle, AlertCircle, Compass, ChevronRight } from "lucide-react";
import { Iceberg } from "../types";

export interface AlertItem {
  id: string;
  severity: "CRITICAL" | "HIGH" | "MODERATE";
  title: string;
  coordinates: string;
  description: string;
  action: string;
  icebergId?: string;
  location_lat?: number;
  location_lon?: number;
}

export interface AlertPanelProps {
  alerts?: AlertItem[];
  icebergs?: Iceberg[];
  onSelectAlert?: (alert: AlertItem) => void;
  onSelectIceberg?: (iceberg: Iceberg) => void;
  selectedIcebergId?: string;
  compact?: boolean;
}

export const AlertPanel: React.FC<AlertPanelProps> = ({
  alerts: propAlerts,
  icebergs = [],
  onSelectAlert,
  onSelectIceberg,
  selectedIcebergId,
  compact = false
}) => {
  const defaultAlerts: AlertItem[] = [
    {
      id: "alert-a23a",
      severity: "CRITICAL",
      title: "MEGABERG A-23a DRIFT CONE",
      coordinates: "-61.20°S, -48.50°W",
      location_lat: -61.2,
      location_lon: -48.5,
      description: "Class D (>1,000 km²) drifting northeast at 1.4 kts. 72h conical uncertainty radius: ±49.4 km.",
      action: "Maintain 15 NM standoff margin outside uncertainty cone.",
      icebergId: "A-23a"
    },
    {
      id: "alert-pack-ice",
      severity: "HIGH",
      title: "WEDDELL SHELF CONVERGENCE",
      coordinates: "-69.50°S, -14.20°W",
      location_lat: -69.5,
      location_lon: -14.2,
      description: "Sea Ice Concentration 78% with heavy compressive ridging across Great-Circle track.",
      action: "Divert transit eastward along open flaw leads (-68.2°S).",
    },
    {
      id: "alert-b15y",
      severity: "HIGH",
      title: "ICEBERG B-15Y SHALLOW WATER HAZARD",
      coordinates: "-63.45°S, -52.10°W",
      location_lat: -63.45,
      location_lon: -52.1,
      description: "Class C tabular iceberg (180m draft) nearing continental shelf break (<500m bathymetry).",
      action: "Monitor for grounding-induced fragmentation & growler fields.",
      icebergId: "B-15Y"
    },
    {
      id: "alert-katabatic",
      severity: "MODERATE",
      title: "COASTAL KATABATIC GALE WARNING",
      coordinates: "-70.20°S, 12.00°E",
      location_lat: -70.2,
      location_lon: 12.0,
      description: "Offshore wind shear 38 kts gusting 48 kts driving accelerated ice pack drift toward Astrid Ridge.",
      action: "Reduce transit speed to 9.5 kts during approach.",
    }
  ];

  const activeAlerts = propAlerts && propAlerts.length > 0 ? propAlerts : defaultAlerts;

  return (
    <div
      id="cryospheric-hazard-alert-panel"
      className="bg-panel border border-hairline p-3 text-xs shadow-md space-y-2.5 select-none"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <div className="flex items-center gap-1.5 font-semibold text-ink">
          <ShieldAlert className="w-3.5 h-3.5 text-danger" />
          ACTIVE CRYOSPHERIC HAZARDS
        </div>
        <span className="text-[10px] font-mono px-1.5 py-0.5 bg-danger-light text-danger border border-danger font-bold">
          {activeAlerts.length} NOTICES
        </span>
      </div>

      {/* Severity-sorted Alert List */}
      <div className="space-y-2 max-h-72 overflow-y-auto pr-1">
        {activeAlerts.map((alt) => {
          const isCritical = alt.severity === "CRITICAL";
          const isHigh = alt.severity === "HIGH";
          const isSelected = alt.icebergId && alt.icebergId === selectedIcebergId;

          const matchedBerg = (alt.icebergId && Array.isArray(icebergs))
            ? icebergs.find((b) => b?.iceberg_id === alt.icebergId)
            : null;

          return (
            <div
              key={alt.id}
              onClick={() => onSelectAlert?.(alt)}
              className={`p-2 border transition-colors cursor-pointer ${
                isSelected
                  ? "bg-brass-soft border-brass"
                  : "bg-panel-low hover:bg-chart-bg border-hairline"
              }`}
            >
              {/* Alert Title & Severity Badge */}
              <div className="flex items-start justify-between gap-1.5 mb-1">
                <div className="flex items-center gap-1.5">
                  {isCritical ? (
                    <AlertTriangle className="w-3.5 h-3.5 text-danger shrink-0" />
                  ) : isHigh ? (
                    <AlertCircle className="w-3.5 h-3.5 text-caution shrink-0" />
                  ) : (
                    <Compass className="w-3.5 h-3.5 text-brass shrink-0" />
                  )}
                  <span className="font-semibold text-ink text-[11px] leading-snug">
                    {alt.title}
                  </span>
                </div>
                <span
                  className={`text-[9px] font-mono font-bold px-1 uppercase shrink-0 border ${
                    isCritical
                      ? "bg-danger-light border-danger text-danger"
                      : isHigh
                      ? "bg-caution-light border-caution text-caution"
                      : "bg-brass-soft border-brass text-brass"
                  }`}
                >
                  {alt.severity}
                </span>
              </div>

              {/* Coordinates */}
              <div className="text-[10px] font-mono text-ink-muted mb-1">
                POS: <span className="text-ink">{alt.coordinates}</span>
              </div>

              {/* Description */}
              <p className="text-[11px] text-ink-muted leading-tight mb-1.5">
                {alt.description}
              </p>

              {/* Action Directive */}
              <div className="text-[10px] font-mono p-1 bg-panel border border-hairline text-ink">
                <span className="text-caution font-bold">DIRECTIVE: </span>
                {alt.action}
              </div>

              {/* Inspect Button if linked to an Iceberg */}
              {matchedBerg && onSelectIceberg && (
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    onSelectIceberg(matchedBerg);
                  }}
                  className="mt-1.5 w-full py-1 px-2 bg-panel hover:bg-panel-low border border-hairline text-brass text-[10px] font-mono flex items-center justify-center gap-1 transition-colors cursor-pointer"
                >
                  <span>INSPECT FORCE-BALANCE ODE & DRIFT</span>
                  <ChevronRight className="w-3 h-3" />
                </button>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

import React from "react";
import { Iceberg, IcebergTrackResponse } from "../types";
import { X, Navigation, Wind, Waves, Compass, Activity, AlertTriangle } from "lucide-react";

interface Props {
  iceberg: Iceberg | null;
  trackData: IcebergTrackResponse | null;
  loading: boolean;
  onClose: () => void;
}

export const IcebergInspectorModal: React.FC<Props> = ({
  iceberg,
  trackData,
  loading,
  onClose
}) => {
  if (!iceberg) return null;

  const forces = trackData?.governing_forces_summary || {
    F_air_N: 485000,
    F_water_N: 1250000,
    F_coriolis_N: 890000,
    F_slope_N: 310000
  };

  const totalForce = forces.F_air_N + forces.F_water_N + forces.F_coriolis_N + forces.F_slope_N;
  const isCritical = iceberg.hazard_level === "CRITICAL";
  const isHigh = iceberg.hazard_level === "HIGH";

  return (
    <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 p-4 select-none">
      <div
        id="iceberg-inspector-modal"
        className="bg-panel border border-hairline w-full max-w-2xl max-h-[90vh] overflow-hidden flex flex-col shadow-md text-ink"
      >
        {/* Modal Header: Technical Target Identification Bar */}
        <div className="p-3 bg-panel-low border-b border-hairline flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-2 border ${isCritical ? "bg-danger-light border-danger text-danger" : isHigh ? "bg-caution-light border-caution text-caution" : "bg-brass-soft border-brass text-brass"}`}>
              <AlertTriangle className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="font-bold text-base text-ink font-mono tracking-tight">TARGET #{iceberg.iceberg_id}</span>
                <span className="px-1.5 py-0.5 text-xs font-mono font-semibold bg-panel border border-hairline text-ink-muted">
                  CLASS {iceberg.size_class}
                </span>
                <span className={`px-1.5 py-0.5 text-[10px] font-mono font-bold border ${isCritical ? "bg-danger-light border-danger text-danger" : isHigh ? "bg-caution-light border-caution text-caution" : "bg-brass-soft border-brass text-brass"}`}>
                  {iceberg.hazard_level} HAZARD
                </span>
              </div>
              <p className="text-[11px] font-mono text-ink-muted mt-0.5">{iceberg.name} // SOURCE: SENTINEL-1A SAR + USNIC</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 bg-panel hover:bg-chart-bg text-ink-muted hover:text-ink border border-hairline transition cursor-pointer"
            title="Close Inspector"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-4 overflow-y-auto space-y-4 text-xs">
          {/* Key Dimensions & Morphometrics */}
          <div className="border border-hairline bg-panel">
            <div className="h-[26px] px-2.5 bg-panel-low border-b border-hairline flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-ink-muted font-semibold">
              <span className="flex items-center gap-1.5">
                <Activity className="w-3.5 h-3.5 text-brass" />
                Physical Dimensions & Hydrostatics
              </span>
              <span>UTC 06:42:00</span>
            </div>
            <div className="p-3 grid grid-cols-2 md:grid-cols-4 gap-2.5 font-mono">
              <div className="bg-panel-low border border-hairline p-2.5">
                <span className="text-ink-muted block text-[10px] uppercase">Length x Width</span>
                <strong className="text-sm text-ink block mt-0.5">
                  {iceberg.length_m >= 1000 ? `${(iceberg.length_m / 1000).toFixed(1)}km` : `${iceberg.length_m}m`} ×{" "}
                  {iceberg.width_m >= 1000 ? `${(iceberg.width_m / 1000).toFixed(1)}km` : `${iceberg.width_m}m`}
                </strong>
              </div>
              <div className="bg-panel-low border border-hairline p-2.5">
                <span className="text-ink-muted block text-[10px] uppercase">Freeboard (Sail)</span>
                <strong className="text-sm text-ink block mt-0.5">{iceberg.sail_height_m} meters</strong>
              </div>
              <div className="bg-panel-low border border-hairline p-2.5">
                <span className="text-ink-muted block text-[10px] uppercase">Submerged Draft</span>
                <strong className={`text-sm block mt-0.5 ${iceberg.draft_m > 200 ? "text-danger" : "text-ink"}`}>{iceberg.draft_m} meters</strong>
              </div>
              <div className="bg-panel-low border border-hairline p-2.5">
                <span className="text-ink-muted block text-[10px] uppercase">Calculated Mass</span>
                <strong className="text-sm text-brass block mt-0.5">
                  {iceberg.mass_kg.toExponential(2)} kg
                </strong>
              </div>
            </div>
          </div>

          {/* Governing Physics: Bigg et al. (1997) Force Balance ODE */}
          <div className="border border-hairline bg-panel">
            <div className="h-[26px] px-2.5 bg-panel-low border-b border-hairline flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-ink-muted font-semibold">
              <span className="flex items-center gap-1.5 text-brass">
                <Compass className="w-3.5 h-3.5" />
                Bigg et al. (1997) Dynamic Force Contribution Matrix
              </span>
              <span className="text-[9px] text-ink-muted">M · (dv/dt) = Σ F_forces</span>
            </div>

            <div className="p-3 space-y-3 font-mono">
              {/* Force 1: Water Drag */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-ink flex items-center gap-1">
                    <Waves className="w-3 h-3 text-brass" /> Water Form Drag (Deep Current 0-200m)
                  </span>
                  <span className="font-bold text-brass">
                    {(forces.F_water_N / 1000).toFixed(1)} kN ({totalForce ? Math.round((forces.F_water_N / totalForce) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-panel-low border border-hairline">
                  <div className="h-full bg-brass" style={{ width: `${totalForce ? (forces.F_water_N / totalForce) * 100 : 54}%` }} />
                </div>
              </div>

              {/* Force 2: Wind Drag */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-ink flex items-center gap-1">
                    <Wind className="w-3 h-3 text-caution" /> Wind Skin & Katabatic Drag
                  </span>
                  <span className="font-bold text-caution">
                    {(forces.F_air_N / 1000).toFixed(1)} kN ({totalForce ? Math.round((forces.F_air_N / totalForce) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-panel-low border border-hairline">
                  <div className="h-full bg-caution" style={{ width: `${totalForce ? (forces.F_air_N / totalForce) * 100 : 32}%` }} />
                </div>
              </div>

              {/* Force 3: Coriolis */}
              <div>
                <div className="flex justify-between text-[11px] mb-1">
                  <span className="text-ink flex items-center gap-1">
                    <Navigation className="w-3 h-3 text-ink-muted" /> Coriolis Deflection (Antarctic Leftward)
                  </span>
                  <span className="font-bold text-ink-muted">
                    {(forces.F_coriolis_N / 1000).toFixed(1)} kN ({totalForce ? Math.round((forces.F_coriolis_N / totalForce) * 100) : 0}%)
                  </span>
                </div>
                <div className="w-full h-2 bg-panel-low border border-hairline">
                  <div className="h-full bg-ink-muted" style={{ width: `${totalForce ? (forces.F_coriolis_N / totalForce) * 100 : 14}%` }} />
                </div>
              </div>

              <div className="text-[10px] text-ink-muted leading-relaxed pt-1 border-t border-hairline border-dotted">
                <strong className="text-ink">ML Residual Correction (LSTM)</strong>: Accounts for unmodeled basal thermal erosion, wave radiation pressure, and bathymetric steering. Conical uncertainty expands from <span className="text-caution font-semibold">1.5 km</span> at T+0h to <span className="text-danger font-semibold">{trackData?.trajectory.slice(-1)[0]?.uncertainty_radius_km ?? 32.5} km</span> at T+72h.
              </div>
            </div>
          </div>

          {/* Trajectory Forecast Steps */}
          <div className="border border-hairline bg-panel">
            <div className="h-[26px] px-2.5 bg-panel-low border-b border-hairline flex items-center justify-between text-[10px] uppercase font-mono tracking-wider text-ink-muted font-semibold">
              <span>Predicted 72-Hour Drift Trajectory [Ensemble-4]</span>
              <span>CPA WINDOW: 18.2 HRS</span>
            </div>
            {loading ? (
              <div className="p-6 text-center text-ink-muted animate-pulse font-mono text-xs">
                Calculating 4th-Order Runge-Kutta numerical integration...
              </div>
            ) : (
              <div className="max-h-48 overflow-y-auto">
                <table className="w-full text-[11px] font-mono border-collapse">
                  <thead className="bg-panel-low text-ink-muted border-b border-hairline sticky top-0 text-[10px] uppercase">
                    <tr>
                      <th className="py-1.5 px-2.5 text-left">Epoch</th>
                      <th className="py-1.5 px-2.5 text-left">Coordinates</th>
                      <th className="py-1.5 px-2.5 text-left">ML Residual</th>
                      <th className="py-1.5 px-2.5 text-left">Uncertainty</th>
                      <th className="py-1.5 px-2.5 text-left">Drift Speed</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-hairline divide-dotted text-ink">
                    {trackData?.trajectory?.map((pt, idx) => (
                      <tr key={idx} className="hover:bg-panel-low transition-colors">
                        <td className="py-1.5 px-2.5 text-brass font-bold">{pt.timestamp}</td>
                        <td className="py-1.5 px-2.5 text-ink">
                          {typeof pt.lat === "number" ? pt.lat.toFixed(2) : "--"}°S,{" "}
                          {typeof pt.lon === "number" ? `${pt.lon.toFixed(2)}°${pt.lon >= 0 ? "E" : "W"}` : "--"}
                        </td>
                        <td className="py-1.5 px-2.5 text-safe">+{pt.ml_residual_correction_km ?? 0} km</td>
                        <td className="py-1.5 px-2.5 text-caution font-semibold">±{pt.uncertainty_radius_km ?? 0} km</td>
                        <td className="py-1.5 px-2.5 text-ink-muted">{pt.drift_speed_knots ?? "--"} kts</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-2.5 bg-panel-low border-t border-hairline flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 bg-panel hover:bg-chart-bg text-ink border border-hairline font-mono font-semibold text-xs transition cursor-pointer"
          >
            DISMISS INSPECTOR
          </button>
        </div>
      </div>
    </div>
  );
};

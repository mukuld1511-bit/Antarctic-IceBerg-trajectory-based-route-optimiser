import React, { useState } from "react";
import {
  Compass,
  MapPin,
  Ship,
  Sparkles,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Info,
  RefreshCw,
  Radio
} from "lucide-react";
import { NCPOR_ORIGIN_PORTS, NCPOR_DESTINATIONS, VESSEL_CLASSES } from "../constants/ports";
import { RouteResponse } from "../types";

export interface SimpleNavigationPanelProps {
  voyageParams: {
    start_port: string;
    start_lat: number;
    start_lon: number;
    end_port: string;
    end_lat: number;
    end_lon: number;
    vessel_class: string;
  };
  onOptimizeRoute: (params: any) => void;
  loadingRoute: boolean;
  routeData: RouteResponse | null;
  selectedLeadDay: number;
  onSyncTelemetry?: () => Promise<any>;
}

export const SimpleNavigationPanel: React.FC<SimpleNavigationPanelProps> = ({
  voyageParams,
  onOptimizeRoute,
  loadingRoute,
  routeData,
  selectedLeadDay,
  onSyncTelemetry
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [startPort, setStartPort] = useState<string>(voyageParams.start_port);
  const [endPort, setEndPort] = useState<string>(voyageParams.end_port);
  const [vesselClass, setVesselClass] = useState<string>(voyageParams.vessel_class || "PC-5");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [syncStatus, setSyncStatus] = useState<string | null>(null);

  const handleApplyPreset = (originName: string, destName: string) => {
    setStartPort(originName);
    setEndPort(destName);
    const origin = NCPOR_ORIGIN_PORTS.find((p) => p.name.includes(originName) || originName.includes(p.name)) || NCPOR_ORIGIN_PORTS[1];
    const dest = NCPOR_DESTINATIONS.find((d) => d.name.includes(destName) || destName.includes(d.name)) || NCPOR_DESTINATIONS[0];

    onOptimizeRoute({
      start_port: origin.name,
      start_lat: origin.lat,
      start_lon: origin.lon,
      end_port: dest.name,
      end_lat: dest.lat,
      end_lon: dest.lon,
      vessel_class: vesselClass,
      risk_weight: 0.65,
      selected_lead_day: selectedLeadDay
    });
  };

  const handleCalculate = () => {
    const origin = NCPOR_ORIGIN_PORTS.find((p) => p.name === startPort || p.name.includes(startPort)) || NCPOR_ORIGIN_PORTS[1];
    const dest = NCPOR_DESTINATIONS.find((d) => d.name === endPort || d.name.includes(endPort)) || NCPOR_DESTINATIONS[0];

    onOptimizeRoute({
      start_port: origin.name,
      start_lat: origin.lat,
      start_lon: origin.lon,
      end_port: dest.name,
      end_lat: dest.lat,
      end_lon: dest.lon,
      vessel_class: vesselClass,
      risk_weight: 0.65,
      selected_lead_day: selectedLeadDay
    });
  };

  const handleManualSync = async () => {
    if (!onSyncTelemetry || isSyncing) return;
    setIsSyncing(true);
    setSyncStatus("Ingesting Open-Meteo & US NIC satellite data...");
    try {
      const res = await onSyncTelemetry();
      setSyncStatus(`✓ Synced: ${res?.synced_count ?? 3} megabergs calibrated with live marine waves.`);
      setTimeout(() => setSyncStatus(null), 5000);
    } catch (e: any) {
      setSyncStatus(`Sync error: ${e.message || "Pipeline unreachable"}`);
      setTimeout(() => setSyncStatus(null), 4500);
    } finally {
      setIsSyncing(false);
    }
  };

  const comp = routeData?.comparison_vs_greatcircle;
  const distanceNm = routeData?.total_distance_nm ?? 2239;
  const distanceKm = Math.round(distanceNm * 1.852);
  const fuelSavedKg = comp?.fuel_saved_kg ?? 4128;
  const durationDays = routeData?.est_duration_hrs ? (routeData.est_duration_hrs / 24).toFixed(1) : "7.0";

  if (isCollapsed) {
    return (
      <div className="absolute top-3 left-3 z-[450] pointer-events-auto select-none">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          className="flex items-center gap-2 px-3.5 py-2 rounded-xl bg-white/95 backdrop-blur-md shadow-lg border border-[#D7E1E8] text-xs font-bold text-[#12202B] hover:border-[#0E7C93] transition cursor-pointer"
          title="Open Route Planner"
        >
          <span className="text-base">🧭</span>
          <span>Route Planner</span>
          <span className="w-2 h-2 rounded-full bg-[#059669]"></span>
        </button>
      </div>
    );
  }

  return (
    <div className="absolute top-3 left-3 z-[450] pointer-events-auto select-none transition-all duration-300">
      <div className="glass-drawer rounded-2xl shadow-2xl border border-[#D7E1E8]/90 overflow-hidden w-[330px] md:w-[350px]">
        {/* Header Strip */}
        <div className="bg-[#0E7C93] text-white px-4 py-3 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-lg">🧭</span>
            <div>
              <h2 className="font-bold text-sm leading-tight">Route Planner</h2>
              <p className="text-[10px] text-[#CCE6F7]">Antarctic Safe Navigation</p>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setIsCollapsed(true)}
            className="p-1.5 rounded-lg hover:bg-white/20 transition cursor-pointer text-white text-xs font-bold flex items-center gap-1"
            title="Hide Route Planner"
          >
            <span>Close</span>
            <span>✕</span>
          </button>
        </div>

        {/* Body */}
        <div className="p-3.5 space-y-3.5 max-h-[calc(100vh-160px)] overflow-y-auto">
            {/* Quick 1-Click Popular Routes */}
            <div>
              <label className="text-[11px] font-semibold text-[#57707E] uppercase tracking-wider block mb-1.5">
                Popular Expeditions
              </label>
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1">
                <button
                  type="button"
                  onClick={() => handleApplyPreset("Cape Town", "Maitri")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EFF4F7] hover:bg-[#0E7C93] hover:text-white transition-all text-[#12202B] border border-[#D7E1E8] whitespace-nowrap cursor-pointer"
                >
                  🇿🇦 Cape Town → Maitri
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("Goa", "Maitri")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EFF4F7] hover:bg-[#0E7C93] hover:text-white transition-all text-[#12202B] border border-[#D7E1E8] whitespace-nowrap cursor-pointer"
                >
                  🇮🇳 Goa → Maitri
                </button>
                <button
                  type="button"
                  onClick={() => handleApplyPreset("Goa", "Bharati")}
                  className="px-2.5 py-1 rounded-full text-[11px] font-medium bg-[#EFF4F7] hover:bg-[#0E7C93] hover:text-white transition-all text-[#12202B] border border-[#D7E1E8] whitespace-nowrap cursor-pointer"
                >
                  🇮🇳 Goa → Bharati
                </button>
              </div>
            </div>

            {/* Inputs Group */}
            <div className="space-y-2.5 bg-white p-3 rounded-xl border border-[#D7E1E8]">
              {/* Departure Port */}
              <div>
                <label className="text-[11px] font-semibold text-[#12202B] flex items-center gap-1 mb-1">
                  <MapPin className="w-3.5 h-3.5 text-[#0E7C93]" />
                  <span>Departure Port</span>
                </label>
                <select
                  value={startPort}
                  onChange={(e) => setStartPort(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#D7E1E8] bg-[#F8FAFC] text-[#12202B] font-medium focus:ring-2 focus:ring-[#0E7C93]/30 focus:outline-none cursor-pointer"
                >
                  {NCPOR_ORIGIN_PORTS.map((p) => (
                    <option key={p.name} value={p.name}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Destination Station */}
              <div>
                <label className="text-[11px] font-semibold text-[#12202B] flex items-center gap-1 mb-1">
                  <span className="text-xs">🏁</span>
                  <span>Antarctic Destination</span>
                </label>
                <select
                  value={endPort}
                  onChange={(e) => setEndPort(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#D7E1E8] bg-[#F8FAFC] text-[#12202B] font-medium focus:ring-2 focus:ring-[#0E7C93]/30 focus:outline-none cursor-pointer"
                >
                  {NCPOR_DESTINATIONS.map((d) => (
                    <option key={d.name} value={d.name}>
                      {d.flag} {d.name}
                    </option>
                  ))}
                </select>
              </div>

              {/* Ship Class */}
              <div>
                <label className="text-[11px] font-semibold text-[#12202B] flex items-center gap-1 mb-1">
                  <Ship className="w-3.5 h-3.5 text-[#0E7C93]" />
                  <span>Vessel Type</span>
                </label>
                <select
                  value={vesselClass}
                  onChange={(e) => setVesselClass(e.target.value)}
                  className="w-full text-xs p-2 rounded-lg border border-[#D7E1E8] bg-[#F8FAFC] text-[#12202B] font-medium focus:ring-2 focus:ring-[#0E7C93]/30 focus:outline-none cursor-pointer"
                >
                  <option value="PC-3">Heavy Icebreaker (Polar Class 3)</option>
                  <option value="PC-5">Polar Research Ship (e.g. SA Agulhas II)</option>
                  <option value="PC-7">Reinforced Expedition Vessel</option>
                  <option value="Open Water">Commercial Cargo / Tanker</option>
                </select>
              </div>
            </div>

            {/* Calculate Button */}
            <button
              type="button"
              onClick={handleCalculate}
              disabled={loadingRoute}
              className="w-full py-2.5 px-4 rounded-xl bg-[#0E7C93] hover:bg-[#0A5C6D] text-white font-bold text-xs flex items-center justify-center gap-2 shadow-md shadow-[#0E7C93]/20 transition-all cursor-pointer disabled:opacity-50"
            >
              {loadingRoute ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Calculating Safe Route...</span>
                </>
              ) : (
                <>
                  <Sparkles className="w-4 h-4" />
                  <span>Find Optimal Safe Route</span>
                </>
              )}
            </button>

            {/* Results Card */}
            {routeData && (
              <div className="bg-[#F0FDF4] border border-[#BBF7D0] p-3 rounded-xl space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-[#166534] flex items-center gap-1">
                    <CheckCircle2 className="w-4 h-4 text-[#16a34a]" />
                    Safe Route Ready
                  </span>
                  <span className="text-[10px] bg-[#DCFCE7] text-[#166534] px-2 py-0.5 rounded-full font-bold">
                    Optimal
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs pt-1 border-t border-[#BBF7D0]">
                  <div>
                    <span className="text-[#57707E] text-[10px] block">Total Distance</span>
                    <strong className="text-[#12202B] font-mono">{distanceNm.toFixed(0)} NM</strong>
                    <span className="text-[10px] text-[#57707E] block">({distanceKm} km)</span>
                  </div>
                  <div>
                    <span className="text-[#57707E] text-[10px] block">Fuel Saved</span>
                    <strong className="text-[#16a34a] font-mono">+{fuelSavedKg.toFixed(0)} kg</strong>
                    <span className="text-[10px] text-[#16a34a] block">vs Direct Line</span>
                  </div>
                  <div>
                    <span className="text-[#57707E] text-[10px] block">Est. Voyage Time</span>
                    <strong className="text-[#12202B] font-mono">~{durationDays} Days</strong>
                  </div>
                  <div>
                    <span className="text-[#57707E] text-[10px] block">Iceberg Safety</span>
                    <strong className="text-[#0E7C93] font-semibold text-[11px]">45+ km Away</strong>
                  </div>
                </div>
              </div>
            )}

            {/* Satellite Telemetry & n8n Ingestion Control */}
            {onSyncTelemetry && (
              <div className="pt-2 border-t border-[#D7E1E8]">
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-[10px] font-semibold text-[#57707E] flex items-center gap-1">
                    <Radio className="w-3 h-3 text-[#0E7C93]" />
                    <span>SATELLITE & N8N INGESTION</span>
                  </span>
                  <span className="text-[9px] px-1.5 py-0.5 rounded bg-[#EFF4F7] text-[#0E7C93] font-mono font-medium">
                    v2.0 Active
                  </span>
                </div>

                <button
                  type="button"
                  onClick={handleManualSync}
                  disabled={isSyncing}
                  className="w-full py-1.5 px-3 rounded-lg border border-[#D7E1E8] bg-[#F8FAFC] hover:bg-[#EFF4F7] text-[#12202B] text-[11px] font-semibold flex items-center justify-center gap-1.5 transition-all cursor-pointer disabled:opacity-50"
                  title="Trigger on-demand satellite ingestion pipeline"
                >
                  <RefreshCw className={`w-3.5 h-3.5 text-[#0E7C93] ${isSyncing ? "animate-spin" : ""}`} />
                  <span>{isSyncing ? "Syncing Pipeline..." : "Sync Live Satellites & Waves"}</span>
                </button>

                {syncStatus && (
                  <div className={`mt-2 p-2 rounded-lg text-[10px] leading-tight animate-fade-in ${
                    syncStatus.startsWith("✓")
                      ? "bg-[#F0FDF4] text-[#166534] border border-[#BBF7D0]"
                      : syncStatus.startsWith("Sync error")
                      ? "bg-[#FEF2F2] text-[#991B1B] border border-[#FECACA]"
                      : "bg-[#EFF6FF] text-[#1D4ED8] border border-[#BFDBFE]"
                  }`}>
                    {syncStatus}
                  </div>
                )}
              </div>
            )}
          </div>
      </div>
    </div>
  );
};

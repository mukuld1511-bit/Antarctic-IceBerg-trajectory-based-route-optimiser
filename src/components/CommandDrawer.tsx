import React, { useState } from "react";
import {
  Ship,
  Radio,
  Anchor,
  ShieldAlert,
  ChevronLeft,
  ChevronRight,
  Search,
  Filter,
  ExternalLink,
  Compass,
  Wind,
  Thermometer,
  Waves,
  Shield,
  Activity,
  Layers,
  MapPin
} from "lucide-react";
import { Iceberg, LiveVessel, RouteResponse } from "../types";
import { VoyageInputPanel } from "./VoyageInputPanel";
import { RouteComparisonToggle } from "./RouteComparisonToggle";
import { AlertPanel } from "./AlertPanel";
import { RiskLegend } from "./RiskLegend";
import { MapInspectorPopup } from "./MapInspectorPopup";

export type CommandDrawerTab = "route" | "icebergs" | "fleet" | "alerts";

export interface CommandDrawerProps {
  isOpen: boolean;
  onToggleOpen: () => void;
  activeTab: CommandDrawerTab;
  onTabChange: (tab: CommandDrawerTab) => void;
  // Voyage
  voyageParams: any;
  onOptimizeRoute: (params: any) => void;
  loadingRoute: boolean;
  showRecommendedRoute: boolean;
  onToggleRecommendedRoute: () => void;
  showGreatCircle: boolean;
  onToggleGreatCircle: () => void;
  riskWeight: number;
  onRiskWeightChange: (weight: number) => void;
  routeData: RouteResponse | null;
  // Icebergs
  icebergs: Iceberg[];
  selectedIceberg: Iceberg | null;
  onSelectIceberg: (berg: Iceberg) => void;
  onOpenIcebergModal: (berg: Iceberg) => void;
  // Fleet & AIS
  liveVessels: LiveVessel[];
  vesselCount: number;
  showVessels: boolean;
  onToggleVessels: () => void;
  // Alerts & Conditions
  alerts?: any[];
  onSelectAlert?: (alert: any) => void;
  environmentalConditions?: any;
  utcTime?: string;
  inspectorData?: any;
  onCloseInspector?: () => void;
}

export const CommandDrawer: React.FC<CommandDrawerProps> = ({
  isOpen,
  onToggleOpen,
  activeTab,
  onTabChange,
  voyageParams,
  onOptimizeRoute,
  loadingRoute,
  showRecommendedRoute,
  onToggleRecommendedRoute,
  showGreatCircle,
  onToggleGreatCircle,
  riskWeight,
  onRiskWeightChange,
  routeData,
  icebergs,
  selectedIceberg,
  onSelectIceberg,
  onOpenIcebergModal,
  liveVessels,
  vesselCount,
  showVessels,
  onToggleVessels,
  alerts = [],
  onSelectAlert,
  environmentalConditions,
  utcTime,
  inspectorData,
  onCloseInspector
}) => {
  // Local search/filter state for icebergs and vessels
  const [icebergFilter, setIcebergFilter] = useState<"ALL" | "MEGABERG" | "CRITICAL">("ALL");
  const [vesselSearch, setVesselSearch] = useState<string>("");

  const filteredIcebergs = icebergs.filter((b) => {
    if (icebergFilter === "MEGABERG") return b.size_class === "D";
    if (icebergFilter === "CRITICAL") return b.hazard_level === "CRITICAL" || b.hazard_level === "HIGH";
    return true;
  });

  const filteredVessels = liveVessels.filter((v) => {
    if (!vesselSearch) return true;
    const q = vesselSearch.toLowerCase();
    return (
      (v.name && v.name.toLowerCase().includes(q)) ||
      (v.mmsi && v.mmsi.toString().includes(q)) ||
      (v.callsign && v.callsign.toLowerCase().includes(q))
    );
  });

  return (
    <div
      id="unified-command-drawer"
      className={`absolute top-3 left-3 z-[450] flex transition-all duration-300 pointer-events-auto select-none ${
        isOpen ? "w-[340px] md:w-[360px]" : "w-11"
      } max-h-[calc(100vh-100px)]`}
    >
      {/* 1. Slim Icon Navigation Strip (Always visible) */}
      <div className="w-11 glass-drawer rounded-l-xl flex flex-col items-center py-2.5 gap-2 border-r border-[#D7E1E8]/70 shrink-0 z-10">
        {/* Toggle Collapse Button */}
        <button
          type="button"
          onClick={onToggleOpen}
          className="w-8 h-8 rounded-lg bg-[#0E7C93]/10 hover:bg-[#0E7C93]/20 text-[#0E7C93] flex items-center justify-center transition-colors cursor-pointer"
          title={isOpen ? "Collapse Sidebar" : "Expand Command Center"}
        >
          {isOpen ? <ChevronLeft className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
        </button>

        <div className="w-6 h-px bg-[#D7E1E8]/70 my-0.5" />

        {/* Tab 1: Voyage */}
        <button
          type="button"
          onClick={() => {
            onTabChange("route");
            if (!isOpen) onToggleOpen();
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer ${
            activeTab === "route" && isOpen
              ? "bg-[#0E7C93] text-white shadow-sm"
              : "text-[#57707E] hover:text-[#12202B] hover:bg-[#EFF4F7]"
          }`}
          title="Voyage Route Planner"
        >
          <Ship className="w-4 h-4" />
        </button>

        {/* Tab 2: Icebergs */}
        <button
          type="button"
          onClick={() => {
            onTabChange("icebergs");
            if (!isOpen) onToggleOpen();
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === "icebergs" && isOpen
              ? "bg-[#A9700F] text-white shadow-sm"
              : "text-[#57707E] hover:text-[#12202B] hover:bg-[#EFF4F7]"
          }`}
          title="Tracked Icebergs & Drift Cones"
        >
          <Radio className="w-4 h-4" />
          <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#B23A2F]" />
        </button>

        {/* Tab 3: Fleet AIS */}
        <button
          type="button"
          onClick={() => {
            onTabChange("fleet");
            if (!isOpen) onToggleOpen();
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === "fleet" && isOpen
              ? "bg-[#059669] text-white shadow-sm"
              : "text-[#57707E] hover:text-[#12202B] hover:bg-[#EFF4F7]"
          }`}
          title="Live AIS Vessels Telemetry"
        >
          <Anchor className="w-4 h-4" />
          {liveVessels.length > 0 && (
            <span className="absolute -top-0.5 -right-0.5 w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
          )}
        </button>

        {/* Tab 4: Alerts & Risk */}
        <button
          type="button"
          onClick={() => {
            onTabChange("alerts");
            if (!isOpen) onToggleOpen();
          }}
          className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all cursor-pointer relative ${
            activeTab === "alerts" && isOpen
              ? "bg-[#B23A2F] text-white shadow-sm"
              : "text-[#57707E] hover:text-[#12202B] hover:bg-[#EFF4F7]"
          }`}
          title="Situational Awareness & Risk Legend"
        >
          <ShieldAlert className="w-4 h-4" />
        </button>
      </div>

      {/* 2. Expanded Drawer Content (Visible when open) */}
      {isOpen && (
        <div className="flex-1 glass-drawer rounded-r-xl p-3 flex flex-col min-w-0 shadow-2xl overflow-hidden">
          {/* Header with Title & Tab Name */}
          <div className="flex items-center justify-between pb-2 border-b border-[#D7E1E8]/80 shrink-0">
            <div className="flex items-center gap-2">
              <span className="text-[11px] font-mono font-bold tracking-wider uppercase text-[#12202B]">
                {activeTab === "route" && "VOYAGE PLANNER & DECK"}
                {activeTab === "icebergs" && `TRACKED ICEBERGS (${icebergs.length})`}
                {activeTab === "fleet" && `LIVE AIS FLEET (${liveVessels.length})`}
                {activeTab === "alerts" && "SITUATIONAL AWARENESS"}
              </span>
            </div>
            <span className="text-[9px] font-mono font-bold px-1.5 py-0.5 rounded bg-[#0E7C93]/10 text-[#0E7C93]">
              POLARIS 2.0
            </span>
          </div>

          {/* Scrollable Body Content */}
          <div className="flex-1 overflow-y-auto pr-1 mt-2 space-y-3 custom-scrollbar">
            {/* Docked Inspector if point clicked */}
            {inspectorData && (
              <div className="mb-2">
                <MapInspectorPopup
                  data={inspectorData}
                  onClose={onCloseInspector || (() => {})}
                  uiMode="naval"
                  docked={true}
                />
              </div>
            )}

            {/* TAB 1: VOYAGE PLANNER */}
            {activeTab === "route" && (
              <div className="space-y-3">
                <VoyageInputPanel
                  onOptimizeRoute={onOptimizeRoute}
                  isLoading={loadingRoute}
                  selectedParams={voyageParams}
                />
                <RouteComparisonToggle
                  showOptimized={showRecommendedRoute}
                  onToggleOptimized={onToggleRecommendedRoute}
                  showGreatCircle={showGreatCircle}
                  onToggleGreatCircle={onToggleGreatCircle}
                  riskWeight={riskWeight}
                  onChangeRiskWeight={onRiskWeightChange}
                  onRiskWeightChange={onRiskWeightChange}
                  routeData={routeData}
                />
              </div>
            )}

            {/* TAB 2: ICEBERGS RADAR */}
            {activeTab === "icebergs" && (
              <div className="space-y-2.5">
                {/* Filter Pills */}
                <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                  <button
                    type="button"
                    onClick={() => setIcebergFilter("ALL")}
                    className={`py-1 text-center rounded border transition-colors cursor-pointer ${
                      icebergFilter === "ALL"
                        ? "bg-[#0E7C93] text-white font-bold border-[#0E7C93]"
                        : "bg-[#EFF4F7] text-[#57707E] border-[#D7E1E8]"
                    }`}
                  >
                    ALL ({icebergs.length})
                  </button>
                  <button
                    type="button"
                    onClick={() => setIcebergFilter("MEGABERG")}
                    className={`py-1 text-center rounded border transition-colors cursor-pointer ${
                      icebergFilter === "MEGABERG"
                        ? "bg-[#B23A2F] text-white font-bold border-[#B23A2F]"
                        : "bg-[#EFF4F7] text-[#57707E] border-[#D7E1E8]"
                    }`}
                  >
                    MEGABERGS
                  </button>
                  <button
                    type="button"
                    onClick={() => setIcebergFilter("CRITICAL")}
                    className={`py-1 text-center rounded border transition-colors cursor-pointer ${
                      icebergFilter === "CRITICAL"
                        ? "bg-[#A9700F] text-white font-bold border-[#A9700F]"
                        : "bg-[#EFF4F7] text-[#57707E] border-[#D7E1E8]"
                    }`}
                  >
                    HIGH RISK
                  </button>
                </div>

                {/* Icebergs List */}
                <div className="space-y-1.5">
                  {filteredIcebergs.map((b) => {
                    const isSelected = selectedIceberg?.iceberg_id === b.iceberg_id;
                    const hazardColor =
                      b.hazard_level === "CRITICAL"
                        ? "#B23A2F"
                        : b.hazard_level === "HIGH"
                        ? "#A9700F"
                        : "#059669";

                    return (
                      <div
                        key={b.iceberg_id}
                        onClick={() => onSelectIceberg(b)}
                        className={`p-2 rounded-lg border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                          isSelected
                            ? "bg-[#0E7C93]/10 border-[#0E7C93] shadow-xs ring-1 ring-[#0E7C93]"
                            : "bg-white hover:bg-[#EFF4F7] border-[#D7E1E8]"
                        }`}
                      >
                        <div className="flex items-center gap-2 min-w-0">
                          <div
                            className="w-2 h-8 rounded-full shrink-0"
                            style={{ backgroundColor: hazardColor }}
                          />
                          <div className="min-w-0">
                            <div className="flex items-center gap-1.5">
                              <span className="font-mono font-bold text-xs text-[#12202B]">
                                {b.iceberg_id}
                              </span>
                              {b.size_class === "D" && (
                                <span className="text-[8px] font-bold px-1 rounded bg-[#B23A2F] text-white">
                                  MEGA
                                </span>
                              )}
                              <span
                                className="text-[8.5px] font-bold font-mono px-1 rounded"
                                style={{
                                  backgroundColor: `${hazardColor}18`,
                                  color: hazardColor
                                }}
                              >
                                {b.hazard_level}
                              </span>
                            </div>
                            <div className="text-[10px] text-[#57707E] truncate">
                              {b.name || "Antarctic Sector"}
                            </div>
                          </div>
                        </div>

                        <div className="text-right shrink-0">
                          <div className="text-[11px] font-mono font-bold text-[#12202B]">
                            {b.drift_speed_knots} kts
                          </div>
                          <button
                            type="button"
                            onClick={(e) => {
                              e.stopPropagation();
                              onOpenIcebergModal(b);
                            }}
                            className="text-[9px] font-mono text-[#0E7C93] hover:underline font-bold"
                          >
                            PHYSICS ↗
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* TAB 3: FLEET & AIS */}
            {activeTab === "fleet" && (
              <div className="space-y-2.5">
                {/* Search and Toggle Bar */}
                <div className="flex items-center gap-2">
                  <div className="relative flex-1">
                    <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-[#57707E]" />
                    <input
                      type="text"
                      value={vesselSearch}
                      onChange={(e) => setVesselSearch(e.target.value)}
                      placeholder="Search ship name or MMSI..."
                      className="w-full pl-8 pr-2.5 py-1.5 text-[11px] font-mono bg-white border border-[#D7E1E8] rounded-md focus:outline-none focus:border-[#0E7C93]"
                    />
                  </div>
                  <button
                    type="button"
                    onClick={onToggleVessels}
                    className={`px-2 py-1.5 rounded-md text-[10px] font-mono border cursor-pointer ${
                      showVessels
                        ? "bg-[#059669] text-white border-[#059669] font-bold"
                        : "bg-white text-[#57707E] border-[#D7E1E8]"
                    }`}
                  >
                    {showVessels ? "ON MAP" : "HIDDEN"}
                  </button>
                </div>

                {/* Vessel Legend */}
                <div className="grid grid-cols-3 gap-1 text-[9.5px] font-mono bg-[#EFF4F7] p-1.5 rounded border border-[#D7E1E8]">
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#059669]" />
                    <span>Cargo</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#A9700F]" />
                    <span>Tanker</span>
                  </div>
                  <div className="flex items-center gap-1.5">
                    <span className="w-2 h-2 rounded-full bg-[#0E7C93]" />
                    <span>Expedition</span>
                  </div>
                </div>

                {/* Vessels List */}
                <div className="space-y-1.5 max-h-[380px] overflow-y-auto pr-1">
                  {filteredVessels.length === 0 ? (
                    <div className="text-center py-6 text-xs text-[#57707E] font-mono">
                      No vessels matching search
                    </div>
                  ) : (
                    filteredVessels.map((v) => (
                      <div
                        key={v.mmsi}
                        className="p-2 rounded-lg bg-white border border-[#D7E1E8] hover:border-[#0E7C93] transition-all text-xs space-y-1"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-[#12202B] truncate max-w-[160px]">
                            {v.name || "UNKNOWN SHIP"}
                          </span>
                          <span className="text-[10px] font-mono text-[#57707E]">
                            MMSI: {v.mmsi}
                          </span>
                        </div>
                        <div className="grid grid-cols-2 text-[10px] font-mono text-[#57707E]">
                          <div>Speed: <strong className="text-[#12202B]">{v.sog.toFixed(1)} kts</strong></div>
                          <div>Heading: <strong className="text-[#12202B]">{v.heading > 0 ? `${v.heading}°` : "N/A"}</strong></div>
                          <div className="col-span-2 text-[#0E7C93]">
                            {Math.abs(v.lat).toFixed(2)}°S, {Math.abs(v.lon).toFixed(2)}°{v.lon >= 0 ? "E" : "W"}
                          </div>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* TAB 4: SITUATIONAL AWARENESS & ALERTS */}
            {activeTab === "alerts" && (
              <div className="space-y-3">
                {/* Environmental Weather Snapshot */}
                <div className="p-2.5 rounded-lg bg-[#EFF4F7] border border-[#D7E1E8] text-xs font-mono space-y-2">
                  <div className="text-[10px] font-sans font-bold text-[#57707E] uppercase tracking-wider">
                    Environmental Telemetry
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-[11px]">
                    <div className="flex items-center gap-1.5 text-[#12202B]">
                      <Thermometer className="w-3.5 h-3.5 text-[#0E7C93]" />
                      <span>Air: <strong>{environmentalConditions?.air_temperature_celsius ?? -14.2}°C</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#12202B]">
                      <Wind className="w-3.5 h-3.5 text-[#0E7C93]" />
                      <span>Wind: <strong>{environmentalConditions?.wind_speed_knots ?? 24.5} kts</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#12202B]">
                      <Waves className="w-3.5 h-3.5 text-[#A9700F]" />
                      <span>Swell: <strong>{environmentalConditions?.significant_wave_height_m ?? 3.8}m</strong></span>
                    </div>
                    <div className="flex items-center gap-1.5 text-[#12202B]">
                      <Shield className="w-3.5 h-3.5 text-[#059669]" />
                      <span>Sea-Ice: <strong>Moderate</strong></span>
                    </div>
                  </div>
                </div>

                {/* Active Safety Alerts */}
                <AlertPanel
                  alerts={alerts}
                  icebergs={icebergs}
                  onSelectIceberg={onSelectIceberg}
                  selectedIcebergId={selectedIceberg?.iceberg_id}
                  onSelectAlert={onSelectAlert}
                />

                {/* Risk Legend Matrix */}
                <RiskLegend />
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

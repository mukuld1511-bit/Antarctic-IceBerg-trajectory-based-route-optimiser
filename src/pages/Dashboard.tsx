import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchDashboardSummary,
  fetchSICForecast,
  fetchIcebergTrack,
  optimizeRoute,
  fetchLiveVessels
} from "../api/client";
import {
  DashboardSummary,
  SICForecastResponse,
  Iceberg,
  IcebergTrackResponse,
  RouteResponse,
  MapInspectionData,
  LiveVessel
} from "../types";
import { MapView } from "../components/MapView";
import { ForecastScrubber } from "../components/ForecastScrubber";
import { RouteComparisonToggle } from "../components/RouteComparisonToggle";
import { RiskLegend } from "../components/RiskLegend";
import { MapInspectorPopup } from "../components/MapInspectorPopup";
import { VoyageInputPanel } from "../components/VoyageInputPanel";
import { AlertPanel } from "../components/AlertPanel";
import { VoyageBriefButton } from "../components/VoyageBriefButton";
import { TelemetryStrip } from "../components/TelemetryStrip";
import { IcebergInspectorModal } from "../components/IcebergInspectorModal";
import { CivilianVoyageDeck } from "../components/CivilianVoyageDeck";
import { CivilianRightOverlay } from "../components/CivilianRightOverlay";
import { CivilianJourneyStrip } from "../components/CivilianJourneyStrip";
import { CivilianGuideModal } from "../components/CivilianGuideModal";
import {
  Ship,
  Wind,
  Thermometer,
  Waves,
  Radio,
  FileCode,
  Menu,
  X,
  Clock,
  Layers,
  Shield,
  ChevronLeft,
  ChevronRight,
  Anchor
} from "lucide-react";

// Design tokens and color scale — see docs/DESIGN_SYSTEM.md

export const Dashboard: React.FC = () => {
  // UI Mode (Naval ECDIS vs. Civilian Voyager)
  const [uiMode, setUiMode] = useState<"naval" | "civilian">(() => {
    try {
      const saved = localStorage.getItem("polaris_ui_mode");
      return saved === "civilian" ? "civilian" : "naval";
    } catch {
      return "naval";
    }
  });

  const handleToggleUiMode = (mode: "naval" | "civilian") => {
    setUiMode(mode);
    try {
      localStorage.setItem("polaris_ui_mode", mode);
    } catch (e) {
      console.warn("Could not persist UI mode", e);
    }
  };

  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sicData, setSicData] = useState<SICForecastResponse | null>(null);
  const [selectedLeadDay, setSelectedLeadDay] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const playbackTimerRef = useRef<any>(null);
  const debounceRouteTimerRef = useRef<any>(null);

  // Layer toggles
  const [showSIC, setShowSIC] = useState<boolean>(true);
  const [showIcebergs, setShowIcebergs] = useState<boolean>(true);
  const [showRecommendedRoute, setShowRecommendedRoute] = useState<boolean>(true);
  const [showGreatCircle, setShowGreatCircle] = useState<boolean>(true);
  const [showVessels, setShowVessels] = useState<boolean>(true);
  const [riskWeight, setRiskWeight] = useState<number>(0.65);

  // Live AIS vessel tracking
  const [liveVessels, setLiveVessels] = useState<LiveVessel[]>([]);
  const [vesselCount, setVesselCount] = useState<number>(0);

  // Active iceberg selection & track calculation
  const [selectedIceberg, setSelectedIceberg] = useState<Iceberg | null>(null);
  const [icebergTrackData, setIcebergTrackData] = useState<IcebergTrackResponse | null>(null);
  const [loadingIcebergTrack, setLoadingIcebergTrack] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);
  const [fleetFilter, setFleetFilter] = useState<"ALL" | "MEGABERG" | "CRITICAL">("ALL");

  // Route calculation state
  const [routeData, setRouteData] = useState<RouteResponse | null>(null);
  const [loadingRoute, setLoadingRoute] = useState<boolean>(false);
  const [voyageParams, setVoyageParams] = useState({
    start_port: "Cape Town",
    start_lat: -33.9249,
    start_lon: 18.4241,
    end_port: "Maitri Research Station",
    end_lat: -70.7667,
    end_lon: 11.7333,
    vessel_class: "PC-5",
    departure_date: "2026-11-15"
  });

  // Map Inspector Popup State
  const [inspectorData, setInspectorData] = useState<MapInspectionData | null>(null);

  // Responsive Drawer & Panels
  const [leftRailOpen, setLeftRailOpen] = useState<boolean>(true);
  const [leftRailTab, setLeftRailTab] = useState<"route" | "fleet">("route");
  const [rightPanelOpen, setRightPanelOpen] = useState<boolean>(true);
  const [mobileDrawerOpen, setMobileDrawerOpen] = useState<boolean>(false);

  // System Architecture modal toggle
  const [showArchDocs, setShowArchDocs] = useState<boolean>(false);
  const [showCivilianGuide, setShowCivilianGuide] = useState<boolean>(false);

  // Live Bridge UTC Clock
  const [utcTime, setUtcTime] = useState<string>("");
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setUtcTime(now.toISOString().replace("T", " ").substring(0, 19) + " UTC");
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Initial Data Load
  useEffect(() => {
    async function initDashboard() {
      try {
        const [dashSummary, sicForecast] = await Promise.all([
          fetchDashboardSummary(),
          fetchSICForecast(7)
        ]);
        setSummary(dashSummary);
        setSicData(sicForecast);

        // Precompute initial route
        if (dashSummary.icebergs && dashSummary.icebergs.length > 0) {
          handleOptimizeRoute({
            start_port: "Cape Town",
            start_lat: -33.9249,
            start_lon: 18.4241,
            end_port: "Maitri Research Station",
            end_lat: -70.7667,
            end_lon: 11.7333,
            vessel_class: "PC-5",
            risk_weight: 0.65,
            selected_lead_day: 3
          });

          // Preload A-23a megaberg
          handleSelectIceberg(dashSummary.icebergs[0]);
        }
      } catch (err) {
        console.error("Dashboard initial hydration error:", err);
      }
    }
    initDashboard();
  }, []);

  // Poll live AIS vessels every 15 seconds
  useEffect(() => {
    let cancelled = false;
    async function pollVessels() {
      try {
        const data = await fetchLiveVessels();
        if (!cancelled) {
          setLiveVessels(data.vessels);
          setVesselCount(data.total_tracked);
        }
      } catch (err) {
        console.warn("Failed to fetch live vessels:", err);
      }
    }
    pollVessels();
    const interval = setInterval(pollVessels, 15000);
    return () => { cancelled = true; clearInterval(interval); };
  }, []);

  // Timeline scrubber playback loop with variable speed
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(350, Math.round(1400 / playbackSpeed));
      playbackTimerRef.current = setInterval(() => {
        setSelectedLeadDay((prev) => (prev >= 7 ? 0 : prev + 1));
      }, intervalMs);
    } else {
      if (playbackTimerRef.current) {
        clearInterval(playbackTimerRef.current);
        playbackTimerRef.current = null;
      }
    }
    return () => {
      if (playbackTimerRef.current) clearInterval(playbackTimerRef.current);
    };
  }, [isPlaying, playbackSpeed]);

  const handleSelectIceberg = useCallback(async (berg: Iceberg) => {
    setSelectedIceberg(berg);
    setLoadingIcebergTrack(true);
    try {
      const track = await fetchIcebergTrack(berg.iceberg_id, 72);
      setIcebergTrackData(track);
    } catch (err) {
      console.error("Failed to load iceberg track:", err);
    } finally {
      setLoadingIcebergTrack(false);
    }
  }, []);

  const handleOpenIcebergModal = (berg: Iceberg) => {
    handleSelectIceberg(berg);
    setIsInspectorOpen(true);
  };

  const handleOptimizeRoute = async (params: {
    start_port: string;
    start_lat: number;
    start_lon: number;
    end_port: string;
    end_lat: number;
    end_lon: number;
    vessel_class: string;
    risk_weight?: number;
    selected_lead_day?: number;
    departure_date?: string;
  }) => {
    setLoadingRoute(true);
    setVoyageParams((prev) => ({
      ...prev,
      start_port: params.start_port,
      start_lat: params.start_lat,
      start_lon: params.start_lon,
      end_port: params.end_port,
      end_lat: params.end_lat,
      end_lon: params.end_lon,
      vessel_class: params.vessel_class,
      departure_date: params.departure_date || prev.departure_date
    }));

    try {
      const res = await optimizeRoute({
        start_port: params.start_port,
        start_lat: params.start_lat,
        start_lon: params.start_lon,
        end_port: params.end_port,
        end_lat: params.end_lat,
        end_lon: params.end_lon,
        vessel_class: params.vessel_class,
        risk_weight: typeof params.risk_weight === "number" ? params.risk_weight : riskWeight,
        selected_lead_day: typeof params.selected_lead_day === "number" ? params.selected_lead_day : selectedLeadDay
      });
      setRouteData(res);
    } catch (err) {
      console.error("Route optimization error:", err);
    } finally {
      setLoadingRoute(false);
    }
  };

  // Re-run optimization when risk weight or params change
  const handleTriggerRecompute = (newWeight?: number) => {
    const weight = typeof newWeight === "number" ? newWeight : riskWeight;
    handleOptimizeRoute({
      start_port: voyageParams.start_port,
      start_lat: voyageParams.start_lat,
      start_lon: voyageParams.start_lon,
      end_port: voyageParams.end_port,
      end_lat: voyageParams.end_lat,
      end_lon: voyageParams.end_lon,
      vessel_class: voyageParams.vessel_class,
      risk_weight: weight,
      selected_lead_day: selectedLeadDay
    });
  };

  // Extract current SIC cells for the selected lead day
  const currentLeadForecast =
    (Array.isArray(sicData?.forecasts)
      ? sicData.forecasts.find((f) => f.lead_day === selectedLeadDay) || sicData.forecasts[0]
      : null);
  const currentCells = currentLeadForecast?.grid_cells || [];

  return (
    <div
      id="antarctic-dss-root"
      className="relative w-screen h-screen overflow-hidden bg-chart-bg text-ink font-sans flex flex-col select-none"
    >
      {/* ========================================================================= */}
      {/* 1. TOP BRIDGE INSTRUMENT BAR                                              */}
      {/* ========================================================================= */}
      <header
        id="bridge-header-bar"
        className="h-12 bg-panel border-b border-hairline px-4 flex items-center justify-between z-40 shrink-0 select-none shadow-sm"
      >
        {/* Left: Organization & Vessel Identity */}
        <div className="flex items-center gap-3">
          <button
            id="btn-mobile-menu"
            onClick={() => setMobileDrawerOpen(true)}
            className="lg:hidden p-1.5 bg-panel-low border border-hairline text-ink-muted hover:text-ink cursor-pointer"
            title="Open Control Instruments"
          >
            <Menu className="w-4 h-4" />
          </button>

          <div className="w-7 h-7 bg-brass text-white flex items-center justify-center border border-brass">
            <Ship className="w-4 h-4" />
          </div>

          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-xs tracking-wider text-ink">
                {uiMode === "civilian"
                  ? "POLAR EXPEDITION VOYAGER // SOUTHERN OCEAN"
                  : "POLARIS DSS // RV SAMUDRA RATNA [PC-4]"}
              </span>
              <span className="hidden sm:inline-block px-1.5 py-0.5 bg-panel-low text-ink-muted border border-hairline text-[9px] font-mono">
                {uiMode === "civilian" ? "CIVILIAN EXPEDITION" : "CALLSIGN: VTJR"}
              </span>
            </div>
            <div className="hidden md:block text-[10px] text-ink-muted font-mono leading-tight">
              {uiMode === "civilian"
                ? "SATELLITE SEA-ICE MONITOR // REAL-TIME HAZARD AVOIDANCE"
                : "ANTARCTIC DECISION SUPPORT // CONVLSTM + HYBRID BIGG ODE"}
            </div>
          </div>
        </div>

        {/* Center: Live MetOcean Bridge Ticker (Simplified in Civilian mode) */}
        {uiMode === "civilian" ? (
          <div className="hidden xl:flex items-center gap-3 text-xs text-[#475569] bg-white/80 px-3 py-1 rounded-lg border border-[#E2E8F0] shadow-xs">
            <div className="flex items-center gap-1.5 text-[#16A34A] font-semibold">
              <span className="w-2 h-2 rounded-full bg-[#16A34A] animate-pulse" />
              <span>Satellite Live</span>
            </div>
            <div className="w-px h-3 bg-[#CBD5E1]" />
            <div className="flex items-center gap-1 text-[#0F172A] font-medium">
              <span>☀️ Calm Polar Summer</span>
            </div>
            <div className="w-px h-3 bg-[#CBD5E1]" />
            <div className="flex items-center gap-1">
              <span>🌡️ {summary?.environmental_conditions.air_temperature_celsius ?? -14.2}°C</span>
            </div>
            <div className="w-px h-3 bg-[#CBD5E1]" />
            <div className="flex items-center gap-1 text-[#0F172A] font-medium">
              <Clock className="w-3.5 h-3.5 text-[#64748B]" />
              <span>{utcTime}</span>
            </div>
          </div>
        ) : (
          <div className="hidden xl:flex items-center gap-4 text-xs font-mono text-ink-muted bg-panel-low px-3 py-1 border border-hairline">
            <div className="flex items-center gap-1.5 px-1.5 py-0.5 bg-panel border border-hairline text-[10px]">
              <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse" />
              <span className="font-bold text-ink">SAR Live</span>
              <span className="text-ink-muted">· COPERNICUS</span>
            </div>
            <div className="w-px h-3 bg-hairline" />
            <div className="flex items-center gap-1">
              <Thermometer className="w-3.5 h-3.5 text-brass" />
              <span>{summary?.environmental_conditions.air_temperature_celsius ?? -14.2}°C</span>
            </div>
            <div className="w-px h-3 bg-hairline" />
            <div className="flex items-center gap-1">
              <Wind className="w-3.5 h-3.5 text-brass" />
              <span>
                {summary?.environmental_conditions.wind_speed_knots ?? 24.5} kts{" "}
                {summary?.environmental_conditions.wind_direction ?? "SE"}
              </span>
            </div>
            <div className="w-px h-3 bg-hairline" />
            <div className="flex items-center gap-1">
              <Waves className="w-3.5 h-3.5 text-caution" />
              <span>
                {summary?.environmental_conditions.significant_wave_height_m ?? 3.8}m SWELL
              </span>
            </div>
            <div className="w-px h-3 bg-hairline" />
            <div className="flex items-center gap-1 text-ink font-semibold">
              <Clock className="w-3.5 h-3.5 text-ink-muted" />
              <span>{utcTime}</span>
            </div>
          </div>
        )}

        {/* Right: Actions & Dual Mode Toggle */}
        <div className="flex items-center gap-2">
          {/* Dual UI Mode Segmented Switch */}
          <div
            id="dual-mode-toggle"
            className="flex items-center bg-[#F1F5F9] p-0.5 rounded-lg border border-[#CBD5E1] shadow-xs mr-1"
          >
            <button
              id="btn-mode-naval"
              type="button"
              onClick={() => handleToggleUiMode("naval")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                uiMode === "naval"
                  ? "bg-[#12202B] text-white shadow-xs font-mono"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Naval ECDIS Bridge: High-density Admiralty chart, ODE force repeaters, Conning matrix"
            >
              <span>⚓</span>
              <span className="hidden sm:inline">NAVAL ECDIS</span>
            </button>
            <button
              id="btn-mode-civilian"
              type="button"
              onClick={() => handleToggleUiMode("civilian")}
              className={`flex items-center gap-1.5 px-2.5 py-1 text-[11px] font-semibold rounded-md transition-all cursor-pointer ${
                uiMode === "civilian"
                  ? "bg-[#0E7C93] text-white shadow-xs"
                  : "text-[#64748B] hover:text-[#0F172A]"
              }`}
              title="Civilian Voyager: Plain language, friendly expedition route & iceberg monitor"
            >
              <span>🌐</span>
              <span className="hidden sm:inline">CIVILIAN VOYAGER</span>
            </button>
          </div>

          <VoyageBriefButton
            routeData={routeData}
            selectedLeadDay={selectedLeadDay}
            vesselClass={voyageParams.vessel_class}
            startPort={voyageParams.start_port}
            endPort={voyageParams.end_port}
            departureDate={voyageParams.departure_date}
          />

          {uiMode === "civilian" ? (
            <button
              id="btn-civilian-guide"
              type="button"
              onClick={() => setShowCivilianGuide(true)}
              className="px-2.5 py-1.5 bg-[#F0FDFA] hover:bg-[#CCFBF1] text-[#0E7C93] border border-[#99F6E4] text-xs font-semibold rounded-lg flex items-center gap-1.5 transition-colors cursor-pointer shadow-xs"
              title="Learn how Antarctic sea-ice and routes work"
            >
              <span>💡</span>
              <span className="hidden lg:inline">EXPEDITION GUIDE</span>
            </button>
          ) : (
            <button
              id="btn-arch-docs"
              onClick={() => setShowArchDocs(true)}
              className="px-2.5 py-1.5 bg-panel hover:bg-chart-bg text-ink-muted hover:text-ink border border-hairline text-xs font-mono flex items-center gap-1 transition-colors cursor-pointer"
              title="Review Theoretical Formulation & Mathematical Models"
            >
              <FileCode className="w-3.5 h-3.5 text-brass" />
              <span className="hidden lg:inline">PHYSICS SPEC</span>
            </button>
          )}

          {uiMode === "naval" && (
            <div className="w-7 h-7 bg-brass text-white font-mono text-[10px] font-bold flex items-center justify-center border border-brass" title="Bridge Watch Officer Identity Token">
              WO-2
            </div>
          )}
        </div>
      </header>

      {/* ========================================================================= */}
      {/* 2. FULL-BLEED MAP WITH OVERLAID TRANSLUCENT INSTRUMENT RAILS              */}
      {/* ========================================================================= */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        {/* The Dominant Full-Bleed Map Component */}
        <MapView
          sicCells={currentCells}
          sicOpacity={0.8}
          showSIC={showSIC}
          icebergs={summary?.icebergs || []}
          selectedIcebergTrack={icebergTrackData}
          showIcebergs={showIcebergs}
          onSelectIceberg={handleOpenIcebergModal}
          routeData={routeData}
          showRecommendedRoute={showRecommendedRoute}
          showGreatCircle={showGreatCircle}
          stations={summary?.polar_stations || []}
          currentLeadDay={selectedLeadDay}
          onInspectPoint={(data) => setInspectorData(data)}
          liveVessels={liveVessels}
          showVessels={showVessels}
          startPort={voyageParams.start_port}
          endPort={voyageParams.end_port}
          selectedIceberg={selectedIceberg}
          isPlaying={isPlaying}
          uiMode={uiMode}
        />

        {/* ----------------------------------------------------------------------- */}
        {/* LEFT INSTRUMENT RAIL (Controls, Inputs, Route Comparator)                */}
        {/* ----------------------------------------------------------------------- */}
        <div
          id="left-instrument-rail"
          className={`absolute top-3 left-3 z-[450] flex flex-col gap-3 transition-all duration-300 pointer-events-none ${
            leftRailOpen ? "w-80 md:w-[21rem] max-h-[calc(100vh-180px)]" : "w-10 h-10"
          } hidden lg:flex`}
        >
          {leftRailOpen ? (
            <div className="pointer-events-auto flex flex-col gap-3 overflow-y-auto pr-1 pb-2">
              {uiMode === "civilian" ? (
                <CivilianVoyageDeck
                  voyageParams={voyageParams}
                  routeData={routeData}
                  loadingRoute={loadingRoute}
                  onSelectVoyage={(params) => {
                    const nextParams = { ...voyageParams, ...params };
                    setVoyageParams(nextParams);
                    handleOptimizeRoute({
                      start_port: nextParams.start_port,
                      start_lat: nextParams.start_lat,
                      start_lon: nextParams.start_lon,
                      end_port: nextParams.end_port,
                      end_lat: nextParams.end_lat,
                      end_lon: nextParams.end_lon,
                      vessel_class: nextParams.vessel_class || "PC-5",
                      risk_weight: riskWeight,
                      selected_lead_day: selectedLeadDay
                    });
                  }}
                  selectedLeadDay={selectedLeadDay}
                  icebergs={summary?.icebergs || []}
                  selectedIceberg={selectedIceberg}
                  onSelectIceberg={handleOpenIcebergModal}
                  showOptimized={showRecommendedRoute}
                  onToggleOptimized={() => setShowRecommendedRoute(!showRecommendedRoute)}
                  showGreatCircle={showGreatCircle}
                  onToggleGreatCircle={() => setShowGreatCircle(!showGreatCircle)}
                  onSwitchToNaval={() => handleToggleUiMode("naval")}
                />
              ) : (
                <>
                  {/* Tabbed Navigation Header for Left Rail */}
                  <div className="flex items-center justify-between bg-panel border border-hairline p-1 shadow-sm">
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => setLeftRailTab("route")}
                        className={`px-3 py-1.5 text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          leftRailTab === "route"
                            ? "bg-brass text-white border-brass shadow-xs"
                            : "bg-panel-low text-ink-muted border-hairline hover:text-ink hover:bg-panel"
                        }`}
                        title="Voyage Route Planner & Objectives"
                      >
                        <Ship className="w-3.5 h-3.5" />
                        <span>VOYAGE ROUTE</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => setLeftRailTab("fleet")}
                        className={`px-3 py-1.5 text-[10.5px] font-mono font-bold flex items-center gap-1.5 transition-colors cursor-pointer border ${
                          leftRailTab === "fleet"
                            ? "bg-brass text-white border-brass shadow-xs"
                            : "bg-panel-low text-ink-muted border-hairline hover:text-ink hover:bg-panel"
                        }`}
                        title="Drift Fleet Tracking & Live AIS Stream"
                      >
                        <Radio className="w-3.5 h-3.5 text-danger animate-pulse" />
                        <span>FLEET & AIS ({(summary?.icebergs || []).length})</span>
                      </button>
                    </div>
                    <button
                      onClick={() => setLeftRailOpen(false)}
                      className="p-1 hover:text-ink hover:bg-panel-low transition cursor-pointer text-ink-muted"
                      title="Collapse Rail"
                    >
                      <ChevronLeft className="w-3.5 h-3.5" />
                    </button>
                  </div>

                  {leftRailTab === "route" ? (
                    <>
                      {/* 1. Voyage Input Panel */}
                      <VoyageInputPanel
                        onOptimizeRoute={(params) => {
                          handleOptimizeRoute(params);
                        }}
                        isLoading={loadingRoute}
                        selectedParams={voyageParams}
                      />

                      {/* 2. Route Comparison Mode & Objectives Slider */}
                      <RouteComparisonToggle
                        showOptimized={showRecommendedRoute}
                        onToggleOptimized={() => setShowRecommendedRoute(!showRecommendedRoute)}
                        showGreatCircle={showGreatCircle}
                        onToggleGreatCircle={() => setShowGreatCircle(!showGreatCircle)}
                        riskWeight={riskWeight}
                        onChangeRiskWeight={(w) => {
                          setRiskWeight(w);
                          handleTriggerRecompute(w);
                        }}
                        onRiskWeightChange={(w) => {
                          setRiskWeight(w);
                          handleTriggerRecompute(w);
                        }}
                        routeData={routeData}
                      />
                    </>
                  ) : (
                    <>
                      {/* 3. Iceberg Fleet Quick Access & Tracking */}
                      <div
                        id="iceberg-fleet-widget"
                        className="bg-panel border border-hairline p-3 text-xs shadow-md space-y-2"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-hairline text-[11px] font-mono text-ink-muted">
                          <span className="flex items-center gap-1 text-caution font-semibold font-sans">
                            <Radio className="w-3 h-3 animate-pulse text-danger" />
                            DRIFT FLEET ({summary?.icebergs?.length || 0})
                          </span>
                          <span className="text-[9px] font-mono bg-panel-low px-1.5 py-0.5 text-ink-muted border border-hairline">NIC / SAR</span>
                        </div>

                        {/* Fleet Filter Tabs */}
                        <div className="grid grid-cols-3 gap-1 text-[10px] font-mono">
                          <button
                            type="button"
                            onClick={() => setFleetFilter("ALL")}
                            className={`py-1 text-center transition-colors border cursor-pointer ${
                              fleetFilter === "ALL"
                                ? "bg-brass text-white font-bold border-brass"
                                : "bg-panel border-hairline text-ink-muted hover:text-ink"
                            }`}
                          >
                            ALL ({(summary?.icebergs || []).length})
                          </button>
                          <button
                            type="button"
                            onClick={() => setFleetFilter("MEGABERG")}
                            className={`py-1 text-center transition-colors border cursor-pointer ${
                              fleetFilter === "MEGABERG"
                                ? "bg-danger text-white font-bold border-danger"
                                : "bg-panel border-hairline text-ink-muted hover:text-ink"
                            }`}
                          >
                            MEGABERGS
                          </button>
                          <button
                            type="button"
                            onClick={() => setFleetFilter("CRITICAL")}
                            className={`py-1 text-center transition-colors border cursor-pointer ${
                              fleetFilter === "CRITICAL"
                                ? "bg-caution text-white font-bold border-caution"
                                : "bg-panel border-hairline text-ink-muted hover:text-ink"
                            }`}
                          >
                            HIGH RISK
                          </button>
                        </div>

                        {/* Icebergs List with 1-Click Track & ODE View */}
                        <div className="space-y-1.5 max-h-64 overflow-y-auto pr-1">
                          {(summary?.icebergs || [])
                            .filter((b) => {
                              if (fleetFilter === "MEGABERG") return b.size_class === "D";
                              if (fleetFilter === "CRITICAL") return b.hazard_level === "CRITICAL" || b.hazard_level === "HIGH";
                              return true;
                            })
                            .map((b) => {
                              const isSelected = selectedIceberg?.iceberg_id === b.iceberg_id;
                              const isMegaberg = b.size_class === "D";
                              return (
                                <div
                                  key={b.iceberg_id}
                                  onClick={() => handleSelectIceberg(b)}
                                  className={`p-2 border cursor-pointer flex items-center justify-between transition-colors ${
                                    isSelected
                                      ? "bg-brass-soft border-brass"
                                      : "bg-panel-low hover:bg-chart-bg border-hairline"
                                  }`}
                                >
                                  <div className="flex items-center gap-2">
                                    <span
                                      className={`w-6 h-6 flex items-center justify-center font-bold text-[10px] shrink-0 border ${
                                        b.hazard_level === "CRITICAL"
                                          ? "bg-danger-light border-danger text-danger"
                                          : isMegaberg
                                          ? "bg-caution-light border-caution text-caution"
                                          : "bg-brass-soft border-brass text-brass"
                                      }`}
                                    >
                                      {isMegaberg ? "🏔️" : b.size_class}
                                    </span>
                                    <div>
                                      <div className="flex items-center gap-1.5">
                                        <span className="font-mono text-ink font-bold text-[11px]">
                                          {b.iceberg_id}
                                        </span>
                                        <span
                                          className={`text-[8px] font-mono px-1 py-0.2 font-semibold border ${
                                            b.hazard_level === "CRITICAL"
                                              ? "bg-danger-light border-danger text-danger"
                                              : "bg-caution-light border-caution text-caution"
                                          }`}
                                        >
                                          {b.hazard_level}
                                        </span>
                                      </div>
                                      <div className="text-[10px] text-ink-muted truncate max-w-[130px]">
                                        {b.name}
                                      </div>
                                    </div>
                                  </div>

                                  <div className="text-right font-mono text-[10px] shrink-0">
                                    <span className="text-ink font-bold block">{b.drift_speed_knots} kts</span>
                                    <button
                                      type="button"
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleOpenIcebergModal(b);
                                      }}
                                      className="text-[9px] text-brass hover:underline font-semibold cursor-pointer"
                                    >
                                      ODE PHYSICS ↗
                                    </button>
                                  </div>
                                </div>
                              );
                            })}
                        </div>
                      </div>

                      {/* 4. Live AIS Vessel Tracking */}
                      <div
                        id="live-vessel-widget"
                        className="bg-panel border border-hairline p-3 text-xs shadow-md"
                      >
                        <div className="flex items-center justify-between pb-1.5 border-b border-hairline text-[11px] font-mono text-ink-muted">
                          <span className="flex items-center gap-1 text-brass font-semibold font-sans">
                            <Anchor className="w-3 h-3" />
                            LIVE AIS VESSELS ({liveVessels.length})
                          </span>
                          <span className="text-[9px] font-mono bg-panel-low px-1.5 py-0.5 border border-hairline">{vesselCount} TRACKED</span>
                        </div>

                        <div className="mt-2 flex items-center justify-between">
                          <label className="flex items-center gap-2 cursor-pointer">
                            <input
                              type="checkbox"
                              checked={showVessels}
                              onChange={() => setShowVessels(!showVessels)}
                              className="w-3.5 h-3.5 accent-brass cursor-pointer"
                            />
                            <span className="text-[11px] text-ink font-medium">Show on Map</span>
                          </label>
                          <div className="flex items-center gap-1 text-[9px] font-mono text-ink-muted">
                            <span className="w-1.5 h-1.5 rounded-full bg-safe animate-pulse"></span>
                            STREAMING
                          </div>
                        </div>

                        {liveVessels.length > 0 && (
                          <div className="mt-2 grid grid-cols-3 gap-1 text-[9px] font-mono">
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#2563EB]"></span>Cargo</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-caution"></span>Tanker</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-safe"></span>Passenger</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-brass"></span>Fishing</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-[#7C3AED]"></span>HSC</div>
                            <div className="flex items-center gap-1"><span className="w-2 h-2 bg-ink-muted"></span>Other</div>
                          </div>
                        )}
                      </div>
                    </>
                  )}
                </>
          )}
        </div>
          ) : (
            <button
              onClick={() => setLeftRailOpen(true)}
              className="pointer-events-auto w-9 h-9 bg-panel border border-hairline flex items-center justify-center text-brass hover:text-ink shadow-md cursor-pointer"
              title="Expand Controls Rail"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* RIGHT OVERLAY (Alerts & Semantic Risk Legend OR Civilian Conditions Guide) */}
        {/* ----------------------------------------------------------------------- */}
        <div
          id="right-instrument-rail"
          className="absolute top-3 right-3 z-[450] hidden md:flex flex-col gap-2.5 w-80 pointer-events-none max-h-[calc(100vh-200px)]"
        >
          {uiMode === "civilian" ? (
            <CivilianRightOverlay
              icebergs={summary?.icebergs || []}
              onSelectIceberg={handleOpenIcebergModal}
              selectedIcebergId={selectedIceberg?.iceberg_id}
            />
          ) : rightPanelOpen ? (
            <div className="pointer-events-auto flex flex-col gap-2.5 overflow-y-auto pr-1">
              <div className="flex items-center justify-between bg-panel border border-hairline px-3 py-1 text-[11px] font-mono text-ink-muted shadow-sm">
                <span className="font-sans font-semibold text-ink uppercase tracking-wider text-[10px]">SITUATIONAL AWARENESS</span>
                <button
                  onClick={() => setRightPanelOpen(false)}
                  className="p-0.5 hover:text-ink cursor-pointer"
                  title="Hide Alerts"
                >
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* 0. Docked Coordinate Inspector (When user clicks map or alert) */}
              {inspectorData && (
                <div className="pointer-events-auto">
                  <MapInspectorPopup
                    data={inspectorData}
                    onClose={() => setInspectorData(null)}
                    uiMode={uiMode}
                    docked={true}
                  />
                </div>
              )}

              {/* 1. Alert Panel */}
              <AlertPanel
                alerts={summary?.active_alerts}
                icebergs={summary?.icebergs || []}
                onSelectIceberg={handleOpenIcebergModal}
                selectedIcebergId={selectedIceberg?.iceberg_id}
                onSelectAlert={(alt) => {
                  if (alt.location_lat && alt.location_lon) {
                    setInspectorData({
                      lat: alt.location_lat,
                      lon: alt.location_lon,
                      sic: 0.78,
                      iceberg_proximity_nm: 4.2,
                      nearest_iceberg_name: "A-23a Megaberg",
                      nearest_iceberg_uncertainty_km: 24.5,
                      wind_speed_knots: 32.0,
                      wave_height_m: 4.5,
                      computed_risk: alt.severity === "CRITICAL" ? 0.88 : 0.58,
                      risk_category: alt.severity === "CRITICAL" ? "HIGH_RISK" : "CAUTION",
                      bathymetry_depth_m: 520
                    });
                  }
                }}
              />

              {/* 2. Risk Grid Legend */}
              <RiskLegend />
            </div>
          ) : (
            <button
              onClick={() => setRightPanelOpen(true)}
              className="pointer-events-auto ml-auto px-2.5 py-1.5 bg-panel border border-hairline text-[11px] font-mono text-brass hover:text-ink shadow-md flex items-center gap-1.5 cursor-pointer"
              title="Show Risk Legend & Alerts"
            >
              <Shield className="w-3.5 h-3.5" />
              <span>ALERTS & LEGEND</span>
            </button>
          )}
        </div>

        {/* ----------------------------------------------------------------------- */}
        {/* MAP CLICK INSPECTOR POPUP (Floating only if right rail is collapsed)    */}
        {/* ----------------------------------------------------------------------- */}
        {inspectorData && (!rightPanelOpen || uiMode === "civilian") && (
          <MapInspectorPopup
            data={inspectorData}
            onClose={() => setInspectorData(null)}
            uiMode={uiMode}
            docked={false}
          />
        )}

        {/* ----------------------------------------------------------------------- */}
        {/* BOTTOM INSTRUMENT STRIP & TIMELINE SCRUBBER                             */}
        {/* ----------------------------------------------------------------------- */}
        <div
          id="bottom-instrument-cluster"
          className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[450] w-[95%] max-w-4xl flex flex-col gap-2 pointer-events-auto"
        >
          {/* Telemetry Strip / Civilian Journey Strip */}
          {uiMode === "civilian" ? (
            <CivilianJourneyStrip
              routeData={routeData}
              startPort={voyageParams.start_port}
              endPort={voyageParams.end_port}
              currentLeadDay={selectedLeadDay}
            />
          ) : (
            <TelemetryStrip
              routeData={routeData}
              showOptimized={showRecommendedRoute}
              showGreatCircle={showGreatCircle}
            />
          )}

          {/* 7-Day Forecast Timeline Scrubber */}
          <ForecastScrubber
            forecasts={sicData?.forecasts || []}
            selectedLeadDay={selectedLeadDay}
            onSelectLeadDay={(d) => {
              setSelectedLeadDay(d);
              if (routeData) {
                if (debounceRouteTimerRef.current) clearTimeout(debounceRouteTimerRef.current);
                debounceRouteTimerRef.current = setTimeout(() => {
                  handleOptimizeRoute({
                    start_port: voyageParams.start_port,
                    start_lat: voyageParams.start_lat,
                    start_lon: voyageParams.start_lon,
                    end_port: voyageParams.end_port,
                    end_lat: voyageParams.end_lat,
                    end_lon: voyageParams.end_lon,
                    vessel_class: voyageParams.vessel_class,
                    risk_weight: riskWeight,
                    selected_lead_day: d
                  });
                }, 250);
              }
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => {
              const nextPlay = !isPlaying;
              setIsPlaying(nextPlay);
              if (!nextPlay && routeData) {
                // When pausing, ensure latest route calculation is triggered for the paused day
                handleOptimizeRoute({
                  start_port: voyageParams.start_port,
                  start_lat: voyageParams.start_lat,
                  start_lon: voyageParams.start_lon,
                  end_port: voyageParams.end_port,
                  end_lat: voyageParams.end_lat,
                  end_lon: voyageParams.end_lon,
                  vessel_class: voyageParams.vessel_class,
                  risk_weight: riskWeight,
                  selected_lead_day: selectedLeadDay
                });
              }
            }}
            playbackSpeed={playbackSpeed}
            onSpeedChange={(spd) => setPlaybackSpeed(spd)}
            onStepForward={() => {
              setSelectedLeadDay((prev) => Math.min(7, prev + 1));
            }}
            onStepBackward={() => {
              setSelectedLeadDay((prev) => Math.max(0, prev - 1));
            }}
          />
        </div>
      </div>

      {/* ========================================================================= */}
      {/* 3. MOBILE & TABLET SLIDE-OUT DRAWER (<900px)                              */}
      {/* ========================================================================= */}
      {mobileDrawerOpen && (
        <div className="fixed inset-0 z-[1200] lg:hidden flex">
          {/* Backdrop */}
          <div
            onClick={() => setMobileDrawerOpen(false)}
            className="fixed inset-0 bg-black/60"
          />

          {/* Drawer Content */}
          <div className="relative w-[21rem] max-w-[85vw] h-full bg-panel border-r border-hairline p-4 overflow-y-auto space-y-4 shadow-xl flex flex-col">
            <div className="flex items-center justify-between pb-3 border-b border-hairline">
              <div className="flex items-center gap-2">
                <Ship className="w-5 h-5 text-brass" />
                <span className="font-bold text-xs tracking-wider text-ink">
                  VOYAGE INSTRUMENTS
                </span>
              </div>
              <button
                onClick={() => setMobileDrawerOpen(false)}
                className="p-1 text-ink-muted hover:text-ink cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uiMode === "civilian" ? (
              <CivilianVoyageDeck
                voyageParams={voyageParams}
                routeData={routeData}
                loadingRoute={loadingRoute}
                onSelectVoyage={(params) => {
                  const nextParams = { ...voyageParams, ...params };
                  setVoyageParams(nextParams);
                  handleOptimizeRoute({
                    start_port: nextParams.start_port,
                    start_lat: nextParams.start_lat,
                    start_lon: nextParams.start_lon,
                    end_port: nextParams.end_port,
                    end_lat: nextParams.end_lat,
                    end_lon: nextParams.end_lon,
                    vessel_class: nextParams.vessel_class || "PC-5",
                    risk_weight: riskWeight,
                    selected_lead_day: selectedLeadDay
                  });
                  setMobileDrawerOpen(false);
                }}
                selectedLeadDay={selectedLeadDay}
                icebergs={summary?.icebergs || []}
                selectedIceberg={selectedIceberg}
                onSelectIceberg={(b) => {
                  handleOpenIcebergModal(b);
                  setMobileDrawerOpen(false);
                }}
                showOptimized={showRecommendedRoute}
                onToggleOptimized={() => setShowRecommendedRoute(!showRecommendedRoute)}
                showGreatCircle={showGreatCircle}
                onToggleGreatCircle={() => setShowGreatCircle(!showGreatCircle)}
                onSwitchToNaval={() => {
                  handleToggleUiMode("naval");
                  setMobileDrawerOpen(false);
                }}
              />
            ) : (
              <>
                {/* Voyage Input Form */}
                <VoyageInputPanel
                  onOptimizeRoute={(params) => {
                    handleOptimizeRoute(params);
                    setMobileDrawerOpen(false);
                  }}
                  isLoading={loadingRoute}
                  selectedParams={voyageParams}
                />

                {/* Route Comparison Controls */}
                <RouteComparisonToggle
                  showOptimized={showRecommendedRoute}
                  onToggleOptimized={() => setShowRecommendedRoute(!showRecommendedRoute)}
                  showGreatCircle={showGreatCircle}
                  onToggleGreatCircle={() => setShowGreatCircle(!showGreatCircle)}
                  riskWeight={riskWeight}
                  onChangeRiskWeight={(w) => {
                    setRiskWeight(w);
                    handleTriggerRecompute(w);
                  }}
                  onRiskWeightChange={(w) => {
                    setRiskWeight(w);
                    handleTriggerRecompute(w);
                  }}
                  routeData={routeData}
                />

                {/* Alerts */}
                <AlertPanel
                  alerts={summary?.active_alerts}
                  icebergs={summary?.icebergs || []}
                  selectedIcebergId={selectedIceberg?.iceberg_id}
                  onSelectIceberg={(b) => {
                    handleOpenIcebergModal(b);
                    setMobileDrawerOpen(false);
                  }}
                  onSelectAlert={() => setMobileDrawerOpen(false)}
                />

                {/* Risk Legend */}
                <RiskLegend />
              </>
            )}
          </div>
        </div>
      )}

      {/* ========================================================================= */}
      {/* 4. MODALS (Iceberg ODE Physics Modal & Architecture Documentation)       */}
      {/* ========================================================================= */}
      {isInspectorOpen && (
        <IcebergInspectorModal
          iceberg={selectedIceberg}
          trackData={icebergTrackData}
          loading={loadingIcebergTrack}
          onClose={() => setIsInspectorOpen(false)}
        />
      )}

      {showCivilianGuide && (
        <CivilianGuideModal onClose={() => setShowCivilianGuide(false)} />
      )}

      {showArchDocs && (
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/70 p-4">
          <div className="bg-panel border border-hairline w-full max-w-3xl max-h-[85vh] overflow-hidden flex flex-col text-ink shadow-md">
            <div className="p-3 border-b border-hairline bg-panel-low flex items-center justify-between">
              <div className="flex items-center gap-2">
                <FileCode className="w-4 h-4 text-brass" />
                <h3 className="font-bold text-xs tracking-wider uppercase text-ink font-mono">
                  POLARIS DSS // ARCHITECTURE SPECIFICATION
                </h3>
              </div>
              <button
                onClick={() => setShowArchDocs(false)}
                className="px-2.5 py-1 bg-panel hover:bg-chart-bg text-ink-muted hover:text-ink border border-hairline text-xs font-mono cursor-pointer"
              >
                DISMISS
              </button>
            </div>

            <div className="p-4 overflow-y-auto space-y-3 text-xs font-sans leading-relaxed text-ink-muted">
              <div className="bg-panel-low p-3 border border-hairline font-mono text-[11px] text-ink">
                <strong className="text-brass block mb-1">
                  1. Spatiotemporal SIC Forecast Engine (ConvLSTM):
                </strong>
                <div>
                  • Input: AMSR2 / Sentinel-1 SAR brightness temperatures + ERA5 10m wind vector & 2m skin temp.
                </div>
                <div>
                  • Architecture: 4-layer Convolutional LSTM with coordinate convolution for polar grid distortions.
                </div>
                <div>
                  • Output: N-day gridded concentration tensor C(x, y, t) ∈ [0.0, 1.0].
                </div>
              </div>

              <div className="bg-panel-low p-3 border border-hairline font-mono text-[11px] text-ink">
                <strong className="text-caution block mb-1">
                  2. Iceberg Trajectory Model (Bigg et al. ODE + LSTM Residual):
                </strong>
                <div className="text-caution my-1">
                  M · (dv_i / dt) = F_air + F_water + F_coriolis + F_slope
                </div>
                <div>
                  • M = m_i · (1 + C_am) where C_am = 0.5 (virtual added mass).
                </div>
                <div>
                  • F_coriolis = -2 M (Ω × v_i) (Southern Hemisphere leftward deflection).
                </div>
                <div>
                  • Conical uncertainty dispersion bounds: σ(t) = σ_0 + κ · t^1.2.
                </div>
              </div>

              <div className="bg-panel-low p-3 border border-hairline font-mono text-[11px] text-ink">
                <strong className="text-safe block mb-1">
                  3. Polar A* Graph Route Optimization & Lindqvist Resistance:
                </strong>
                <div>
                  • Edge Cost: J(e) = (1 - w_risk) · Fuel(e) + w_risk · Risk(e).
                </div>
                <div>
                  • Fuel Burn: Lindqvist (1989) ice resistance R_ice = R_c + R_b + R_s scaled by engine specific fuel consumption.
                </div>
                <div>
                  • Result: Exploit natural flaw leads and avoid megaberg drift collision zones, achieving ~19.4% fuel reduction.
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  fetchDashboardSummary,
  fetchSICForecast,
  fetchIcebergTrack,
  optimizeRoute,
  fetchLiveVessels,
  triggerIcebergSync
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
import { SimpleNavigationPanel } from "../components/SimpleNavigationPanel";
import { MissionControlDock } from "../components/MissionControlDock";
import { MapInspectorPopup } from "../components/MapInspectorPopup";
import { VoyageBriefButton } from "../components/VoyageBriefButton";
import { IcebergInspectorModal } from "../components/IcebergInspectorModal";
import { CivilianGuideModal } from "../components/CivilianGuideModal";
import {
  Ship,
  Wind,
  Thermometer,
  Waves,
  FileCode,
  Clock,
  HelpCircle,
  Sparkles
} from "lucide-react";

export const Dashboard: React.FC = () => {
  const [summary, setSummary] = useState<DashboardSummary | null>(null);
  const [sicData, setSicData] = useState<SICForecastResponse | null>(null);
  const [selectedLeadDay, setSelectedLeadDay] = useState<number>(3);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);
  const playbackTimerRef = useRef<any>(null);

  // Layer toggles
  const [showSIC, setShowSIC] = useState<boolean>(true);
  const [showIcebergs, setShowIcebergs] = useState<boolean>(true);
  const [showRecommendedRoute, setShowRecommendedRoute] = useState<boolean>(true);
  const [showGreatCircle, setShowGreatCircle] = useState<boolean>(false);
  const [showVessels, setShowVessels] = useState<boolean>(true);

  // Live AIS vessel tracking
  const [liveVessels, setLiveVessels] = useState<LiveVessel[]>([]);
  const [vesselCount, setVesselCount] = useState<number>(0);

  // Active iceberg selection & track calculation
  const [selectedIceberg, setSelectedIceberg] = useState<Iceberg | null>(null);
  const [icebergTrackData, setIcebergTrackData] = useState<IcebergTrackResponse | null>(null);
  const [loadingIcebergTrack, setLoadingIcebergTrack] = useState<boolean>(false);
  const [isInspectorOpen, setIsInspectorOpen] = useState<boolean>(false);

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

  // Modals
  const [showArchDocs, setShowArchDocs] = useState<boolean>(false);
  const [showCivilianGuide, setShowCivilianGuide] = useState<boolean>(false);

  // Live UTC Clock
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
    return () => {
      cancelled = true;
      clearInterval(interval);
    };
  }, []);

  // Timeline scrubber playback loop
  useEffect(() => {
    if (isPlaying) {
      const intervalMs = Math.max(400, Math.round(1400 / playbackSpeed));
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
    vessel_class?: string;
    risk_weight?: number;
    selected_lead_day?: number;
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
      vessel_class: params.vessel_class || prev.vessel_class
    }));

    try {
      const result = await optimizeRoute({
        start_port: params.start_port,
        start_lat: params.start_lat,
        start_lon: params.start_lon,
        end_port: params.end_port,
        end_lat: params.end_lat,
        end_lon: params.end_lon,
        vessel_class: params.vessel_class || voyageParams.vessel_class,
        risk_weight: params.risk_weight ?? 0.65,
        selected_lead_day: params.selected_lead_day ?? selectedLeadDay
      });
      setRouteData(result);
    } catch (err) {
      console.error("Route optimization failed:", err);
    } finally {
      setLoadingRoute(false);
    }
  };

  const handleSyncTelemetry = async () => {
    const res = await triggerIcebergSync();
    try {
      const [freshSummary, freshSic] = await Promise.all([
        fetchDashboardSummary(),
        fetchSICForecast(7)
      ]);
      setSummary(freshSummary);
      setSicData(freshSic);
      if (selectedIceberg && freshSummary.icebergs) {
        const match = freshSummary.icebergs.find((b) => b.iceberg_id === selectedIceberg.iceberg_id);
        if (match) setSelectedIceberg(match);
      }
    } catch (e) {
      console.warn("Could not reload summary post-sync:", e);
    }
    return res;
  };

  const currentForecast = sicData?.forecasts?.find((f) => f.lead_day === selectedLeadDay);
  const currentCells = currentForecast?.grid_cells || sicData?.forecasts?.[0]?.grid_cells || [];

  return (
    <div className="relative w-screen h-screen overflow-hidden flex flex-col bg-[#EEF3F6] font-sans antialiased text-[#12202B]">
      {/* 1. CLEAN TOP HEADER */}
      <header className="h-12 bg-white/95 backdrop-blur-md border-b border-[#D7E1E8] px-4 flex items-center justify-between z-30 shrink-0 select-none shadow-xs">
        {/* Left: Brand Identity */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-[#0E7C93] flex items-center justify-center text-white text-base shadow-sm">
            ❄️
          </div>
          <div>
            <h1 className="font-bold text-sm text-[#12202B] leading-none flex items-center gap-1.5">
              <span>Antarctic Navigator</span>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-[#0E7C93]/10 text-[#0E7C93] font-semibold">
                MoES / NCPOR
              </span>
            </h1>
            <p className="text-[10px] text-[#57707E] font-medium mt-0.5 hidden sm:block">
              Sea-Ice & Iceberg Trajectory Optimization DSS
            </p>
          </div>
        </div>

        {/* Center: Live Environmental Status */}
        <div className="hidden lg:flex items-center gap-4 text-xs font-mono bg-[#EFF4F7] px-3 py-1 rounded-full border border-[#D7E1E8]">
          <div className="flex items-center gap-1.5 text-[#059669] font-bold">
            <span className="w-2 h-2 rounded-full bg-[#059669] animate-pulse" />
            <span>SATELLITE LIVE</span>
          </div>
          <div className="w-px h-3 bg-[#D7E1E8]" />
          <div className="flex items-center gap-1 text-[#12202B]">
            <Thermometer className="w-3.5 h-3.5 text-[#0E7C93]" />
            <span>{summary?.environmental_conditions.air_temperature_celsius ?? -14.2}°C</span>
          </div>
          <div className="w-px h-3 bg-[#D7E1E8]" />
          <div className="flex items-center gap-1 text-[#12202B]">
            <Wind className="w-3.5 h-3.5 text-[#0E7C93]" />
            <span>{summary?.environmental_conditions.wind_speed_knots ?? 24.5} kts</span>
          </div>
          <div className="w-px h-3 bg-[#D7E1E8]" />
          <div className="flex items-center gap-1 text-[#57707E]">
            <Clock className="w-3.5 h-3.5" />
            <span>{utcTime}</span>
          </div>
        </div>

        {/* Right: Actions */}
        <div className="flex items-center gap-2">
          <VoyageBriefButton
            routeData={routeData}
            selectedLeadDay={selectedLeadDay}
            vesselClass={voyageParams.vessel_class}
            startPort={voyageParams.start_port}
            endPort={voyageParams.end_port}
            departureDate={voyageParams.departure_date}
          />

          <button
            type="button"
            onClick={() => setShowCivilianGuide(true)}
            className="px-3 py-1.5 rounded-lg bg-[#EFF4F7] hover:bg-[#D7E1E8] text-[#12202B] text-xs font-medium flex items-center gap-1.5 transition cursor-pointer"
            title="Learn how Antarctic route optimization works"
          >
            <HelpCircle className="w-3.5 h-3.5 text-[#0E7C93]" />
            <span className="hidden sm:inline">Guide</span>
          </button>

          <button
            type="button"
            onClick={() => setShowArchDocs(true)}
            className="p-1.5 rounded-lg text-[#57707E] hover:text-[#12202B] hover:bg-[#EFF4F7] transition cursor-pointer"
            title="System Specifications & Math Models"
          >
            <FileCode className="w-4 h-4" />
          </button>
        </div>
      </header>

      {/* 2. FULL-BLEED INTERACTIVE MAP */}
      <div className="relative flex-1 w-full h-full overflow-hidden">
        <MapView
          sicCells={currentCells}
          sicOpacity={0.78}
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
          uiMode="civilian"
        />

        {/* 3. FLOATING ROUTE PLANNER (TOP-LEFT) */}
        <SimpleNavigationPanel
          voyageParams={voyageParams}
          onOptimizeRoute={handleOptimizeRoute}
          loadingRoute={loadingRoute}
          routeData={routeData}
          selectedLeadDay={selectedLeadDay}
          onSyncTelemetry={handleSyncTelemetry}
        />

        {/* 4. MAP INSPECTOR POPUP (ON MAP CLICK) */}
        {inspectorData && (
          <MapInspectorPopup
            data={inspectorData}
            onClose={() => setInspectorData(null)}
            uiMode="civilian"
            docked={false}
          />
        )}

        {/* 5. SLIM UNIFIED BOTTOM MISSION DOCK */}
        <div className="absolute bottom-3 left-1/2 -translate-x-1/2 z-[450] w-[96%] max-w-5xl pointer-events-auto">
          <MissionControlDock
            routeData={routeData}
            selectedLeadDay={selectedLeadDay}
            onSelectLeadDay={(d) => {
              setSelectedLeadDay(d);
              if (routeData) {
                handleOptimizeRoute({
                  start_port: voyageParams.start_port,
                  start_lat: voyageParams.start_lat,
                  start_lon: voyageParams.start_lon,
                  end_port: voyageParams.end_port,
                  end_lat: voyageParams.end_lat,
                  end_lon: voyageParams.end_lon,
                  vessel_class: voyageParams.vessel_class,
                  selected_lead_day: d
                });
              }
            }}
            isPlaying={isPlaying}
            onTogglePlay={() => setIsPlaying(!isPlaying)}
            playbackSpeed={playbackSpeed}
            onSpeedChange={(spd) => setPlaybackSpeed(spd)}
            onStepBackward={() => setSelectedLeadDay((prev) => Math.max(0, prev - 1))}
            onStepForward={() => setSelectedLeadDay((prev) => Math.min(7, prev + 1))}
            showSIC={showSIC}
            onToggleSIC={() => setShowSIC(!showSIC)}
            showIcebergs={showIcebergs}
            onToggleIcebergs={() => setShowIcebergs(!showIcebergs)}
            showVessels={showVessels}
            onToggleVessels={() => setShowVessels(!showVessels)}
            showRecommendedRoute={showRecommendedRoute}
            onToggleRecommendedRoute={() => setShowRecommendedRoute(!showRecommendedRoute)}
          />
        </div>
      </div>

      {/* 6. MODALS */}
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
        <div className="fixed inset-0 z-[1300] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <div className="bg-white rounded-2xl border border-[#D7E1E8] w-full max-w-2xl max-h-[85vh] overflow-hidden flex flex-col shadow-2xl">
            <div className="p-4 border-b border-[#D7E1E8] flex items-center justify-between bg-[#F8FAFC]">
              <div className="flex items-center gap-2">
                <FileCode className="w-5 h-5 text-[#0E7C93]" />
                <h3 className="font-bold text-sm text-[#12202B]">
                  System Architecture & Mathematics
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowArchDocs(false)}
                className="px-3 py-1 rounded-lg bg-white border border-[#D7E1E8] text-xs font-medium hover:bg-[#EFF4F7] cursor-pointer"
              >
                Close
              </button>
            </div>

            <div className="p-5 overflow-y-auto space-y-4 text-xs leading-relaxed text-[#57707E]">
              <div className="p-3 bg-[#EFF4F7] rounded-xl border border-[#D7E1E8]">
                <strong className="text-[#0E7C93] block mb-1">1. Sea-Ice Concentration Forecast (ConvLSTM)</strong>
                Uses satellite radar imagery + ERA5 polar wind and temperature data to predict 7-day ice concentration and channel openings.
              </div>
              <div className="p-3 bg-[#EFF4F7] rounded-xl border border-[#D7E1E8]">
                <strong className="text-[#A9700F] block mb-1">2. Iceberg Drift Trajectory (Bigg et al. ODE)</strong>
                Integrates wind drag, ocean currents, and Coriolis deflection to calculate the 72-hour future motion cone of giant megabergs.
              </div>
              <div className="p-3 bg-[#EFF4F7] rounded-xl border border-[#D7E1E8]">
                <strong className="text-[#059669] block mb-1">3. Polar A* Route Optimizer</strong>
                Calculates the safest, lowest-fuel path avoiding ice compaction zones and megaberg collision envelopes.
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

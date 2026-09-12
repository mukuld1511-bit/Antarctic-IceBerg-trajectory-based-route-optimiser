import React, { useEffect, useRef, useState } from "react";
import L from "leaflet";
import { SICCell, Iceberg, IcebergTrackResponse, RouteResponse, PolarStation, MapInspectionData, LiveVessel } from "../types";
import { getSICColor } from "./SICHeatmapLayer";
import { CompassRose } from "./CompassRose";
import { generateRealisticIcebergSVG } from "./RealisticIcebergRenderer";
import { OrganicSeaIceLayer } from "./OrganicSeaIceLayer";

// Risk color scale & design tokens — see docs/DESIGN_SYSTEM.md

interface MapViewProps {
  sicCells: SICCell[];
  sicOpacity: number;
  showSIC: boolean;
  icebergs: Iceberg[];
  selectedIcebergTrack: IcebergTrackResponse | null;
  showIcebergs: boolean;
  onSelectIceberg: (berg: Iceberg) => void;
  routeData: RouteResponse | null;
  showRecommendedRoute: boolean;
  showGreatCircle: boolean;
  stations: PolarStation[];
  currentLeadDay: number;
  onInspectPoint?: (data: MapInspectionData) => void;
  liveVessels?: LiveVessel[];
  showVessels?: boolean;
  startPort?: string;
  endPort?: string;
  selectedIceberg?: Iceberg | null;
  isPlaying?: boolean;
  uiMode?: "naval" | "civilian";
}

export const MapView: React.FC<MapViewProps> = ({
  sicCells,
  sicOpacity,
  showSIC,
  icebergs,
  selectedIcebergTrack,
  showIcebergs,
  onSelectIceberg,
  routeData,
  showRecommendedRoute,
  showGreatCircle,
  stations,
  currentLeadDay,
  onInspectPoint,
  liveVessels = [],
  showVessels = true,
  startPort,
  endPort,
  selectedIceberg,
  isPlaying = false,
  uiMode = "naval" as "naval" | "civilian"
}) => {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapRef = useRef<L.Map | null>(null);

  // Auto-camera glide when selectedIceberg changes
  const prevSelectedBergIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (!mapRef.current || !selectedIceberg) return;
    if (selectedIceberg.iceberg_id !== prevSelectedBergIdRef.current) {
      prevSelectedBergIdRef.current = selectedIceberg.iceberg_id;
      mapRef.current.flyTo([selectedIceberg.current_lat, selectedIceberg.current_lon], 5.8, {
        duration: 1.2
      });
    }
  }, [selectedIceberg]);

  // Layer groups for dynamic updating
  const sicLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const icebergLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const routeLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const stationsLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const vesselLayerGroupRef = useRef<L.LayerGroup | null>(null);
  const canvasRendererRef = useRef<L.Canvas | null>(null);
  const organicIceLayerRef = useRef<OrganicSeaIceLayer | null>(null);

  // Viewport bounds for vessel culling — updated on map pan/zoom
  const [mapBounds, setMapBounds] = useState<L.LatLngBounds | null>(null);
  const [showCameraPresets, setShowCameraPresets] = useState<boolean>(false);

  // Track animation state for drawing polyline
  const animatedRouteLineRef = useRef<L.Polyline | null>(null);
  const animationTimerRef = useRef<any>(null);

  // Use refs for click handler data so the map init effect runs only once
  const onInspectPointRef = useRef(onInspectPoint);
  const sicCellsRef = useRef(sicCells);
  const icebergsRef = useRef(icebergs);
  const currentLeadDayRef = useRef(currentLeadDay);

  // Keep refs in sync with latest props
  useEffect(() => { onInspectPointRef.current = onInspectPoint; }, [onInspectPoint]);
  useEffect(() => { sicCellsRef.current = sicCells; }, [sicCells]);
  useEffect(() => { icebergsRef.current = icebergs; }, [icebergs]);
  useEffect(() => { currentLeadDayRef.current = currentLeadDay; }, [currentLeadDay]);

  // Initialize Map (runs only once)
  useEffect(() => {
    if (!mapContainerRef.current || mapRef.current) return;

    // Center on South Atlantic / Weddell Sea Antarctic transit corridor
    const map = L.map(mapContainerRef.current, {
      center: [-59.5, 8.0],
      zoom: 3.5,
      minZoom: 2,
      maxZoom: 10,
      zoomControl: false,
      attributionControl: false
    });

    L.control.zoom({ position: "bottomright" }).addTo(map);

    // OpenStreetMap basemap (free, no API key required)
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      subdomains: "abc",
      maxZoom: 19
    }).addTo(map);

    // Initialize Organic Sea-Ice Layer (continuous satellite field)
    organicIceLayerRef.current = new OrganicSeaIceLayer(map);
    organicIceLayerRef.current.attach();

    // Create Layer Groups
    sicLayerGroupRef.current = L.layerGroup().addTo(map);
    icebergLayerGroupRef.current = L.layerGroup().addTo(map);
    routeLayerGroupRef.current = L.layerGroup().addTo(map);
    stationsLayerGroupRef.current = L.layerGroup().addTo(map);
    vesselLayerGroupRef.current = L.layerGroup().addTo(map);
    canvasRendererRef.current = L.canvas({ padding: 0.5 });

    // Update viewport bounds for vessel culling on pan/zoom
    const updateBounds = () => setMapBounds(map.getBounds());
    map.on("moveend", updateBounds);
    map.on("zoomend", updateBounds);
    // Set initial bounds
    setMapBounds(map.getBounds());

    // Map Click Inspector Event — reads latest values from refs
    map.on("click", (e: L.LeafletMouseEvent) => {
      if (!onInspectPointRef.current) return;
      const clickLat = e.latlng.lat;
      const clickLon = e.latlng.lng;

      // 1. Sample SIC at point from current cells
      let sampledSic = 0.0;
      let minCellDist = 999.0;
      if (Array.isArray(sicCellsRef.current)) {
        sicCellsRef.current.forEach((c) => {
          const d = Math.hypot(c.lat - clickLat, (c.lon - clickLon) * Math.cos((clickLat * Math.PI) / 180));
          if (d < minCellDist) {
            minCellDist = d;
            sampledSic = c.sic;
          }
        });
      }
      if (minCellDist > 2.0) sampledSic = 0.0; // Open water far from pack ice

      // 2. Find nearest iceberg
      let nearestBergName = "None in vicinity";
      let nearestBergDistNm = 999.0;
      let nearestUncertaintyKm = 1.5 + currentLeadDayRef.current * 6.8;

      if (Array.isArray(icebergsRef.current)) {
        icebergsRef.current.forEach((b) => {
          const latDiff = (b.current_lat - clickLat) * 60;
          const lonDiff = (b.current_lon - clickLon) * 60 * Math.cos((clickLat * Math.PI) / 180);
          const distNm = Math.hypot(latDiff, lonDiff);
          if (distNm < nearestBergDistNm) {
            nearestBergDistNm = distNm;
            nearestBergName = `${b.iceberg_id} (${b.name})`;
          }
        });
      }

      // 3. Estimate Physical Risk according to risk_scorer.py
      // risk = 0.55 * (sic ** 1.3) + 0.35 * iceberg_density + 0.10 * bathymetry_penalty
      const bergDensityFactor = Math.max(0, 1.0 - nearestBergDistNm / 45.0);
      const isContinentalShelf = clickLat < -68.5;
      const bathymetryM = isContinentalShelf ? 480 : 3850;
      const bathyPenalty = isContinentalShelf ? 0.25 : 0.05;

      const rawRisk =
        0.55 * Math.pow(sampledSic, 1.3) +
        0.35 * bergDensityFactor +
        0.10 * bathyPenalty;
      const computedRisk = Math.min(1.0, Math.max(0.01, Math.round(rawRisk * 1000) / 1000));

      const riskCategory: "SAFE" | "CAUTION" | "HIGH_RISK" =
        computedRisk >= 0.65 ? "HIGH_RISK" : computedRisk >= 0.3 ? "CAUTION" : "SAFE";

      onInspectPointRef.current({
        lat: clickLat,
        lon: clickLon,
        sic: Math.round(sampledSic * 100) / 100,
        iceberg_proximity_nm: nearestBergDistNm === 999 ? 120.0 : Math.round(nearestBergDistNm * 10) / 10,
        nearest_iceberg_name: nearestBergName,
        nearest_iceberg_uncertainty_km: Math.round(nearestUncertaintyKm * 10) / 10,
        wind_speed_knots: Math.round((18.5 + (Math.abs(clickLat) - 60) * 0.8) * 10) / 10,
        wave_height_m: Math.round((2.5 + (70 - Math.abs(clickLat)) * 0.12) * 10) / 10,
        computed_risk: computedRisk,
        risk_category: riskCategory,
        bathymetry_depth_m: bathymetryM
      });
    });

    mapRef.current = map;

    return () => {
      if (animationTimerRef.current) clearInterval(animationTimerRef.current);
      map.remove();
      mapRef.current = null;
    };
  }, []); // empty deps — map initializes only once

  // Update Polar Stations & Expedition Bases
  useEffect(() => {
    if (!mapRef.current || !stationsLayerGroupRef.current) return;
    const group = stationsLayerGroupRef.current;
    group.clearLayers();

    if (!Array.isArray(stations)) return;

    stations.forEach((st) => {
      if (!st || typeof st.lat !== "number" || isNaN(st.lat) || typeof st.lon !== "number" || isNaN(st.lon)) return;

      const isMaitriOrBharati = st.id === "maitri" || st.id === "bharati";
      const isPort = st.id === "cape_town" || st.id === "punta_arenas";

      const iconHtml = `
        <div class="relative flex items-center justify-center">
          <div class="w-3 h-3 rounded-full ${
            isMaitriOrBharati
              ? "bg-[#059669] ring-4 ring-[#059669]/30"
              : isPort
              ? "bg-[#0E7C93] ring-4 ring-[#0E7C93]/30"
              : "bg-[#57707E]/70 ring-1 ring-[#57707E]/20"
          } shadow-sm"></div>
          ${
            isMaitriOrBharati || isPort
              ? `<div class="absolute -top-5 whitespace-nowrap px-1.5 py-0.5 rounded bg-[#FFFFFF]/95 border border-[#D7E1E8] text-[9px] font-mono font-bold text-[#12202B] pointer-events-none shadow-xs">
                  ${st.name}
                </div>`
              : ""
          }
        </div>
      `;

      const customIcon = L.divIcon({
        html: iconHtml,
        className: "custom-station-pin",
        iconSize: [16, 16],
        iconAnchor: [8, 8]
      });

      const marker = L.marker([st.lat, st.lon], { icon: customIcon });
      marker.bindPopup(`
        <div class="bg-[#FFFFFF] text-[#12202B] p-2.5 text-xs rounded border border-[#D7E1E8] font-sans">
          <strong class="text-[#12202B] block font-bold text-sm">${st.name}</strong>
          <span class="text-[#57707E] text-[11px] block">${st.agency || st.country}</span>
          <span class="font-mono text-[#0E7C93] mt-1 block">${Math.abs(st.lat).toFixed(2)}°S, ${Math.abs(st.lon).toFixed(2)}°${st.lon >= 0 ? "E" : "W"}</span>
          <span class="mt-1.5 inline-block px-1.5 py-0.5 rounded font-mono text-[10px] font-bold ${
            isMaitriOrBharati ? "bg-[#059669]/20 text-[#059669] border border-[#059669]/40" : "bg-[#0E7C93]/20 text-[#0E7C93]"
          }">${st.status || "OPERATIONAL"}</span>
        </div>
      `);
      marker.addTo(group);
    });
  }, [stations]);

  // Update Live Vessel Markers (AIS) — Canvas-rendered for performance
  useEffect(() => {
    if (!mapRef.current || !vesselLayerGroupRef.current) return;
    const group = vesselLayerGroupRef.current;
    group.clearLayers();

    if (!showVessels || !Array.isArray(liveVessels) || liveVessels.length === 0) return;

    const map = mapRef.current;
    const bounds = mapBounds || map.getBounds();
    const MAX_RENDER = 1500; // cap to keep canvas snappy

    // Ship type color mapping
    function getVesselColor(shipType: number): string {
      if (shipType >= 70 && shipType <= 79) return "#2563EB"; // Cargo
      if (shipType >= 80 && shipType <= 89) return "#EA580C"; // Tanker
      if (shipType >= 60 && shipType <= 69) return "#059669"; // Passenger
      if (shipType >= 40 && shipType <= 49) return "#7C3AED"; // High-speed craft
      if (shipType >= 30 && shipType <= 39) return "#0891B2"; // Fishing
      if (shipType >= 50 && shipType <= 59) return "#DC2626"; // SAR/Military
      return "#6B7280"; // Other
    }

    function getVesselTypeName(shipType: number): string {
      if (shipType >= 70 && shipType <= 79) return "Cargo";
      if (shipType >= 80 && shipType <= 89) return "Tanker";
      if (shipType >= 60 && shipType <= 69) return "Passenger";
      if (shipType >= 40 && shipType <= 49) return "High-Speed Craft";
      if (shipType >= 30 && shipType <= 39) return "Fishing";
      if (shipType >= 50 && shipType <= 59) return "SAR/Military";
      return "Vessel";
    }

    // Viewport-cull: only render vessels inside current map bounds
    let rendered = 0;
    for (const v of liveVessels) {
      if (rendered >= MAX_RENDER) break;
      if (typeof v.lat !== "number" || typeof v.lon !== "number") continue;
      if (v.lat === 0 && v.lon === 0) continue;
      if (!bounds.contains([v.lat, v.lon])) continue;

      const heading = v.heading || v.cog || 0;
      const isResearchOrIcebreaker = (v as any).polarClass?.includes("PC") || v.shipType === 55 || v.name.includes("RATNA") || v.name.includes("AGULHAS") || v.name.includes("POLARSTERN") || v.name.includes("ATTENBOROUGH") || v.name.includes("FEDOROV") || v.name.includes("SHIRASE") || v.name.includes("ASTROLABE");
      const isSar = v.shipType === 50 || v.name.includes("SAR");
      const vesselColor = isResearchOrIcebreaker ? "#00F0FF" : isSar ? "#EF4444" : getVesselColor(v.shipType);
      const typeName = getVesselTypeName(v.shipType);
      const flagStr = (v as any).flag ? `${(v as any).flag}` : "";
      const polarClassStr = (v as any).polarClass || (isResearchOrIcebreaker ? "PC-4 (Polar Research Icebreaker)" : typeName);
      const sourceStr = (v as any).source || "Satellite AIS";
      const destStr = (v as any).destination || "Southern Ocean Transit";

      const iconHtml = `
        <div style="position: relative; width: 26px; height: 26px; display: flex; align-items: center; justify-content: center; cursor: pointer; transform: translate(-50%, -50%);">
          <!-- Directional Nautical Vessel Hull with True Heading Alignment -->
          <svg width="26" height="26" viewBox="0 0 26 26" style="transform: rotate(${heading}deg); overflow: visible; filter: drop-shadow(0 2px 4px rgba(0,0,0,0.6));">
            <!-- Forward Velocity Course Vector -->
            <line x1="13" y1="3" x2="13" y2="-9" stroke="${vesselColor}" stroke-width="2.0" stroke-linecap="round" />
            <!-- Streamlined Polar Hull -->
            <polygon points="13,2 20,10 18.5,23 7.5,23 6,10" fill="${vesselColor}" stroke="#FFFFFF" stroke-width="1.3" />
            <!-- Bridge Conning Island -->
            <rect x="10.5" y="12" width="5" height="7" fill="#0F172A" rx="1" />
          </svg>
          <!-- Tactical Polar Vessel Callsign Tag -->
          <div style="position: absolute; top: 24px; left: 50%; transform: translateX(-50%); white-space: nowrap; font-family: 'JetBrains Mono', monospace; font-size: 8px; font-weight: 700; color: #FFFFFF; background: rgba(15, 23, 42, 0.90); border: 1px solid ${vesselColor}; border-radius: 2px; padding: 0 3px; pointer-events: none; box-shadow: 0 2px 4px rgba(0,0,0,0.5);">
            ${(v as any).callsign || v.name.substring(0, 9)}
          </div>
        </div>
      `;

      const customShipIcon = L.divIcon({
        html: iconHtml,
        className: "custom-polar-ship-marker",
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([v.lat, v.lon], { icon: customShipIcon, zIndexOffset: 300 });

      marker.bindPopup(`
        <div style="font-family: -apple-system, system-ui, sans-serif; font-size: 12px; min-width: 220px; padding: 6px; background: #0F172A; color: #F8FAFC; border-radius: 4px; border: 1px solid ${vesselColor};">
          <div style="display: flex; align-items: center; justify-content: space-between; border-b: 1px solid #334155; padding-bottom: 4px; margin-bottom: 6px;">
            <div style="font-weight: 800; font-size: 13px; color: ${vesselColor};">${v.name || "UNKNOWN"}</div>
            <span style="font-size: 10px; color: #94A3B8; font-family: monospace;">${flagStr}</span>
          </div>
          <div style="display: inline-block; font-size: 10px; background: ${vesselColor}22; color: ${vesselColor}; border: 1px solid ${vesselColor}55; border-radius: 2px; padding: 1px 5px; font-weight: 600; margin-bottom: 6px;">
            ${polarClassStr}
          </div>
          <table style="width: 100%; font-size: 11px; font-family: monospace; border-collapse: collapse; margin-bottom: 6px;">
            <tr><td style="color: #94A3B8; padding: 2px 0;">MMSI</td><td style="color: #F8FAFC; text-align: right;">${v.mmsi}</td></tr>
            <tr><td style="color: #94A3B8; padding: 2px 0;">SOG (Speed)</td><td style="color: #38BDF8; font-weight: bold; text-align: right;">${v.sog.toFixed(1)} kts</td></tr>
            <tr><td style="color: #94A3B8; padding: 2px 0;">COG / HDG</td><td style="color: #F8FAFC; text-align: right;">${v.cog.toFixed(0)}° / ${heading > 0 ? heading.toFixed(0) + "°" : "N/A"}</td></tr>
            <tr><td style="color: #94A3B8; padding: 2px 0;">COORDINATES</td><td style="color: #00F0FF; text-align: right;">${Math.abs(v.lat).toFixed(2)}°S, ${Math.abs(v.lon).toFixed(2)}°${v.lon >= 0 ? "E" : "W"}</td></tr>
            <tr><td style="color: #94A3B8; padding: 2px 0;">DESTINATION</td><td style="color: #F8FAFC; text-align: right;">${destStr}</td></tr>
            <tr><td style="color: #94A3B8; padding: 2px 0;">TRACK SENSOR</td><td style="color: #A7F3D0; font-size: 10px; text-align: right;">${sourceStr}</td></tr>
          </table>
          <div style="font-size: 9px; color: #64748B; text-align: right; border-top: 1px solid #1E293B; padding-top: 3px;">Telemetry synced: ${new Date(v.lastUpdate).toLocaleTimeString()}</div>
        </div>
      `);
      marker.addTo(group);
      rendered++;
    }
  }, [liveVessels, showVessels, mapBounds]);

  // Update Organic SIC Canvas Layer + Interactive Tooltip Targets
  useEffect(() => {
    // 1. Update satellite-style continuous canvas layer
    if (organicIceLayerRef.current) {
      organicIceLayerRef.current.updateData(sicCells, sicOpacity, showSIC);
    }

    // 2. Interactive hit targets for tooltips (completely transparent, no blocky rectangles)
    if (!mapRef.current || !sicLayerGroupRef.current) return;
    const group = sicLayerGroupRef.current;
    group.clearLayers();

    if (!showSIC || !Array.isArray(sicCells) || sicCells.length === 0) return;

    sicCells.forEach((cell) => {
      if (!cell || typeof cell.lat !== "number" || isNaN(cell.lat) || typeof cell.lon !== "number" || isNaN(cell.lon)) return;
      if (cell.sic < 0.12) return;

      const halfLat = 0.5;
      const halfLon = 1.25;
      const bounds: L.LatLngBoundsExpression = [
        [cell.lat - halfLat, cell.lon - halfLon],
        [cell.lat + halfLat, cell.lon + halfLon]
      ];

      // Invisible rectangle solely for hover inspection
      const rect = L.rectangle(bounds, {
        color: "transparent",
        weight: 0,
        fillColor: "transparent",
        fillOpacity: 0
      });

      rect.bindTooltip(
        `<div class="text-[11px] font-mono p-1 bg-[#FFFFFF] text-[#12202B] border border-[#D7E1E8] shadow-md">
          <div>SIC: <strong class="text-[#0E7C93]">${(cell.sic * 100).toFixed(1)}%</strong></div>
          <div>Thick: <span class="text-[#57707E]">${cell.thickness_m}m</span></div>
          <div>Conf: <span class="text-[#57707E]">${(cell.confidence * 100).toFixed(0)}%</span></div>
        </div>`,
        { sticky: true, opacity: 0.95 }
      );

      rect.addTo(group);
    });
  }, [sicCells, sicOpacity, showSIC]);

  // Update Icebergs Layer with Dynamic Lead-Time Uncertainty Expansion & Directional Vectors
  useEffect(() => {
    if (!mapRef.current || !icebergLayerGroupRef.current) return;
    const group = icebergLayerGroupRef.current;
    group.clearLayers();

    if (!showIcebergs || !Array.isArray(icebergs)) return;

    // Scale uncertainty with timeline scrubber lead day:
    const uncertaintyScaleMultiplier = 1.0 + (currentLeadDay / 7.0) * 1.25;

    icebergs.forEach((berg) => {
      if (!berg || typeof berg.current_lat !== "number" || isNaN(berg.current_lat) || typeof berg.current_lon !== "number" || isNaN(berg.current_lon)) return;

      const isMegaberg = berg.size_class === "D";
      const isSelected = selectedIceberg?.iceberg_id === berg.iceberg_id;

      // Color scheme based on exact Stitch hazard tokens
      const hazardColor =
        berg.hazard_level === "CRITICAL"
          ? "#B23A2F"
          : berg.hazard_level === "HIGH"
          ? "#A9700F"
          : berg.hazard_level === "MODERATE"
          ? "#0E7C93"
          : "#059669";

      // Kinematic drift offset along current trajectory based on currentLeadDay:
      const driftHours = currentLeadDay * 24;
      const driftDistNM = (berg.drift_speed_knots || 1.1) * driftHours;
      const headingRad = ((berg.drift_heading_deg || 45) * Math.PI) / 180;
      const dLat = (driftDistNM * Math.cos(headingRad)) / 60;
      const meanLat = berg.current_lat + dLat / 2;
      const cosLat = Math.cos((meanLat * Math.PI) / 180);
      const dLon = (driftDistNM * Math.sin(headingRad)) / (60 * Math.max(0.15, cosLat));

      const activeLat = berg.current_lat + dLat;
      const activeLon = berg.current_lon + dLon;

      // If currentLeadDay > 0, draw the drifted wake trail from initial position to current active position
      if (currentLeadDay > 0) {
        const wakeLine = L.polyline(
          [[berg.current_lat, berg.current_lon], [activeLat, activeLon]],
          {
            color: hazardColor,
            weight: isSelected ? 2.5 : 1.5,
            opacity: 0.65,
            dashArray: "3, 6"
          }
        );
        wakeLine.bindTooltip(
          `<div class="text-[9px] font-mono px-1 py-0.5 bg-white text-[#12202B] border border-[#D7E1E8] shadow-sm">
            <strong>${berg.iceberg_id}</strong> CUMULATIVE DRIFT: +${driftDistNM.toFixed(1)} NM (D+${currentLeadDay})
          </div>`,
          { sticky: true }
        );
        wakeLine.addTo(group);

        // Subtle launch origin ghost mark
        const originMarker = L.polyline(
          [[berg.current_lat - 0.05, berg.current_lon], [berg.current_lat + 0.05, berg.current_lon]],
          { color: hazardColor, weight: 1, opacity: 0.4 }
        );
        originMarker.addTo(group);
      }

      // 1. Forward Kinematic Drift Sector Cone (No Circles! Directional hazard corridor)
      if (isSelected) {
        const coneDistDeg = 0.65 + (currentLeadDay / 7.0) * 0.45;
        const spreadRad = (18 * Math.PI) / 180;
        const cosL = Math.max(0.2, Math.cos((activeLat * Math.PI) / 180));
        const leftLat = activeLat + coneDistDeg * Math.cos(headingRad - spreadRad);
        const leftLon = activeLon + (coneDistDeg * Math.sin(headingRad - spreadRad)) / cosL;
        const rightLat = activeLat + coneDistDeg * Math.cos(headingRad + spreadRad);
        const rightLon = activeLon + (coneDistDeg * Math.sin(headingRad + spreadRad)) / cosL;

        const forwardCone = L.polygon(
          [[activeLat, activeLon], [leftLat, leftLon], [rightLat, rightLon]],
          {
            color: hazardColor,
            weight: 1.5,
            dashArray: "4, 4",
            fillColor: hazardColor,
            fillOpacity: 0.14
          }
        );
        forwardCone.bindTooltip(
          `<div class="text-[10px] font-mono p-1 bg-[#FFFFFF] text-[#12202B] border border-[#D7E1E8] rounded-none shadow">
            <div class="font-bold text-[${hazardColor}]">▲ DRIFT CORRIDOR: ${berg.iceberg_id}</div>
            <div class="text-[9px] text-[#57707E]">Directional Forward Sector (D+${currentLeadDay})</div>
          </div>`,
          { sticky: true }
        );
        forwardCone.addTo(group);
      }

      // 2. Drift Direction Heading Vector (showing real drift course & velocity)
      const arrowLenDeg = 0.25 + Math.min(0.35, ((berg.drift_speed_knots || 1.0) / 2.0) * 0.25);
      const headingEndLat = activeLat + arrowLenDeg * Math.cos(headingRad);
      const headingEndLon = activeLon + (arrowLenDeg * Math.sin(headingRad)) / Math.max(0.2, Math.cos((activeLat * Math.PI) / 180));

      const driftVectorLine = L.polyline(
        [[activeLat, activeLon], [headingEndLat, headingEndLon]],
        {
          color: hazardColor,
          weight: isSelected ? 2.5 : 1.4,
          opacity: isSelected ? 0.95 : 0.45,
          dashArray: isSelected ? "4, 3" : "3, 5"
        }
      );
      driftVectorLine.addTo(group);

      // 3. Realistic Procedural Faceted Glacial Iceberg Graphic (No emojis)
      const iconHtml = generateRealisticIcebergSVG({
        berg,
        isSelected,
        isPlaying,
        uiMode,
        driftDistNM
      });

      const bergIcon = L.divIcon({
        html: iconHtml,
        className: "custom-iceberg-pin",
        iconSize: [0, 0],
        iconAnchor: [0, 0]
      });

      const marker = L.marker([activeLat, activeLon], { icon: bergIcon, zIndexOffset: isSelected ? 500 : 200 });
      marker.on("click", () => onSelectIceberg(berg));

      if (uiMode === "civilian") {
        marker.bindTooltip(
          `<div class="text-xs font-sans p-2.5 bg-[#FFFFFF] text-[#12202B] rounded-lg border border-[#D7E1E8] shadow-xl min-w-[210px]">
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-[#D7E1E8]">
              <strong class="text-[${hazardColor}] font-bold text-sm">${berg.name || berg.iceberg_id}</strong>
              <span class="px-2 py-0.5 rounded-full text-[10px] font-semibold text-white bg-[${hazardColor}]">
                ${berg.hazard_level === 'CRITICAL' ? '⚠️ High Attention' : berg.hazard_level === 'HIGH' ? 'Caution' : 'Safe Distance'}
              </span>
            </div>
            <div class="text-[11px] text-[#57707E] mb-2 leading-relaxed">
              ${isMegaberg ? 'Massive Antarctic ice island larger than many world cities.' : 'Free-floating glacial ice block drifting with ocean currents.'}
            </div>
            <div class="space-y-1 text-[11px] text-[#12202B]">
              <div>📏 Size: <strong>${(berg.length_m / 1000).toFixed(1)} km long × ${(berg.width_m / 1000).toFixed(1)} km wide</strong></div>
              <div>🏔️ Height above water: <strong>${berg.sail_height_m} meters (~${Math.round(berg.sail_height_m / 3)} stories)</strong></div>
              <div>🌊 Underwater depth: <strong>${berg.draft_m} meters</strong> (90% hidden below surface)</div>
              <div>🧭 Drifting at: <strong>${(berg.drift_speed_knots * 1.852).toFixed(1)} km/h</strong></div>
            </div>
            <div class="mt-2 text-[10px] text-[#0E7C93] font-medium bg-[#F0F9FD] p-1.5 rounded border border-[#BAE6FD]">
              👆 Click to view 3-day path and iceberg details
            </div>
          </div>`,
          { sticky: true }
        );
      } else {
        marker.bindTooltip(
          `<div class="text-xs font-sans p-2.5 bg-[#FFFFFF] text-[#12202B] rounded-none border border-[#D7E1E8] shadow-2xl min-w-[210px]">
            <div class="flex items-center justify-between pb-1 mb-1 border-b border-[#D7E1E8]">
              <strong class="text-[${hazardColor}] font-mono text-sm font-bold">${berg.iceberg_id}</strong>
              <span class="px-1.5 py-0.2 rounded-none text-[9px] font-bold text-white bg-[${hazardColor}]">${berg.hazard_level}</span>
            </div>
            <div class="text-[11px] font-semibold text-[#12202B] mb-1">${berg.name}</div>
            <div class="grid grid-cols-2 gap-1 text-[10px] font-mono text-[#57707E]">
              <div>Dimensions: <strong class="text-[#12202B]">${(berg.length_m / 1000).toFixed(1)}×${(berg.width_m / 1000).toFixed(1)} km</strong></div>
              <div>Freeboard: <strong class="text-[#12202B]">${berg.sail_height_m}m</strong></div>
              <div>Draft: <strong class="text-[#12202B]">${berg.draft_m}m</strong></div>
              <div>Speed: <strong class="text-[#12202B]">${berg.drift_speed_knots} kts</strong></div>
              <div class="col-span-2 text-brass font-bold">Total Drift (D+${currentLeadDay}): +${driftDistNM.toFixed(1)} NM</div>
            </div>
            <div class="mt-1.5 text-[9px] text-brass font-mono bg-[#EFF4F7] p-1 border border-[#D7E1E8]">
              Click to inspect Bigg et al. ODE Force Balance & 72h Track
            </div>
          </div>`,
          { sticky: true }
        );
      }

      marker.addTo(group);
    });

    // Render Selected Iceberg 72h Trajectory + Expanding Uncertainty Cones + Milestone Pins
    if (selectedIcebergTrack && Array.isArray(selectedIcebergTrack.trajectory) && selectedIcebergTrack.trajectory.length > 0) {
      const validTraj = selectedIcebergTrack.trajectory.filter(
        (pt) => pt && typeof pt.lat === "number" && !isNaN(pt.lat) && typeof pt.lon === "number" && !isNaN(pt.lon)
      );

      if (validTraj.length > 0) {
        const latlngs: L.LatLngExpression[] = validTraj.map((pt) => [pt.lat, pt.lon]);

        // Background subtle glow polyline
        const glowTrackLine = L.polyline(latlngs, {
          color: "#A9700F",
          weight: 6,
          opacity: 0.25
        });
        glowTrackLine.addTo(group);

        // Predicted Track Centerline
        const trackLine = L.polyline(latlngs, {
          color: "#A9700F",
          weight: 3,
          dashArray: "4, 6",
          opacity: 0.95
        });
        trackLine.addTo(group);

        // Conical Uncertainty Circles & Milestone Waypoints along the future path
        validTraj.forEach((pt, idx) => {
          const isMilestone = idx === 0 || idx === validTraj.length - 1 || idx % 4 === 0;

          if (idx % 2 === 0 || idx === validTraj.length - 1) {
            const baseRadiusKm = pt.uncertainty_radius_km || 5.0;
            const dynamicRadiusMeters = baseRadiusKm * uncertaintyScaleMultiplier * 1000.0;

            const coneCircle = L.circle([pt.lat, pt.lon], {
              radius: dynamicRadiusMeters,
              color: "#A9700F",
              weight: 1,
              fillColor: "#A9700F",
              fillOpacity: 0.06 + (idx / validTraj.length) * 0.12
            });

            coneCircle.bindTooltip(
              `<div class="text-[11px] font-mono p-1 bg-[#FFFFFF] text-[#12202B] border border-[#D7E1E8] rounded shadow">
                <div>Lead: <strong class="text-[#12202B]">${pt.timestamp}</strong></div>
                <div>Uncertainty Radius: <strong class="text-[#A9700F]">±${(baseRadiusKm * uncertaintyScaleMultiplier).toFixed(1)} km</strong></div>
                <div>ML Residual Offset: <strong class="text-[#059669]">+${pt.ml_residual_correction_km} km</strong></div>
              </div>`,
              { sticky: true }
            );

            coneCircle.addTo(group);
          }

          // Render Milestone Pins at key intervals (+12h, +24h, +48h, +72h)
          if (isMilestone && idx > 0) {
            const milestoneIcon = L.divIcon({
              html: `
                <div style="background:#FFFFFF; border:1.5px solid #A9700F; border-radius:4px; padding:1px 4px; font-family:monospace; font-size:8px; font-weight:bold; color:#A9700F; box-shadow:0 1px 6px rgba(0,0,0,0.25); white-space:nowrap; transform:translate(-50%, -50%);">
                  ⏱️ ${pt.timestamp}
                </div>
              `,
              className: "custom-iceberg-milestone",
              iconSize: [0, 0]
            });
            const milestoneMarker = L.marker([pt.lat, pt.lon], { icon: milestoneIcon, zIndexOffset: 300 });
            milestoneMarker.bindTooltip(
              `<div class="text-[11px] font-mono p-1.5 bg-[#FFFFFF] text-[#12202B] border border-[#D7E1E8] rounded shadow">
                <div>Forecast Step: <strong class="text-[#A9700F]">${pt.timestamp}</strong></div>
                <div>Coordinates: ${Math.abs(pt.lat).toFixed(2)}°S, ${Math.abs(pt.lon).toFixed(2)}°${pt.lon >= 0 ? 'E' : 'W'}</div>
                <div>Drift Speed: ${pt.drift_speed_knots} kts</div>
                <div>ML Residual Correction: +${pt.ml_residual_correction_km} km</div>
              </div>`,
              { sticky: true }
            );
            milestoneMarker.addTo(group);
          }
        });
      }
    }
  }, [icebergs, selectedIcebergTrack, showIcebergs, onSelectIceberg, currentLeadDay, selectedIceberg]);

  // Update Route Layers with Waypoint Drawing Animation
  useEffect(() => {
    if (!mapRef.current || !routeLayerGroupRef.current) return;
    const group = routeLayerGroupRef.current;
    group.clearLayers();

    if (animationTimerRef.current) {
      clearInterval(animationTimerRef.current);
      animationTimerRef.current = null;
    }

    if (!routeData) return;

    // 1. Naive Great-Circle Route (Dashed Muted Red Corridor)
    // See docs/DESIGN_SYSTEM.md: color-gc-route (#C4472F)
    if (showGreatCircle && Array.isArray(routeData.naive_great_circle_waypoints)) {
      const validGc = routeData.naive_great_circle_waypoints.filter(
        (wp) => wp && typeof wp.lat === "number" && !isNaN(wp.lat) && typeof wp.lon === "number" && !isNaN(wp.lon)
      );

      if (validGc.length > 0) {
        const gcCoords: L.LatLngExpression[] = validGc.map((wp) => [wp.lat, wp.lon]);

        const gcLine = L.polyline(gcCoords, {
          color: "#B23A2F",
          weight: 2.5,
          dashArray: "5, 7",
          opacity: 0.8
        });

        gcLine.bindTooltip(
          `<div class="text-xs font-sans p-2 bg-[#FFFFFF] text-[#12202B] border border-[#B23A2F]/40 shadow-xl">
            <strong class="text-[#B23A2F] block font-semibold">Naive Great-Circle Geodesic</strong>
            <span class="text-[11px] text-[#57707E] block">Direct geodesic cutting through compressive pack ice & megaberg drift stream.</span>
            <span class="text-[#12202B] font-mono text-[10px] block mt-1">Est. Fuel: ${routeData.comparison_vs_greatcircle?.great_circle_fuel_kg?.toLocaleString() ?? 0} kg</span>
          </div>`,
          { sticky: true }
        );

        gcLine.addTo(group);
      }
    }

    // 2. AI Recommended Optimal Route (Solid Glowing Cyan Line with Progressive Drawing Animation)
    // See docs/DESIGN_SYSTEM.md: color-safe-cyan (#0E7C93)
    if (showRecommendedRoute && Array.isArray(routeData.waypoints)) {
      const validRec = routeData.waypoints.filter(
        (wp) => wp && typeof wp.lat === "number" && !isNaN(wp.lat) && typeof wp.lon === "number" && !isNaN(wp.lon)
      );

      if (validRec.length > 0) {
        const fullCoords: L.LatLngExpression[] = validRec.map((wp) => [wp.lat, wp.lon]);

        // Background subtle glow polyline
        const glowLine = L.polyline(fullCoords, {
          color: "#0E7C93",
          weight: 6,
          opacity: 0.25
        });
        glowLine.addTo(group);

        // Animate the line drawing itself progressively along the path
        let currentStep = 1;
        const totalSteps = validRec.length;
        const animatedPolyline = L.polyline([fullCoords[0]], {
          color: "#0E7C93",
          weight: 3.5,
          opacity: 0.95
        });
        animatedPolyline.addTo(group);
        animatedRouteLineRef.current = animatedPolyline;

        animationTimerRef.current = setInterval(() => {
          if (currentStep <= totalSteps) {
            animatedPolyline.setLatLngs(fullCoords.slice(0, currentStep));
            currentStep++;
          } else {
            clearInterval(animationTimerRef.current);
            animationTimerRef.current = null;
          }
        }, 15);

        animatedPolyline.bindTooltip(
          `<div class="text-xs font-sans p-2 bg-[#FFFFFF] text-[#12202B] rounded border border-[#0E7C93]/50 shadow-xl">
            <strong class="text-[#0E7C93] block font-semibold">AI Recommended Polar A* Route</strong>
            <span class="text-[11px] text-[#57707E] block">Navigates open flaw leads and avoids conical iceberg drift zones.</span>
            <span class="text-[#059669] font-mono text-[10px] block mt-1">Fuel Saved: -${routeData.comparison_vs_greatcircle?.fuel_saved_pct ?? 0}%</span>
          </div>`,
          { sticky: true }
        );

        // Add milestone markers along recommended route
        validRec.forEach((wp, idx) => {
          if (idx === 0 || idx === validRec.length - 1 || idx % 2 === 0) {
            const riskColor =
              wp.iceberg_risk_score >= 0.65 ? "#B23A2F" : wp.iceberg_risk_score >= 0.3 ? "#A9700F" : "#0E7C93";

            const wpMarker = L.circleMarker([wp.lat, wp.lon], {
              radius: idx === 0 || idx === validRec.length - 1 ? 5 : 3.5,
              color: "#12202B",
              weight: 1.5,
              fillColor: riskColor,
              fillOpacity: 1
            });

            wpMarker.bindTooltip(
              `<div class="text-[11px] font-mono p-1.5 bg-[#FFFFFF] text-[#12202B] border border-[#D7E1E8] rounded shadow-lg">
                <div>Waypoint #${wp.step_index}</div>
                <div>Dist: ${wp.cumulative_distance_nm} NM</div>
                <div>Speed: ${wp.est_speed_knots} kts</div>
                <div>SIC: ${(wp.sic * 100).toFixed(0)}%</div>
                <div>Risk: <span style="color:${riskColor}">${wp.iceberg_risk_score.toFixed(2)}</span></div>
              </div>`,
              { sticky: true }
            );

            wpMarker.addTo(group);
          }
        });

        // Prominent Departure Port (Origin) Pin
        const originName = startPort || routeData.start_port || "Departure Port";
        const originIcon = L.divIcon({
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); pointer-events:auto; cursor:pointer;">
              <div style="background:#0E7C93; color:#fff; font-family:-apple-system, system-ui, sans-serif; font-size:10px; font-weight:700; padding:3px 8px; border-radius:5px; box-shadow:0 3px 10px rgba(0,0,0,0.35); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:4px;">
                <span style="font-size:12px;">⚓</span>
                <span>ORIGIN: ${originName}</span>
              </div>
              <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #0E7C93;"></div>
            </div>
          `,
          className: "custom-route-origin-pin",
          iconSize: [0, 0]
        });
        const originMarker = L.marker([validRec[0].lat, validRec[0].lon], { icon: originIcon, zIndexOffset: 1000 });
        originMarker.bindPopup(`
          <div style="font-family:sans-serif; font-size:12px; padding:4px;">
            <strong style="color:#0E7C93; font-size:13px; display:block;">${originName}</strong>
            <span style="color:#57707E; font-size:11px;">Expedition Departure Gateway Port</span>
            <div style="font-family:monospace; font-size:11px; margin-top:4px; color:#12202B;">
              ${Math.abs(validRec[0].lat).toFixed(2)}°S, ${Math.abs(validRec[0].lon).toFixed(2)}°${validRec[0].lon >= 0 ? "E" : "W"}
            </div>
          </div>
        `);
        originMarker.addTo(group);

        // Prominent Antarctic Destination (Arrival) Pin
        const destName = endPort || routeData.end_port || "Antarctic Destination";
        const destWp = validRec[validRec.length - 1];
        const destIcon = L.divIcon({
          html: `
            <div style="display:flex; flex-direction:column; align-items:center; transform: translate(-50%, -100%); pointer-events:auto; cursor:pointer;">
              <div style="background:#059669; color:#fff; font-family:-apple-system, system-ui, sans-serif; font-size:10px; font-weight:700; padding:3px 8px; border-radius:5px; box-shadow:0 3px 10px rgba(0,0,0,0.35); border:1.5px solid #fff; white-space:nowrap; display:flex; align-items:center; gap:4px;">
                <span style="font-size:12px;">🏁</span>
                <span>DESTINATION: ${destName}</span>
              </div>
              <div style="width:0; height:0; border-left:5px solid transparent; border-right:5px solid transparent; border-top:6px solid #059669;"></div>
            </div>
          `,
          className: "custom-route-dest-pin",
          iconSize: [0, 0]
        });
        const destMarker = L.marker([destWp.lat, destWp.lon], { icon: destIcon, zIndexOffset: 1000 });
        destMarker.bindPopup(`
          <div style="font-family:sans-serif; font-size:12px; padding:4px;">
            <strong style="color:#059669; font-size:13px; display:block;">${destName}</strong>
            <span style="color:#57707E; font-size:11px;">Mission Antarctic Destination</span>
            <div style="font-family:monospace; font-size:11px; margin-top:4px; color:#12202B;">
              ${Math.abs(destWp.lat).toFixed(2)}°S, ${Math.abs(destWp.lon).toFixed(2)}°${destWp.lon >= 0 ? "E" : "W"}
            </div>
          </div>
        `);
        destMarker.addTo(group);

        // Smoothly fit map bounds to display the full updated route with panel clearance
        if (mapRef.current && validRec.length > 1) {
          const routeBounds = L.latLngBounds(validRec.map((wp) => [wp.lat, wp.lon]));
          mapRef.current.flyToBounds(routeBounds, {
            paddingTopLeft: [360, 60],
            paddingBottomRight: [60, 190],
            maxZoom: 6,
            duration: 1.2
          });
        }
      }
    }
  }, [routeData, showRecommendedRoute, showGreatCircle, startPort, endPort]);

  // Camera Presets
  const handleZoomRoute = () => {
    if (!mapRef.current || !routeData?.waypoints?.length) return;
    const pts = routeData.waypoints.filter((w) => typeof w.lat === "number" && typeof w.lon === "number");
    if (pts.length > 1) {
      mapRef.current.flyToBounds(L.latLngBounds(pts.map((p) => [p.lat, p.lon])), {
        paddingTopLeft: [360, 60],
        paddingBottomRight: [60, 190],
        maxZoom: 6,
        duration: 1.0
      });
    }
  };

  const handleZoomWeddell = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([-68.5, -35.0], 4.5, { duration: 1.0 });
  };

  const handleZoomFullRoute = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([-56.0, 15.0], 3.2, { duration: 1.0 });
  };

  const handleZoomA23a = () => {
    if (!mapRef.current) return;
    mapRef.current.flyTo([-61.2, -48.5], 6.0, { duration: 1.0 });
  };

  return (
    <div className="relative w-full h-full bg-chart-bg overflow-hidden select-none">
      {/* Leaflet Map Div */}
      <div ref={mapContainerRef} className="w-full h-full z-0" />

      {/* Top-Right: Interactive Compass & Dismissible Camera Presets */}
      <div className="absolute top-3 right-3 z-[400] flex flex-col items-end gap-2 pointer-events-auto">
        {/* Sleek Interactive Compass Widget */}
        <CompassRose
          heading={0}
          onResetNorth={() => {
            handleZoomRoute();
          }}
        />

        {/* Camera Views Button */}
        <button
          type="button"
          onClick={() => setShowCameraPresets(!showCameraPresets)}
          className="px-2.5 py-1.5 rounded-xl bg-white/95 backdrop-blur-md shadow-md border border-[#D7E1E8] text-xs font-semibold text-[#12202B] hover:border-[#0E7C93] flex items-center gap-1.5 transition cursor-pointer"
          title="Map Camera Presets"
        >
          <span>📷</span>
          <span className="text-[11px] font-sans">Views</span>
        </button>

        {/* Dismissible Camera Presets Dropdown */}
        {showCameraPresets && (
          <div className="bg-white/95 backdrop-blur-md rounded-xl border border-[#D7E1E8] shadow-xl p-2 flex flex-col gap-1 w-40">
            <div className="flex items-center justify-between px-1 pb-1 border-b border-[#D7E1E8]/70 text-[10px] font-bold text-[#57707E] uppercase">
              <span>Camera Views</span>
              <button
                type="button"
                onClick={() => setShowCameraPresets(false)}
                className="text-[#57707E] hover:text-[#12202B] p-0.5 cursor-pointer"
                title="Close"
              >
                ✕
              </button>
            </div>
            <button
              type="button"
              onClick={() => { handleZoomRoute(); setShowCameraPresets(false); }}
              className="px-2.5 py-1.5 rounded-lg bg-[#0E7C93]/10 hover:bg-[#0E7C93] hover:text-white text-[#0E7C93] text-left text-xs font-semibold transition cursor-pointer"
            >
              🗺️ Route Focus
            </button>
            <button
              type="button"
              onClick={() => { handleZoomFullRoute(); setShowCameraPresets(false); }}
              className="px-2.5 py-1.5 rounded-lg hover:bg-[#EFF4F7] text-[#12202B] text-left text-xs transition cursor-pointer"
            >
              🌐 Full Ocean
            </button>
            <button
              type="button"
              onClick={() => { handleZoomWeddell(); setShowCameraPresets(false); }}
              className="px-2.5 py-1.5 rounded-lg hover:bg-[#EFF4F7] text-[#12202B] text-left text-xs transition cursor-pointer"
            >
              🌊 Weddell Sea
            </button>
            <button
              type="button"
              onClick={() => { handleZoomA23a(); setShowCameraPresets(false); }}
              className="px-2.5 py-1.5 rounded-lg hover:bg-[#EFF4F7] text-[#A9700F] text-left text-xs font-medium transition cursor-pointer"
            >
              🏔️ A-23a Megaberg
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

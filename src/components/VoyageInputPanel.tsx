import React, { useState, useEffect } from "react";
import { Ship, Anchor, Navigation, Calendar, Loader2, Play, Globe } from "lucide-react";

// Risk color scale & design tokens — see docs/DESIGN_SYSTEM.md

export interface VoyageRouteParams {
  start_port: string;
  start_lat: number;
  start_lon: number;
  end_port: string;
  end_lat: number;
  end_lon: number;
  vessel_class: string;
  departure_date: string;
  // Aliases for camelCase
  startPort?: string;
  startLat?: number;
  startLon?: number;
  endPort?: string;
  endLat?: number;
  endLon?: number;
  vesselClass?: string;
  departureDate?: string;
}

export type VoyageInputFormValues = VoyageRouteParams;

interface VoyageInputPanelProps {
  onOptimizeRoute?: (values: VoyageRouteParams) => void;
  onOptimize?: (values: VoyageRouteParams) => void;
  isLoading?: boolean;
  loading?: boolean;
  activeOrigin?: string;
  activeDestination?: string;
  selectedParams?: Partial<VoyageRouteParams>;
  selectedLeadDay?: number;
}

import { NCPOR_ORIGIN_PORTS, NCPOR_DESTINATIONS, VESSEL_CLASSES } from "../constants/ports";
export { NCPOR_ORIGIN_PORTS, NCPOR_DESTINATIONS, VESSEL_CLASSES };

export const VoyageInputPanel: React.FC<VoyageInputPanelProps> = ({
  onOptimizeRoute,
  onOptimize,
  isLoading = false,
  loading = false,
  activeOrigin,
  activeDestination,
  selectedParams
}) => {
  const effectiveLoading = isLoading || loading;
  const dispatchOptimize = onOptimizeRoute || onOptimize;

  const [selectedOriginName, setSelectedOriginName] = useState(() => {
    if (selectedParams?.start_port) {
      const match = NCPOR_ORIGIN_PORTS.find(
        (p) => p.name === selectedParams.start_port || p.name.includes(selectedParams.start_port)
      );
      if (match) return match.name;
    }
    return NCPOR_ORIGIN_PORTS[1].name; // Default: Cape Town
  });

  const [selectedDestName, setSelectedDestName] = useState(() => {
    if (selectedParams?.end_port) {
      const match = NCPOR_DESTINATIONS.find(
        (d) => d.name === selectedParams.end_port || d.name.includes(selectedParams.end_port)
      );
      if (match) return match.name;
    }
    return NCPOR_DESTINATIONS[0].name; // Default: Maitri
  });

  const [vesselClass, setVesselClass] = useState(() => selectedParams?.vessel_class || "PC-5");
  const [departureDate, setDepartureDate] = useState(() => selectedParams?.departure_date || "2026-11-15");

  // Keep state in sync if parent updates selectedParams
  useEffect(() => {
    if (selectedParams?.start_port) {
      const match = NCPOR_ORIGIN_PORTS.find(
        (p) => p.name === selectedParams.start_port || p.name.includes(selectedParams.start_port)
      );
      if (match) setSelectedOriginName(match.name);
    }
    if (selectedParams?.end_port) {
      const match = NCPOR_DESTINATIONS.find(
        (d) => d.name === selectedParams.end_port || d.name.includes(selectedParams.end_port)
      );
      if (match) setSelectedDestName(match.name);
    }
    if (selectedParams?.vessel_class) {
      setVesselClass(selectedParams.vessel_class);
    }
    if (selectedParams?.departure_date) {
      setDepartureDate(selectedParams.departure_date);
    }
  }, [selectedParams]);

  const triggerOptimization = (
    originName: string,
    destName: string,
    vClass: string,
    depDate: string
  ) => {
    if (!dispatchOptimize) return;
    const origin = NCPOR_ORIGIN_PORTS.find((p) => p.name === originName) || NCPOR_ORIGIN_PORTS[0];
    const dest = NCPOR_DESTINATIONS.find((p) => p.name === destName) || NCPOR_DESTINATIONS[0];

    const payload: VoyageRouteParams = {
      start_port: origin.name,
      start_lat: origin.lat,
      start_lon: origin.lon,
      end_port: dest.name,
      end_lat: dest.lat,
      end_lon: dest.lon,
      vessel_class: vClass,
      departure_date: depDate,
      // camelCase aliases
      startPort: origin.name,
      startLat: origin.lat,
      startLon: origin.lon,
      endPort: dest.name,
      endLat: dest.lat,
      endLon: dest.lon,
      vesselClass: vClass,
      departureDate: depDate
    };

    dispatchOptimize(payload);
  };

  const handleOriginChange = (newOriginName: string) => {
    setSelectedOriginName(newOriginName);
    triggerOptimization(newOriginName, selectedDestName, vesselClass, departureDate);
  };

  const handleDestChange = (newDestName: string) => {
    setSelectedDestName(newDestName);
    triggerOptimization(selectedOriginName, newDestName, vesselClass, departureDate);
  };

  const handleVesselClassChange = (newVesselClass: string) => {
    setVesselClass(newVesselClass);
    triggerOptimization(selectedOriginName, selectedDestName, newVesselClass, departureDate);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    triggerOptimization(selectedOriginName, selectedDestName, vesselClass, departureDate);
  };

  const handleApplyPreset = (originName: string, destName: string) => {
    setSelectedOriginName(originName);
    setSelectedDestName(destName);
    triggerOptimization(originName, destName, vesselClass, departureDate);
  };

  return (
    <div
      id="voyage-input-instrument-panel"
      className="bg-panel border border-hairline p-3 space-y-3 shadow-md text-ink select-none"
    >
      <div className="flex items-center justify-between pb-2 border-b border-hairline">
        <div className="flex items-center gap-1.5 font-bold text-xs text-ink uppercase tracking-wide">
          <Ship className="w-3.5 h-3.5 text-brass" />
          VOYAGE SPECIFICATION & ROUTING DECK
        </div>
        <span className="px-1.5 py-0.5 bg-brass-soft text-brass border border-brass text-[9px] font-mono font-bold">
          POLARIS READY
        </span>
      </div>

      {/* Vessel Classification & Hull Capability Quick Banner */}
      <div className="border border-hairline bg-panel-low p-2 font-mono text-[10px] space-y-1">
        <div className="flex items-center justify-between border-b border-hairline pb-1">
          <span className="text-ink font-semibold">RV SAMUDRA RATNA</span>
          <span className="text-brass font-bold">PC-4 [HEAVY ICEBREAKER]</span>
        </div>
        <div className="grid grid-cols-3 gap-1 text-ink-muted text-[9px]">
          <div>DISPL: <span className="text-ink font-semibold">12,400 T</span></div>
          <div>RATING: <span className="text-brass font-semibold">1.5m @ 3kt</span></div>
          <div>POWER: <span className="text-ink font-semibold">14.8 MW</span></div>
        </div>
      </div>

      {/* Preset Quick Launch Mission Corridors */}
      <div className="space-y-1.5">
        <div className="flex items-center justify-between text-[10px] font-semibold text-ink-muted uppercase">
          <span>Global Mission Corridors:</span>
          <span className="text-[9px] font-mono text-brass">ONE-CLICK ROUTE</span>
        </div>
        
        {/* Quick Corridor Buttons */}
        <div className="space-y-1.5">
          <div className="grid grid-cols-2 gap-1.5">
            <button
              type="button"
              onClick={() => handleApplyPreset("Port of Mormugao, Goa (India)", "Maitri Research Station (India, DML)")}
              className="px-2 py-1.5 text-[10px] font-mono bg-brass-soft border border-brass/50 text-brass hover:bg-brass hover:text-white transition-colors font-bold cursor-pointer flex items-center justify-between"
              title="Goa (India) to Maitri Station - Official NCPOR National Resupply Voyage"
            >
              <span>🇮🇳 Goa &rarr; Maitri</span>
              <span className="text-[8px] bg-brass/20 px-1 font-semibold">DML</span>
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Port of Mormugao, Goa (India)", "Bharati Research Station (India, Larsemann)")}
              className="px-2 py-1.5 text-[10px] font-mono bg-brass-soft border border-brass/50 text-brass hover:bg-brass hover:text-white transition-colors font-bold cursor-pointer flex items-center justify-between"
              title="Goa (India) to Bharati Station - East Antarctic Ocean Transit"
            >
              <span>🇮🇳 Goa &rarr; Bharati</span>
              <span className="text-[8px] bg-brass/20 px-1 font-semibold">PRYDZ</span>
            </button>
          </div>

          <div className="grid grid-cols-3 gap-1">
            <button
              type="button"
              onClick={() => handleApplyPreset("Cape Town (South Africa)", "Maitri Research Station (India, DML)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Cape Town to Maitri Station"
            >
              🇿🇦 CPT&rarr;Maitri
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Cape Town (South Africa)", "Bharati Research Station (India, Larsemann)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Cape Town to Bharati Station"
            >
              🇿🇦 CPT&rarr;Bharati
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Hobart, Tasmania (Australia)", "Bharati Research Station (India, Larsemann)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Hobart (Australia) to Bharati Station"
            >
              🇦🇺 HBA&rarr;Bharati
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Ushuaia (Argentina)", "Rothera Research Station (UK, Peninsula)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Ushuaia to Rothera Station (Drake Passage Transit)"
            >
              🇦🇷 USH&rarr;Rothera
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Punta Arenas (Chile)", "Weddell Sea Continental Ice Shelf (Ronne)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Punta Arenas to Weddell Sea Continental Shelf"
            >
              🇨🇱 PUQ&rarr;Weddell
            </button>
            <button
              type="button"
              onClick={() => handleApplyPreset("Lyttelton / Christchurch (New Zealand)", "McMurdo Station (USA, Ross Island)")}
              className="px-1.5 py-1 text-[9.5px] font-mono bg-panel border border-hairline text-ink-muted hover:text-brass hover:border-brass transition-colors cursor-pointer text-center truncate"
              title="Lyttelton (New Zealand) to McMurdo Station (Ross Sea Deep Route)"
            >
              🇳🇿 LYT&rarr;McMurdo
            </button>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="space-y-2.5 text-xs">
        {/* Origin Port */}
        <div>
          <label className="block text-[10px] text-ink-muted uppercase mb-1 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Anchor className="w-3 h-3 text-brass" />
              GLOBAL DEPARTURE PORT ({NCPOR_ORIGIN_PORTS.length})
            </span>
            <span className="text-[9px] text-brass font-mono">LIVE SWITCH</span>
          </label>
          <select
            id="select-origin-port"
            value={selectedOriginName}
            onChange={(e) => handleOriginChange(e.target.value)}
            className="w-full bg-panel border border-hairline text-ink px-2.5 py-1.5 focus:outline-none focus:border-brass font-mono text-[11px] cursor-pointer"
          >
            {NCPOR_ORIGIN_PORTS.map((p) => (
              <option key={p.name} value={p.name}>
                {p.name} [{p.code}]
              </option>
            ))}
          </select>
        </div>

        {/* Destination Antarctic Station */}
        <div>
          <label className="block text-[10px] text-ink-muted uppercase mb-1 font-semibold flex items-center justify-between">
            <span className="flex items-center gap-1">
              <Navigation className="w-3 h-3 text-safe" />
              ANTARCTIC DESTINATION ({NCPOR_DESTINATIONS.length})
            </span>
            <span className="text-[9px] text-safe font-mono">LIVE SWITCH</span>
          </label>
          <select
            id="select-destination-port"
            value={selectedDestName}
            onChange={(e) => handleDestChange(e.target.value)}
            className="w-full bg-panel border border-hairline text-ink px-2.5 py-1.5 focus:outline-none focus:border-brass font-mono text-[11px] cursor-pointer"
          >
            {NCPOR_DESTINATIONS.map((d) => (
              <option key={d.name} value={d.name}>
                {d.flag} {d.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vessel Polar Class */}
        <div>
          <label className="block text-[10px] text-ink-muted uppercase mb-1 font-semibold flex items-center gap-1">
            <Ship className="w-3 h-3 text-caution" />
            IMO POLAR ICE CLASS
          </label>
          <select
            id="select-vessel-class"
            value={vesselClass}
            onChange={(e) => handleVesselClassChange(e.target.value)}
            className="w-full bg-panel border border-hairline text-ink px-2.5 py-1.5 focus:outline-none focus:border-brass font-mono text-[11px] cursor-pointer"
          >
            {VESSEL_CLASSES.map((vc) => (
              <option key={vc.id} value={vc.id}>
                {vc.id} - {vc.modifier}
              </option>
            ))}
          </select>
        </div>

        {/* Departure Date */}
        <div>
          <label className="block text-[10px] text-ink-muted uppercase mb-1 font-semibold flex items-center gap-1">
            <Calendar className="w-3 h-3 text-brass" />
            EXPEDITION DEPARTURE DATE
          </label>
          <input
            id="input-departure-date"
            type="date"
            value={departureDate}
            onChange={(e) => setDepartureDate(e.target.value)}
            className="w-full bg-panel border border-hairline text-ink px-2.5 py-1.5 focus:outline-none focus:border-brass font-mono text-[11px]"
          />
        </div>

        {/* Optimize Button */}
        <button
          id="btn-submit-route-optimize"
          type="submit"
          disabled={effectiveLoading}
          className="w-full mt-2 py-2 px-3 bg-brass hover:bg-brass-hover text-white font-bold text-xs flex items-center justify-center gap-2 transition-colors disabled:opacity-50 cursor-pointer"
        >
          {effectiveLoading ? (
            <>
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
              <span>COMPUTING POLAR A* PATH...</span>
            </>
          ) : (
            <>
              <Play className="w-3.5 h-3.5 fill-current" />
              <span>COMMIT VOYAGE PLOT TO ECDIS</span>
            </>
          )}
        </button>
      </form>
    </div>
  );
};

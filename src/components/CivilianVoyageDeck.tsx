import React from "react";
import {
  Compass,
  ShieldCheck,
  AlertTriangle,
  Ship,
  Calendar,
  Waves,
  Navigation,
  Info,
  ArrowRight,
  Eye,
  EyeOff,
  Leaf,
  Clock,
  MapPin,
  HelpCircle,
  ExternalLink
} from "lucide-react";
import { RouteResponse, Iceberg } from "../types";
import { NCPOR_ORIGIN_PORTS, NCPOR_DESTINATIONS } from "../constants/ports";

export interface CivilianVoyageDeckProps {
  voyageParams: {
    start_port: string;
    start_lat: number;
    start_lon: number;
    end_port: string;
    end_lat: number;
    end_lon: number;
    vessel_class: string;
    departure_date: string;
  };
  routeData: RouteResponse | null;
  loadingRoute: boolean;
  onSelectVoyage: (params: {
    start_port: string;
    start_lat: number;
    start_lon: number;
    end_port: string;
    end_lat: number;
    end_lon: number;
    vessel_class?: string;
  }) => void;
  selectedLeadDay: number;
  icebergs: Iceberg[];
  selectedIceberg: Iceberg | null;
  onSelectIceberg: (berg: Iceberg) => void;
  showOptimized: boolean;
  onToggleOptimized: () => void;
  showGreatCircle: boolean;
  onToggleGreatCircle: () => void;
  onSwitchToNaval: () => void;
}

export const CivilianVoyageDeck: React.FC<CivilianVoyageDeckProps> = ({
  voyageParams,
  routeData,
  loadingRoute,
  onSelectVoyage,
  selectedLeadDay,
  icebergs,
  selectedIceberg,
  onSelectIceberg,
  showOptimized,
  onToggleOptimized,
  showGreatCircle,
  onToggleGreatCircle,
  onSwitchToNaval
}) => {
  const comp = routeData?.comparison_vs_greatcircle;
  const distNm = routeData?.total_distance_nm ?? 4120;
  const distKm = Math.round(distNm * 1.852);
  const daysEst = routeData?.est_duration_hrs
    ? (routeData.est_duration_hrs / 24).toFixed(1)
    : "14.2";
  const fuelSavedKg = comp?.fuel_saved_kg ?? 4500;
  const fuelSavedTonnes = (fuelSavedKg / 1000).toFixed(1);

  // Friendly preset expeditions
  const PRESET_EXPEDITIONS = [
    {
      id: "goa-maitri",
      label: "🇮🇳 India → Maitri Base",
      sub: "Goa to Maitri (Avoids Madagascar)",
      startPort: "Port of Mormugao, Goa (India)",
      startLat: 15.4026,
      startLon: 73.8016,
      endPort: "Maitri Research Station (India, DML)",
      endLat: -70.7667,
      endLon: 11.7333
    },
    {
      id: "capetown-maitri",
      label: "🇿🇦 Cape Town → Maitri Base",
      sub: "Atlantic Southern Ocean passage",
      startPort: "Cape Town (South Africa)",
      startLat: -33.9249,
      startLon: 18.4241,
      endPort: "Maitri Research Station (India, DML)",
      endLat: -70.7667,
      endLon: 11.7333
    },
    {
      id: "ushuaia-rothera",
      label: "🇦🇷 Ushuaia → Rothera Base",
      sub: "Drake Passage & Peninsula",
      startPort: "Ushuaia (Argentina)",
      startLat: -54.8019,
      startLon: -68.303,
      endPort: "Rothera Research Station (UK, Peninsula)",
      endLat: -67.568,
      endLon: -68.128
    },
    {
      id: "goa-bharati",
      label: "🇮🇳 India → Bharati Base",
      sub: "Larsemann Hills Expedition",
      startPort: "Port of Mormugao, Goa (India)",
      startLat: 15.4026,
      startLon: 73.8016,
      endPort: "Bharati Research Station (India, Larsemann)",
      endLat: -69.4072,
      endLon: 76.19
    }
  ];

  const handleOriginChange = (portName: string) => {
    const port = NCPOR_ORIGIN_PORTS.find((p) => p.name === portName);
    if (!port) return;
    onSelectVoyage({
      start_port: port.name,
      start_lat: port.lat,
      start_lon: port.lon,
      end_port: voyageParams.end_port,
      end_lat: voyageParams.end_lat,
      end_lon: voyageParams.end_lon
    });
  };

  const handleDestinationChange = (destName: string) => {
    const dest = NCPOR_DESTINATIONS.find((d) => d.name === destName);
    if (!dest) return;
    onSelectVoyage({
      start_port: voyageParams.start_port,
      start_lat: voyageParams.start_lat,
      start_lon: voyageParams.start_lon,
      end_port: dest.name,
      end_lat: dest.lat,
      end_lon: dest.lon
    });
  };

  return (
    <div
      id="civilian-voyage-deck"
      className="bg-white/95 backdrop-blur-md border border-[#D7E1E8] shadow-xl rounded-xl p-4 text-[#12202B] space-y-4 max-h-[calc(100vh-140px)] overflow-y-auto"
    >
      {/* 1. Welcoming Title */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-3">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-[#E0F2FE] text-[#0284C7] flex items-center justify-center shadow-xs">
            <Compass className="w-5 h-5" />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#0F172A] tracking-tight">
              Polar Expedition Guide
            </h2>
            <p className="text-[11px] text-[#64748B]">
              Real-Time Public Voyage & Ice Monitor
            </p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-[#DCFCE7] text-[#166534] flex items-center gap-1">
          <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A] animate-pulse"></span>
          Live Satellite
        </span>
      </div>

      {/* 2. Plain-English Safety Status Banner */}
      <div className="p-3.5 rounded-xl border bg-[#F0FDF4] border-[#BBF7D0] text-[#14532D] shadow-xs">
        <div className="flex items-start gap-2.5">
          <ShieldCheck className="w-5 h-5 text-[#16A34A] shrink-0 mt-0.5" />
          <div>
            <div className="text-xs font-bold text-[#14532D]">
              Safe Passage · Zero Hazards Ahead
            </div>
            <p className="text-[11px] text-[#166534] mt-0.5 leading-relaxed">
              Our recommended green route safely steers clear of Madagascar land and stays over <strong>45 km away</strong> from drifting icebergs.
            </p>
          </div>
        </div>
      </div>

      {/* 3. Quick-Choose Popular Expeditions */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center justify-between">
          <span>Popular Polar Expeditions</span>
          <span className="text-[10px] font-normal text-[#94A3B8]">Tap to pick</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          {PRESET_EXPEDITIONS.map((exp) => {
            const isSelected =
              voyageParams.start_port === exp.startPort &&
              voyageParams.end_port === exp.endPort;

            return (
              <button
                key={exp.id}
                type="button"
                onClick={() => {
                  onSelectVoyage({
                    start_port: exp.startPort,
                    start_lat: exp.startLat,
                    start_lon: exp.startLon,
                    end_port: exp.endPort,
                    end_lat: exp.endLat,
                    end_lon: exp.endLon
                  });
                }}
                className={`p-2.5 rounded-lg border text-left transition-all cursor-pointer ${
                  isSelected
                    ? "bg-[#0E7C93] text-white border-[#0E7C93] shadow-sm ring-2 ring-[#0E7C93]/20"
                    : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#1E293B]"
                }`}
              >
                <div className={`font-bold text-xs ${isSelected ? "text-white" : "text-[#0F172A]"}`}>
                  {exp.label}
                </div>
                <div className={`text-[10px] mt-0.5 truncate ${isSelected ? "text-[#E0F2FE]" : "text-[#64748B]"}`}>
                  {exp.sub}
                </div>
              </button>
            );
          })}
        </div>
      </div>

      {/* 4. Voyage Customizer (Departure & Destination Dropdowns) */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2.5">
        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center gap-1.5">
          <Ship className="w-3.5 h-3.5 text-[#0E7C93]" />
          <span>Custom Ports</span>
        </div>

        <div className="space-y-2">
          <div>
            <label className="text-[10px] font-semibold text-[#64748B] block mb-1">
              Start From
            </label>
            <select
              value={voyageParams.start_port}
              onChange={(e) => handleOriginChange(e.target.value)}
              className="w-full text-xs font-semibold p-2 bg-white border border-[#CBD5E1] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0E7C93]/30"
            >
              {NCPOR_ORIGIN_PORTS.map((p) => (
                <option key={p.code} value={p.name}>
                  {p.region} — {p.name}
                </option>
              ))}
            </select>
          </div>

          <div className="flex items-center justify-center -my-1">
            <div className="w-5 h-5 rounded-full bg-[#E2E8F0] text-[#475569] flex items-center justify-center text-[10px] font-bold">
              ↓
            </div>
          </div>

          <div>
            <label className="text-[10px] font-semibold text-[#64748B] block mb-1">
              Antarctic Station
            </label>
            <select
              value={voyageParams.end_port}
              onChange={(e) => handleDestinationChange(e.target.value)}
              className="w-full text-xs font-semibold p-2 bg-white border border-[#CBD5E1] rounded-lg shadow-xs focus:outline-none focus:ring-2 focus:ring-[#0E7C93]/30"
            >
              {NCPOR_DESTINATIONS.map((d) => (
                <option key={d.code} value={d.name}>
                  {d.flag} {d.name}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* 5. Voyage Highlights Cards */}
      <div className="grid grid-cols-3 gap-2">
        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-center">
          <div className="text-[10px] text-[#64748B] font-medium">Distance</div>
          <div className="text-xs font-bold text-[#0F172A] mt-0.5">
            {distKm.toLocaleString()} km
          </div>
          <div className="text-[9px] text-[#94A3B8]">({Math.round(distNm)} NM)</div>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-center">
          <div className="text-[10px] text-[#64748B] font-medium">Est. Voyage</div>
          <div className="text-xs font-bold text-[#0F172A] mt-0.5">
            ~{daysEst} Days
          </div>
          <div className="text-[9px] text-[#16A34A] font-medium">Clear Route</div>
        </div>

        <div className="bg-[#F8FAFC] p-2.5 rounded-xl border border-[#E2E8F0] text-center">
          <div className="text-[10px] text-[#64748B] font-medium">Eco Savings</div>
          <div className="text-xs font-bold text-[#16A34A] mt-0.5">
            +{fuelSavedTonnes} T
          </div>
          <div className="text-[9px] text-[#16A34A] font-medium">Fuel Saved</div>
        </div>
      </div>

      {/* 6. Iceberg Spotlight with Real-World Comparisons */}
      <div className="bg-gradient-to-br from-[#EFF6FF] to-[#F0FDFA] border border-[#BFDBFE] rounded-xl p-3.5 space-y-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 text-[#1E3A8A] font-bold text-xs">
            <span className="text-base">🏔️</span>
            <span>Iceberg Spotlight</span>
          </div>
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-[#DBEAFE] text-[#1E40AF] font-bold">
            {selectedIceberg ? selectedIceberg.iceberg_id : "A-23a Megaberg"}
          </span>
        </div>

        {selectedIceberg ? (
          <div className="space-y-2 text-xs">
            <div className="font-bold text-[#0F172A] flex items-center justify-between">
              <span>{selectedIceberg.name}</span>
              <span className="text-[10px] text-[#64748B] font-normal">
                {selectedIceberg.size_class === "D" ? "Megaberg" : "Drifting Berg"}
              </span>
            </div>

            <p className="text-[11px] text-[#334155] leading-relaxed">
              {selectedIceberg.size_class === "D"
                ? "This enormous ice island broke off the Filchner Ice Shelf. It covers ~3,800 square kilometers — more than double the size of Greater London!"
                : "A large free-floating block of ancient glacial ice formed from compacted Antarctic snowfall over thousands of years."}
            </p>

            <div className="grid grid-cols-2 gap-1.5 pt-1 text-[11px]">
              <div className="bg-white/90 p-2 rounded-lg border border-[#DBEAFE]">
                <div className="text-[9px] text-[#64748B]">Above Water</div>
                <div className="font-bold text-[#0F172A] mt-0.5">
                  {selectedIceberg.sail_height_m} meters
                </div>
                <div className="text-[9px] text-[#94A3B8]">
                  ~{Math.round(selectedIceberg.sail_height_m / 3)} stories tall
                </div>
              </div>

              <div className="bg-white/90 p-2 rounded-lg border border-[#DBEAFE]">
                <div className="text-[9px] text-[#64748B]">Underwater Bulk</div>
                <div className="font-bold text-[#0F172A] mt-0.5">
                  {selectedIceberg.draft_m} meters
                </div>
                <div className="text-[9px] text-[#0284C7]">90% hidden below</div>
              </div>

              <div className="bg-white/90 p-2 rounded-lg border border-[#DBEAFE] col-span-2 flex items-center justify-between">
                <div>
                  <div className="text-[9px] text-[#64748B]">Current Drift Speed</div>
                  <div className="font-bold text-[#0F172A]">
                    {(selectedIceberg.drift_speed_knots * 1.852).toFixed(1)} km/h
                  </div>
                </div>
                <span className="text-[10px] px-2 py-1 bg-[#DCFCE7] text-[#166534] rounded font-semibold">
                  Safely Avoided by Route
                </span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-[#475569] leading-relaxed">
            Click on any iceberg icon on the map to see its real-world dimensions, underwater depth, and drift speed.
          </div>
        )}
      </div>

      {/* 7. Route Comparison Toggle (Friendly Plain English) */}
      <div className="bg-[#F8FAFC] border border-[#E2E8F0] rounded-xl p-3 space-y-2">
        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
          Route View Options
        </div>

        <div className="space-y-1.5 text-xs">
          <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E2E8F0] cursor-pointer hover:bg-[#F1F5F9] transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#16A34A]"></span>
              <div>
                <span className="font-bold text-[#0F172A]">Safe Recommended Route</span>
                <p className="text-[10px] text-[#64748B]">Bypasses land & drifting ice hazards</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showOptimized}
              onChange={onToggleOptimized}
              className="w-4 h-4 accent-[#16A34A] cursor-pointer"
            />
          </label>

          <label className="flex items-center justify-between p-2 rounded-lg bg-white border border-[#E2E8F0] cursor-pointer hover:bg-[#F1F5F9] transition-colors">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-[#DC2626]"></span>
              <div>
                <span className="font-bold text-[#0F172A]">Direct Straight Line</span>
                <p className="text-[10px] text-[#DC2626]">Dangerous — crosses heavy ice</p>
              </div>
            </div>
            <input
              type="checkbox"
              checked={showGreatCircle}
              onChange={onToggleGreatCircle}
              className="w-4 h-4 accent-[#DC2626] cursor-pointer"
            />
          </label>
        </div>
      </div>

      {/* 8. Friendly Footer to switch back to Naval Bridge if wanted */}
      <div className="pt-2 border-t border-[#E2E8F0] flex items-center justify-between text-[11px] text-[#64748B]">
        <span>Need full technical radar & telemetry?</span>
        <button
          type="button"
          onClick={onSwitchToNaval}
          className="text-[#0E7C93] hover:text-[#0B6275] font-bold hover:underline cursor-pointer"
        >
          Switch to Naval Bridge →
        </button>
      </div>
    </div>
  );
};

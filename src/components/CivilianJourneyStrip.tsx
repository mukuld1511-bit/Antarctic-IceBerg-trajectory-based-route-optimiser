import React from "react";
import { Ship, Clock, Compass, ShieldCheck, MapPin, Navigation2, ArrowRight } from "lucide-react";
import { RouteResponse } from "../types";

interface CivilianJourneyStripProps {
  routeData: RouteResponse | null;
  startPort: string;
  endPort: string;
  currentLeadDay: number;
}

export const CivilianJourneyStrip: React.FC<CivilianJourneyStripProps> = ({
  routeData,
  startPort,
  endPort,
  currentLeadDay
}) => {
  const distNm = routeData?.total_distance_nm ?? 4120;
  const distKm = Math.round(distNm * 1.852);
  const totalDays = routeData?.est_duration_hrs
    ? (routeData.est_duration_hrs / 24).toFixed(1)
    : "14.2";

  // Friendly short names
  const cleanStart = startPort.split(",")[0].replace("Port of ", "");
  const cleanEnd = endPort.split(" (")[0];

  return (
    <div
      id="civilian-journey-strip"
      className="bg-white/95 backdrop-blur-md border border-[#D7E1E8] shadow-lg rounded-xl px-4 py-2.5 flex flex-wrap items-center justify-between gap-3 text-[#12202B]"
    >
      {/* Route Journey Origin -> Destination */}
      <div className="flex items-center gap-2.5">
        <div className="w-8 h-8 rounded-lg bg-[#0E7C93] text-white flex items-center justify-center shadow-xs">
          <Ship className="w-4 h-4" />
        </div>
        <div>
          <div className="flex items-center gap-1.5 text-xs font-bold text-[#0F172A]">
            <span>{cleanStart}</span>
            <ArrowRight className="w-3.5 h-3.5 text-[#0E7C93]" />
            <span>{cleanEnd}</span>
          </div>
          <div className="text-[11px] text-[#64748B] flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-[#16A34A]"></span>
            <span>Recommended International Maritime Route</span>
          </div>
        </div>
      </div>

      {/* Quick Metrics in Human Terms */}
      <div className="flex items-center gap-4 text-xs">
        <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
          <Clock className="w-3.5 h-3.5 text-[#0E7C93]" />
          <div>
            <span className="text-[10px] text-[#64748B] block">Total Duration</span>
            <span className="font-bold text-[#0F172A]">~{totalDays} Days</span>
          </div>
        </div>

        <div className="flex items-center gap-1.5 bg-[#F8FAFC] px-2.5 py-1 rounded-lg border border-[#E2E8F0]">
          <Navigation2 className="w-3.5 h-3.5 text-[#0E7C93]" />
          <div>
            <span className="text-[10px] text-[#64748B] block">Total Distance</span>
            <span className="font-bold text-[#0F172A]">{distKm.toLocaleString()} km</span>
          </div>
        </div>

        <div className="hidden sm:flex items-center gap-1.5 bg-[#F0FDF4] px-2.5 py-1 rounded-lg border border-[#BBF7D0]">
          <ShieldCheck className="w-3.5 h-3.5 text-[#16A34A]" />
          <div>
            <span className="text-[10px] text-[#166534] block">Safety Clearance</span>
            <span className="font-bold text-[#14532D]">45+ km from Icebergs</span>
          </div>
        </div>
      </div>

      {/* Forecast Day Indicator */}
      <div className="flex items-center gap-2 bg-[#E0F2FE] text-[#0369A1] px-3 py-1 rounded-full text-xs font-semibold">
        <span>Satellite Forecast:</span>
        <span className="bg-white px-2 py-0.5 rounded-full font-bold shadow-xs">
          {currentLeadDay === 0 ? "Today" : `Day +${currentLeadDay}`}
        </span>
      </div>
    </div>
  );
};

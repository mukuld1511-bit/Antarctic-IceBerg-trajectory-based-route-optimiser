import React from "react";
import { X, Compass, ShieldCheck, Ship, MapPin, Eye, Sparkles } from "lucide-react";

interface CivilianGuideModalProps {
  onClose: () => void;
}

export const CivilianGuideModal: React.FC<CivilianGuideModalProps> = ({ onClose }) => {
  return (
    <div className="fixed inset-0 z-[1100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
      <div className="relative w-full max-w-2xl bg-white border border-[#D7E1E8] rounded-2xl shadow-2xl overflow-hidden flex flex-col max-h-[85vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#E2E8F0] bg-gradient-to-r from-[#F0FDFA] to-[#EFF6FF]">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-xl bg-[#0E7C93] text-white flex items-center justify-center shadow-xs">
              <Compass className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#0F172A]">
                How Antarctic Navigation Works
              </h2>
              <p className="text-xs text-[#64748B]">
                A beginner-friendly guide to sea-ice safety and expedition routes
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-[#94A3B8] hover:text-[#0F172A] hover:bg-white/80 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <div className="p-6 overflow-y-auto space-y-4 text-xs text-[#334155] leading-relaxed">
          {/* Card 1: What is Sea Ice? */}
          <div className="p-4 rounded-xl bg-[#F8FAFC] border border-[#E2E8F0] space-y-2">
            <div className="flex items-center gap-2 text-[#0F172A] font-bold text-sm">
              <span className="text-lg">🌊</span>
              <span>1. Sea Ice vs. Icebergs</span>
            </div>
            <p>
              <strong>Sea Ice</strong> is frozen ocean water that forms and melts with the polar seasons. During Antarctic summer, leads (open water channels) open up, allowing icebreakers and passenger ships to navigate.
            </p>
            <p>
              <strong>Icebergs</strong>, on the other hand, are giant chunks of pure freshwater that snap off land glaciers. Some, like <em>A-23a</em>, are larger than entire countries and drift north with ocean currents for years.
            </p>
          </div>

          {/* Card 2: AI Safe Routing */}
          <div className="p-4 rounded-xl bg-[#F0FDF4] border border-[#BBF7D0] space-y-2 text-[#14532D]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#14532D]">
              <ShieldCheck className="w-5 h-5 text-[#16A34A]" />
              <span>2. Why Our Route Curves Around Land & Hazards</span>
            </div>
            <p>
              A simple straight line on a flat map would cut straight through landmasses (like Madagascar) or crash right into dense iceberg drift alleys.
            </p>
            <p>
              Our system uses <strong>satellite radar data</strong> and oceanic drift equations to plot a curved, deep-water route that:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-[11px]">
              <li>Passes safely through international maritime corridors east of Madagascar.</li>
              <li>Maintains a mandatory 45+ km exclusion zone around massive icebergs.</li>
              <li>Saves over 4 tonnes of fuel by choosing calm ocean currents.</li>
            </ul>
          </div>

          {/* Card 3: How to Explore */}
          <div className="p-4 rounded-xl bg-[#EFF6FF] border border-[#BFDBFE] space-y-2 text-[#1E3A8A]">
            <div className="flex items-center gap-2 font-bold text-sm text-[#1E40AF]">
              <Sparkles className="w-4 h-4 text-[#2563EB]" />
              <span>3. Interactive Things You Can Try</span>
            </div>
            <ul className="space-y-1.5 text-[11px]">
              <li>👉 <strong>Click on any Iceberg</strong> on the map to see its size compared to world cities, its height above water, and its depth below.</li>
              <li>👉 <strong>Use the Day Slider at the bottom</strong> to see a 7-day forecast of how sea ice expands and where icebergs drift.</li>
              <li>👉 <strong>Pick a Popular Expedition</strong> (like Goa → Maitri) in the left panel to see how routes adapt across oceans.</li>
            </ul>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="px-6 py-3 border-t border-[#E2E8F0] bg-[#F8FAFC] flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-2 bg-[#0E7C93] hover:bg-[#0B6275] text-white font-bold text-xs rounded-xl shadow-xs cursor-pointer transition-colors"
          >
            Got it, Let's Explore!
          </button>
        </div>
      </div>
    </div>
  );
};

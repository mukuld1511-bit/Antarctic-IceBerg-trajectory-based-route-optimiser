import React, { useState } from "react";
import { Shield, Sparkles, HelpCircle, ChevronRight, Compass, Sun, Thermometer, Wind, CheckCircle2 } from "lucide-react";
import { Iceberg } from "../types";

interface CivilianRightOverlayProps {
  icebergs: Iceberg[];
  onSelectIceberg?: (berg: Iceberg) => void;
  selectedIcebergId?: string;
}

export const CivilianRightOverlay: React.FC<CivilianRightOverlayProps> = ({
  icebergs,
  onSelectIceberg,
  selectedIcebergId
}) => {
  const [isOpen, setIsOpen] = useState(true);

  if (!isOpen) {
    return (
      <button
        onClick={() => setIsOpen(true)}
        className="pointer-events-auto ml-auto px-3 py-2 bg-white/95 backdrop-blur-md border border-[#D7E1E8] text-xs font-semibold text-[#0E7C93] rounded-xl shadow-lg hover:bg-slate-50 flex items-center gap-2 cursor-pointer transition-all"
        title="Show Ice & Safety Guide"
      >
        <Shield className="w-4 h-4 text-[#16A34A]" />
        <span>Ice & Safety Guide</span>
      </button>
    );
  }

  return (
    <div
      id="civilian-safety-guide"
      className="pointer-events-auto bg-white/95 backdrop-blur-md border border-[#D7E1E8] shadow-xl rounded-xl p-3.5 text-[#12202B] space-y-3.5 max-h-[calc(100vh-220px)] overflow-y-auto"
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-[#E2E8F0] pb-2">
        <div className="flex items-center gap-2">
          <Shield className="w-4 h-4 text-[#16A34A]" />
          <span className="font-bold text-xs text-[#0F172A]">
            Antarctic Conditions Guide
          </span>
        </div>
        <button
          onClick={() => setIsOpen(false)}
          className="text-[#94A3B8] hover:text-[#0F172A] p-0.5 rounded cursor-pointer transition-colors"
          title="Minimize Guide"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* 1. Map Colors Explained Simply */}
      <div className="space-y-2">
        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider">
          Map Sea-Ice Colors
        </div>

        <div className="space-y-1.5 text-xs">
          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#3B82F6] shrink-0"></span>
            <div>
              <div className="font-semibold text-[#0F172A]">Open Ocean (Clear Sailing)</div>
              <div className="text-[10px] text-[#64748B]">Deep blue water with zero ice obstructions</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#06B6D4] shrink-0"></span>
            <div>
              <div className="font-semibold text-[#0F172A]">Thin Floating Ice</div>
              <div className="text-[10px] text-[#64748B]">Scattered summer ice floes; easily traversable</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EAB308] shrink-0"></span>
            <div>
              <div className="font-semibold text-[#0F172A]">Medium Pack Ice</div>
              <div className="text-[10px] text-[#64748B]">Slow navigation required; bypassed by our route</div>
            </div>
          </div>

          <div className="flex items-center gap-2.5 p-2 rounded-lg bg-[#F8FAFC] border border-[#E2E8F0]">
            <span className="w-3.5 h-3.5 rounded-full bg-[#EF4444] shrink-0"></span>
            <div>
              <div className="font-semibold text-[#0F172A]">Dense Ice Shelf & Icebergs</div>
              <div className="text-[10px] text-[#64748B]">Impenetrable solid ice; strictly avoided</div>
            </div>
          </div>
        </div>
      </div>

      {/* 2. Giant Icebergs Currently Tracked */}
      <div className="space-y-1.5">
        <div className="text-[11px] font-bold text-[#475569] uppercase tracking-wider flex items-center justify-between">
          <span>Tracked Giant Icebergs</span>
          <span className="text-[10px] font-normal text-[#16A34A] flex items-center gap-1">
            <CheckCircle2 className="w-3 h-3" /> All Safe
          </span>
        </div>

        <div className="space-y-1 max-h-36 overflow-y-auto pr-0.5">
          {icebergs.slice(0, 4).map((b) => {
            const isSelected = selectedIcebergId === b.iceberg_id;
            return (
              <button
                key={b.iceberg_id}
                type="button"
                onClick={() => onSelectIceberg?.(b)}
                className={`w-full p-2 rounded-lg border text-left text-xs transition-all flex items-center justify-between cursor-pointer ${
                  isSelected
                    ? "bg-[#0E7C93] text-white border-[#0E7C93] shadow-xs"
                    : "bg-[#F8FAFC] hover:bg-[#F1F5F9] border-[#E2E8F0] text-[#1E293B]"
                }`}
              >
                <div>
                  <div className={`font-bold ${isSelected ? "text-white" : "text-[#0F172A]"}`}>
                    {b.name || b.iceberg_id}
                  </div>
                  <div className={`text-[10px] ${isSelected ? "text-[#E0F2FE]" : "text-[#64748B]"}`}>
                    {(b.length_m / 1000).toFixed(0)} km long · {b.sail_height_m}m above water
                  </div>
                </div>
                <span className={`text-[10px] font-semibold px-1.5 py-0.5 rounded ${
                  isSelected ? "bg-white/20 text-white" : "bg-[#EFF6FF] text-[#0284C7]"
                }`}>
                  {b.size_class === "D" ? "Megaberg" : "Large"}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* 3. Fun Polar Fact */}
      <div className="p-3 rounded-xl bg-gradient-to-br from-[#FEF3C7] to-[#FFFBEB] border border-[#FDE68A] text-[#92400E]">
        <div className="flex items-center gap-1.5 font-bold text-xs mb-1">
          <Sparkles className="w-3.5 h-3.5 text-[#D97706]" />
          <span>Did You Know?</span>
        </div>
        <p className="text-[11px] leading-relaxed">
          Around <strong>90% of an iceberg's bulk is hidden underwater</strong>. That's why satellite tracking and AI route planning are essential to guarantee our ships never run aground on subsurface ice shelves.
        </p>
      </div>
    </div>
  );
};

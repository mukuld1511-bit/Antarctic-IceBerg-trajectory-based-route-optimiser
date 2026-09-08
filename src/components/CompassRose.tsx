import React from "react";
import { Compass } from "lucide-react";

interface CompassRoseProps {
  heading?: number;
  onResetNorth?: () => void;
  className?: string;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  heading = 0,
  onResetNorth,
  className = ""
}) => {
  return (
    <button
      type="button"
      id="interactive-compass-control"
      onClick={onResetNorth}
      className={`glass-pill w-12 h-12 rounded-full flex flex-col items-center justify-center p-1 shadow-md hover:shadow-lg transition-all duration-200 cursor-pointer group border border-[#D7E1E8] hover:border-[#0E7C93] ${className}`}
      title="Compass: Click to reset orientation to North"
    >
      <div className="relative w-8 h-8 flex items-center justify-center">
        {/* Rotating Compass Needle SVG */}
        <svg
          className="w-full h-full transition-transform duration-300 group-hover:scale-105"
          viewBox="0 0 40 40"
          style={{ transform: `rotate(${heading}deg)` }}
        >
          {/* Compass Outer Ring */}
          <circle cx="20" cy="20" r="18" fill="none" stroke="#D7E1E8" strokeWidth="1.2" />
          
          {/* North Tick */}
          <line x1="20" y1="2" x2="20" y2="5" stroke="#B23A2F" strokeWidth="1.8" />
          
          {/* North Arrow (Red) */}
          <polygon points="20,5 23.5,20 20,18" fill="#B23A2F" />
          <polygon points="20,5 16.5,20 20,18" fill="#E11D48" />

          {/* South Arrow (Silver/Blue) */}
          <polygon points="20,35 23.5,20 20,22" fill="#94A3B8" />
          <polygon points="20,35 16.5,20 20,22" fill="#CBD5E1" />

          {/* Center Pin */}
          <circle cx="20" cy="20" r="2.5" fill="#12202B" stroke="#FFFFFF" strokeWidth="1" />
        </svg>
      </div>
      <span className="text-[8px] font-mono font-bold text-[#0E7C93] leading-none mt-0.5">
        N
      </span>
    </button>
  );
};

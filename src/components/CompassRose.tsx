import React from "react";

interface CompassRoseProps {
  heading?: number;
  variation?: string;
  className?: string;
}

export const CompassRose: React.FC<CompassRoseProps> = ({
  heading = 142,
  variation = "VAR 14°32'W (2025)",
  className = "",
}) => {
  return (
    <div
      id="compass-rose-control"
      className={`bg-panel border border-hairline shadow-md p-1 flex flex-col items-center justify-center select-none pointer-events-auto ${className}`}
      style={{ width: "160px", height: "160px" }}
    >
      <div className="relative w-36 h-36 flex items-center justify-center">
        {/* SVG Compass Rose */}
        <svg className="w-full h-full" viewBox="0 0 160 160">
          {/* Outer Circles */}
          <circle cx="80" cy="80" fill="none" r="74" stroke="#BEC8CC" strokeWidth="1" />
          <circle cx="80" cy="80" fill="none" r="68" stroke="#BEC8CC" strokeWidth="0.5" />

          {/* Degree Ticks */}
          <g stroke="#6E797C" strokeWidth="0.75">
            {/* Cardinal Ticks */}
            <line x1="80" y1="6" x2="80" y2="12" />
            <line x1="154" y1="80" x2="148" y2="80" />
            <line x1="80" y1="154" x2="80" y2="148" />
            <line x1="6" y1="80" x2="12" y2="80" />

            {/* Intermediate 30 deg ticks */}
            <line x1="117" y1="16" x2="114" y2="21" />
            <line x1="144" y1="43" x2="139" y2="46" />
            <line x1="144" y1="117" x2="139" y2="114" />
            <line x1="117" y1="144" x2="114" y2="139" />
            <line x1="43" y1="144" x2="46" y2="139" />
            <line x1="16" y1="117" x2="21" y2="114" />
            <line x1="16" y1="43" x2="21" y2="46" />
            <line x1="43" y1="16" x2="46" y2="21" />
          </g>

          {/* Cardinal Letters */}
          <text x="80" y="22" fill="#0E7C93" fontFamily="Inter" fontSize="10" fontWeight="700" textAnchor="middle">
            N
          </text>
          <text x="142" y="83" fill="#57707E" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
            E
          </text>
          <text x="80" y="144" fill="#57707E" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
            S
          </text>
          <text x="18" y="83" fill="#57707E" fontFamily="Inter" fontSize="9" fontWeight="600" textAnchor="middle">
            W
          </text>

          {/* Inner Admiralty Brass Compass Star */}
          {/* North Point */}
          <polygon points="80,24 85,75 80,70" fill="#0E7C93" />
          <polygon points="80,24 75,75 80,70" fill="#7CD3EC" />
          {/* South Point */}
          <polygon points="80,136 85,85 80,90" fill="#49626F" />
          <polygon points="80,136 75,85 80,90" fill="#BEC8CC" />
          {/* East Point */}
          <polygon points="136,80 85,85 90,80" fill="#49626F" />
          <polygon points="136,80 85,75 90,80" fill="#BEC8CC" />
          {/* West Point */}
          <polygon points="24,80 75,85 70,80" fill="#49626F" />
          <polygon points="24,80 75,75 70,80" fill="#BEC8CC" />

          {/* Current Heading Needle Overlay */}
          <g transform={`rotate(${heading} 80 80)`}>
            <line x1="80" y1="14" x2="80" y2="146" stroke="#0E7C93" strokeWidth="1.5" />
            <polygon points="80,10 77,20 83,20" fill="#0E7C93" />
            <circle cx="80" cy="80" r="3" fill="#12202B" />
          </g>
        </svg>

        {/* Magnetic Variation Notation Footer */}
        <div className="absolute bottom-0 inset-x-0 text-center bg-panel/95 border-t border-hairline py-0.5 pointer-events-none">
          <span className="text-[8px] font-mono text-ink-muted block leading-tight">
            {variation}
          </span>
          <span className="text-[7px] font-mono text-outline block leading-tight">
            ANNUAL DECR 8' // HDG {Math.round(heading)}°T
          </span>
        </div>
      </div>
    </div>
  );
};

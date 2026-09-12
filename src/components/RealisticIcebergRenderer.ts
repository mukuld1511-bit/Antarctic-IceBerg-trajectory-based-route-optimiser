import { Iceberg } from "../types";

/**
 * Photorealistic 2.5D Glacial Iceberg Graphic Renderer
 * 
 * Generates authentic, scientifically grounded SVG representations of Antarctic icebergs:
 * - Luminous subsurface glacial bulk (showing the 90% underwater keel with true oceanic light scatter)
 * - Layered sheer calving cliff walls with thousands of years of compressed Antarctic ice stratification
 * - Specular sunlit snow plateau (sastrugi snowdrifts, crevasse fissures, and high-albedo crest highlights)
 * - Hydrodynamic bow-wave and trailing drift-wake ripples aligned with real heading
 * - Authentic tabular shelf silhouettes for megabergs (A-23a, A-81, D-28, B-22a)
 * - Multi-faceted crystalline spires for pinnacled/wedge icebergs
 * - Compact, sleek tactical AIS telemetry pills that never clutter the bridge chart
 */

export interface IcebergGraphicOptions {
  berg: Iceberg;
  isSelected: boolean;
  isPlaying: boolean;
  uiMode?: "naval" | "civilian";
  driftDistNM?: number;
}

export function generateRealisticIcebergSVG(options: IcebergGraphicOptions): string {
  const { berg, isSelected, isPlaying, uiMode = "naval", driftDistNM = 0 } = options;

  const isMegaberg = berg.size_class === "D";
  const heading = berg.drift_heading_deg || 45;

  // Hazard color tokens
  const hazardColor =
    berg.hazard_level === "CRITICAL"
      ? "#EF4444"
      : berg.hazard_level === "HIGH"
      ? "#F59E0B"
      : berg.hazard_level === "MODERATE"
      ? "#06B6D4"
      : "#10B981";

  // Visual dimensions (scaled for clear visibility and map proportion)
  const widthPx = isMegaberg ? 58 : berg.size_class === "C" ? 42 : 32;
  const heightPx = isMegaberg ? 38 : berg.size_class === "C" ? 28 : 22;

  // Deterministic visual seed from iceberg ID
  const hash = berg.iceberg_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const notchVariation = (hash % 7) - 3;
  const filterId = `ice-glow-${berg.iceberg_id.replace(/[^a-zA-Z0-9]/g, "_")}`;

  let bergSvgBody = "";

  if (isMegaberg) {
    // -------------------------------------------------------------
    // TABULAR MEGABERG (A-23a, A-81, D-28, B-22a)
    // Massive calved ice shelf plateau with sheer stratified cliffs
    // -------------------------------------------------------------
    const hw = widthPx / 2;
    const hh = heightPx / 2;

    bergSvgBody = `
      <g transform="rotate(${heading}, ${hw}, ${hh})">
        <defs>
          <!-- Subsurface Oceanic Glow Filter -->
          <filter id="${filterId}" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="4.5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="
              0 0 0 0 0.05
              0 0 0 0 0.82
              0 0 0 0 0.95
              0 0 0 0.65 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>

          <!-- Glacial Stratified Wall Gradient (Old Deep Ice to Top Firn) -->
          <linearGradient id="wallGrad_${filterId}" x1="0%" y1="100%" x2="0%" y2="0%">
            <stop offset="0%" stop-color="#0284C7" stop-opacity="0.9" />
            <stop offset="40%" stop-color="#38BDF8" stop-opacity="0.95" />
            <stop offset="85%" stop-color="#BAE6FD" />
            <stop offset="100%" stop-color="#F0F9FF" />
          </linearGradient>

          <!-- Sunlit Snow Plateau Gradient -->
          <linearGradient id="plateauGrad_${filterId}" x1="0%" y1="0%" x2="100%" y2="100%">
            <stop offset="0%" stop-color="#FFFFFF" />
            <stop offset="55%" stop-color="#F0F9FF" />
            <stop offset="100%" stop-color="#DDF0F8" />
          </linearGradient>
        </defs>

        <!-- 1. Hydrodynamic Bow Waves & Trailing Wake (Aligned with Heading) -->
        <path d="M ${hw - 14} -4 Q ${hw} -9 ${hw + 14} -4" fill="none" stroke="rgba(255,255,255,0.45)" stroke-width="1.2" stroke-dasharray="2,3" />
        <path d="M ${hw - 8} ${heightPx + 6} Q ${hw} ${heightPx + 11} ${hw + 8} ${heightPx + 6}" fill="none" stroke="rgba(14,165,233,0.35)" stroke-width="1.0" />

        <!-- 2. Subsurface Glacial Bulk (90% Submerged Ice Shelf Glow) -->
        <polygon points="
          ${hw * 0.15},${hh * 0.3} 
          ${widthPx * 0.92},${hh * 0.2} 
          ${widthPx + 5},${heightPx * 0.75} 
          ${widthPx * 0.85},${heightPx + 5} 
          ${hw * 0.4},${heightPx + 4} 
          -3,${heightPx * 0.65}
        " fill="rgba(6, 182, 212, 0.42)" filter="url(#${filterId})" />

        <!-- 3. Waterline Caustic Rim -->
        <polygon points="
          ${hw * 0.2},${hh * 0.4} 
          ${widthPx * 0.88},${hh * 0.3} 
          ${widthPx + 2},${heightPx * 0.72} 
          ${widthPx * 0.8},${heightPx + 2} 
          ${hw * 0.45},${heightPx + 1} 
          0,${heightPx * 0.6}
        " fill="rgba(186, 230, 253, 0.3)" stroke="#0284C7" stroke-width="0.8" />

        <!-- 4. Vertical Sheer Calving Cliffs (Southeast Shadow & Stratification) -->
        <polygon points="
          4,${heightPx * 0.52} 
          ${widthPx * 0.48 + notchVariation},${heightPx * 0.45} 
          ${widthPx - 3},${heightPx * 0.5} 
          ${widthPx - 1},${heightPx - 2} 
          ${widthPx * 0.5},${heightPx} 
          3,${heightPx - 3}
        " fill="url(#wallGrad_${filterId})" />

        <!-- Horizontal Ice Stratification Seams (Centuries of Compressed Antarctic Firn) -->
        <line x1="6" y1="${heightPx * 0.68}" x2="${widthPx - 4}" y2="${heightPx * 0.65}" stroke="#0369A1" stroke-width="0.6" stroke-opacity="0.55" />
        <line x1="8" y1="${heightPx * 0.82}" x2="${widthPx - 6}" y2="${heightPx * 0.78}" stroke="#075985" stroke-width="0.5" stroke-opacity="0.45" />

        <!-- 5. Subaerial Tabular Plateau (Snow-Covered Deck) -->
        <polygon points="
          6,${heightPx * 0.32} 
          ${widthPx * 0.42 + notchVariation},${heightPx * 0.18} 
          ${widthPx - 5},${heightPx * 0.22} 
          ${widthPx - 2},${heightPx * 0.52} 
          ${widthPx * 0.48 + notchVariation},${heightPx * 0.45} 
          4,${heightPx * 0.52}
        " fill="url(#plateauGrad_${filterId})" stroke="#7DD3FC" stroke-width="0.9" />

        <!-- Specular Sunlit Rim (Windward Crest Highlight) -->
        <polyline points="
          6,${heightPx * 0.32} 
          ${widthPx * 0.42 + notchVariation},${heightPx * 0.18} 
          ${widthPx - 5},${heightPx * 0.22}
        " fill="none" stroke="#FFFFFF" stroke-width="1.4" stroke-linecap="round" />

        <!-- Deep Plateau Crevasse Fissure -->
        <path d="M ${widthPx * 0.35} ${heightPx * 0.26} L ${widthPx * 0.52} ${heightPx * 0.38} L ${widthPx * 0.68} ${heightPx * 0.32}" fill="none" stroke="#0284C7" stroke-width="0.75" stroke-dasharray="3,1.5" />
      </g>
    `;
  } else {
    // -------------------------------------------------------------
    // PINNACLED & WEATHERED ICEBERG (Class C & B: B-15z-3, D-30b)
    // Multi-faceted crystalline peaks with sharp sunlit ridge lines
    // -------------------------------------------------------------
    const hw = widthPx / 2;
    const hh = heightPx / 2;

    bergSvgBody = `
      <g transform="rotate(${heading}, ${hw}, ${hh})">
        <defs>
          <filter id="${filterId}" x="-40%" y="-40%" width="180%" height="180%">
            <feGaussianBlur in="SourceGraphic" stdDeviation="3.5" result="blur" />
            <feColorMatrix in="blur" type="matrix" values="
              0 0 0 0 0.05
              0 0 0 0 0.85
              0 0 0 0 0.95
              0 0 0 0.6 0" />
            <feMerge>
              <feMergeNode />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        <!-- 1. Underwater Keel Scatter -->
        <polygon points="
          2,${heightPx * 0.5} 
          ${hw},1 
          ${widthPx + 2},${heightPx * 0.45} 
          ${widthPx * 0.65},${heightPx + 3} 
          ${widthPx * 0.25},${heightPx + 2}
        " fill="rgba(6, 182, 212, 0.45)" filter="url(#${filterId})" />

        <!-- 2. Lit Crystal Facet (Sun from Northwest) -->
        <polygon points="
          4,${heightPx * 0.55} 
          ${hw + notchVariation},3 
          ${hw * 0.9},${heightPx * 0.82} 
          5,${heightPx * 0.82}
        " fill="#FFFFFF" stroke="#BAE6FD" stroke-width="0.8" />

        <!-- 3. Shaded Blue Ridge Facet -->
        <polygon points="
          ${hw + notchVariation},3 
          ${widthPx - 3},${heightPx * 0.48} 
          ${widthPx - 5},${heightPx * 0.85} 
          ${hw * 0.9},${heightPx * 0.82}
        " fill="#38BDF8" stroke="#0284C7" stroke-width="0.8" />

        <!-- 4. Deep Crevasse Infill -->
        <polygon points="
          ${hw * 0.9},${heightPx * 0.82} 
          ${widthPx - 5},${heightPx * 0.85} 
          ${hw * 0.8},${heightPx} 
          5,${heightPx * 0.82}
        " fill="#0369A1" />

        <!-- Sunlit Spire Tip Specular Glint -->
        <circle cx="${hw + notchVariation}" cy="3" r="1.3" fill="#E0F2FE" />
      </g>
    `;
  }

  // -------------------------------------------------------------
  // SLEEK NAUTICAL AIS TELEMETRY PILL
  // Compact, high-contrast, non-overlapping chart label
  // -------------------------------------------------------------
  const lengthKm = (berg.length_m / 1000).toFixed(isMegaberg ? 1 : 2);
  const speedKnots = (berg.drift_speed_knots || 1.1).toFixed(1);

  const labelHtml = uiMode === "civilian"
    ? `
      <div style="
        margin-top: 3px;
        background: ${isSelected ? '#0284C7' : 'rgba(255, 255, 255, 0.95)'};
        color: ${isSelected ? '#FFFFFF' : '#0F172A'};
        border: 1px solid ${hazardColor};
        border-radius: 4px;
        padding: 1px 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.2);
        white-space: nowrap;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="font-size: 9.5px; font-weight: 700; display: flex; align-items: center; justify-content: center; gap: 3px;">
          <span style="width: 5px; height: 5px; border-radius: 50%; background: ${hazardColor};"></span>
          <span>${berg.iceberg_id}</span>
          ${isMegaberg ? `<span style="font-size: 7px; background: ${hazardColor}; color: #fff; padding: 0 2px; border-radius: 2px; font-weight: bold;">MEGA</span>` : ''}
        </div>
        ${isSelected ? `
          <div style="font-size: 8px; color: #E0F2FE; font-weight: 500; margin-top: 1px;">
            ${lengthKm}km • ${speedKnots}kts
          </div>
        ` : ''}
      </div>
    `
    : `
      <div style="
        margin-top: 3px;
        background: ${isSelected ? '#0F172A' : 'rgba(15, 23, 42, 0.88)'};
        border: 1px solid ${isSelected ? hazardColor : 'rgba(148, 163, 184, 0.4)'};
        border-left: 2.5px solid ${hazardColor};
        border-radius: 2px;
        padding: 1px 4px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.35);
        white-space: nowrap;
        text-align: center;
        backdrop-filter: blur(4px);
        font-family: 'JetBrains Mono', 'Courier New', monospace;
      ">
        <div style="font-size: 9px; font-weight: 700; color: #F8FAFC; display: flex; align-items: center; justify-content: center; gap: 3px;">
          <span>${berg.iceberg_id}</span>
          ${isMegaberg ? `<span style="font-size: 7px; background: ${hazardColor}; color: #fff; padding: 0 2px; border-radius: 1px; font-weight: 800;">D</span>` : ''}
        </div>
        ${isSelected ? `
          <div style="font-size: 7.5px; color: #38BDF8; margin-top: 1px;">
            ${driftDistNM > 0 ? `+${driftDistNM.toFixed(0)}NM ` : ''}${speedKnots}kts @ ${heading}°
          </div>
        ` : ''}
      </div>
    `;

  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
      ${isSelected ? `
        <!-- Tactical Target Brackets on Selection (No Circle) -->
        <div style="
          position: absolute;
          width: ${widthPx + 14}px;
          height: ${heightPx + 14}px;
          top: ${heightPx / 2}px;
          left: ${widthPx / 2}px;
          margin-top: -${(heightPx + 14) / 2}px;
          margin-left: -${(widthPx + 14) / 2}px;
          border: 1.5px solid ${hazardColor};
          border-style: solid;
          opacity: 0.85;
          pointer-events: none;
          box-shadow: 0 0 8px ${hazardColor}66;
        "></div>
      ` : ''}

      <!-- Realistic 2.5D SVG Iceberg Body -->
      <svg width="${widthPx + 12}" height="${heightPx + 12}" viewBox="0 0 ${widthPx + 12} ${heightPx + 12}" style="overflow: visible; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.35));">
        ${bergSvgBody}
      </svg>

      <!-- Sleek Nautical Telemetry Pill -->
      ${labelHtml}
    </div>
  `;
}

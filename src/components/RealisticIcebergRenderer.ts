import { Iceberg } from "../types";

/**
 * Procedural Realistic Iceberg Graphic Renderer
 * Generates authentic SVG representations of Antarctic icebergs:
 * - Subsurface turquoise glacial bulk (showing the 90% underwater keel)
 * - Multi-faceted crystalline surface with sunlight/shadow relief
 * - Jagged calved edge fractures for tabular megabergs (A-23a, A-81, B-15z)
 * - Sharp pinnacled ridges for medium/small bergs
 * - Dynamic heading alignment and proportional scaling
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

  // Hazard color accents
  const hazardColor =
    berg.hazard_level === "CRITICAL"
      ? "#B23A2F"
      : berg.hazard_level === "HIGH"
      ? "#A9700F"
      : berg.hazard_level === "MODERATE"
      ? "#0E7C93"
      : "#059669";

  // Dimensions
  const widthPx = isMegaberg ? 56 : berg.size_class === "C" ? 44 : 34;
  const heightPx = isMegaberg ? 42 : berg.size_class === "C" ? 34 : 26;

  // Unique visual seed from ID
  const hash = berg.iceberg_id.split("").reduce((acc, c) => acc + c.charCodeAt(0), 0);
  const facetVariation = (hash % 5) - 2;

  // Glacial Ice Colors:
  // - Deep underwater ice: glowing glacial cyan-turquoise (#00A6B8 with opacity)
  // - Lit surface faces: bright crystalline snow white (#FFFFFF, #F0F9FD)
  // - Shaded crevasse slopes: cool arctic blue (#A4CDE0, #7AA4BA)
  // - Crevasse fracture shadow: #4A6E82

  let bergShapeSvg = "";

  if (isMegaberg) {
    // Tabular Megaberg: Massive calved ice shelf slab with irregular perimeter & crevasse rifts
    bergShapeSvg = `
      <g transform="rotate(${heading}, ${widthPx / 2}, ${heightPx / 2})">
        <!-- Subsurface Glacial Bulk (Undersea Keel foot shelf) -->
        <polygon points="
          4,8 
          ${widthPx - 3},6 
          ${widthPx + 4},${heightPx - 4} 
          ${widthPx - 6},${heightPx + 6} 
          2,${heightPx + 4}
        " fill="rgba(14, 165, 196, 0.42)" filter="drop-shadow(0 0 6px rgba(14, 165, 196, 0.65))" />
        
        <!-- Waterline Caustic Rim -->
        <polygon points="
          6,10 
          ${widthPx - 5},8 
          ${widthPx + 1},${heightPx - 6} 
          ${widthPx - 8},${heightPx + 3} 
          4,${heightPx + 2}
        " fill="rgba(180, 235, 248, 0.55)" stroke="#0E7C93" stroke-width="0.75" />

        <!-- Subaerial Tabular Plateau (Above Water Mass) -->
        <polygon points="
          8,12 
          ${widthPx * 0.45 + facetVariation},10 
          ${widthPx - 8},11 
          ${widthPx - 4},${heightPx * 0.55} 
          ${widthPx - 10},${heightPx - 8} 
          ${widthPx * 0.4},${heightPx - 6} 
          7,${heightPx - 9}
        " fill="#F4FAFD" stroke="#90B4C8" stroke-width="1.2" />

        <!-- Shaded Ice Wall Facets (Sun from Top-Left) -->
        <polygon points="
          8,12 
          ${widthPx * 0.45 + facetVariation},10 
          ${widthPx * 0.42},${heightPx * 0.48} 
          7,${heightPx * 0.5}
        " fill="#E8F4F8" />

        <polygon points="
          ${widthPx * 0.45 + facetVariation},10 
          ${widthPx - 8},11 
          ${widthPx - 4},${heightPx * 0.55} 
          ${widthPx * 0.48},${heightPx * 0.46}
        " fill="#D3E7F0" />

        <polygon points="
          ${widthPx * 0.48},${heightPx * 0.46} 
          ${widthPx - 4},${heightPx * 0.55} 
          ${widthPx - 10},${heightPx - 8} 
          ${widthPx * 0.4},${heightPx - 6}
        " fill="#A8C9DA" />

        <!-- Crevasse / Rifts -->
        <line x1="${widthPx * 0.35}" y1="${heightPx * 0.3}" x2="${widthPx * 0.55}" y2="${heightPx * 0.42}" stroke="#567D92" stroke-width="0.8" stroke-dasharray="2,1" />
        <line x1="${widthPx * 0.6}" y1="${heightPx * 0.25}" x2="${widthPx * 0.72}" y2="${heightPx * 0.5}" stroke="#567D92" stroke-width="0.7" />
      </g>
    `;
  } else {
    // Pinnacled / Wedge Iceberg: Dynamic crystalline peaks with sharp shadow ridges
    bergShapeSvg = `
      <g transform="rotate(${heading}, ${widthPx / 2}, ${heightPx / 2})">
        <!-- Subsurface Keel Glow -->
        <polygon points="
          2,${heightPx * 0.5} 
          ${widthPx * 0.5},3 
          ${widthPx + 3},${heightPx * 0.45} 
          ${widthPx * 0.6},${heightPx + 4} 
          ${widthPx * 0.3},${heightPx + 3}
        " fill="rgba(14, 165, 196, 0.45)" filter="drop-shadow(0 0 5px rgba(14, 165, 196, 0.6))" />

        <!-- Lit Crystalline Peak -->
        <polygon points="
          5,${heightPx * 0.55} 
          ${widthPx * 0.48 + facetVariation},6 
          ${widthPx * 0.45},${heightPx * 0.7} 
          6,${heightPx * 0.7}
        " fill="#FFFFFF" stroke="#BDD6E3" stroke-width="0.9" />

        <!-- Shadow Ridge Facet -->
        <polygon points="
          ${widthPx * 0.48 + facetVariation},6 
          ${widthPx - 5},${heightPx * 0.5} 
          ${widthPx - 8},${heightPx * 0.78} 
          ${widthPx * 0.45},${heightPx * 0.7}
        " fill="#88B1C8" stroke="#6893AA" stroke-width="0.9" />

        <!-- Highlighted Spire Tip -->
        <circle cx="${widthPx * 0.48 + facetVariation}" cy="6" r="1.5" fill="#E0F7FF" />
      </g>
    `;
  }

  // Label styling based on UI mode
  const labelHtml = uiMode === "civilian"
    ? `
      <div style="
        margin-top: 3px;
        background: rgba(255, 255, 255, 0.96);
        border: 1.5px solid ${hazardColor};
        border-radius: 4px;
        padding: 2px 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.18);
        white-space: nowrap;
        text-align: center;
        font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      ">
        <div style="font-size: 11px; font-weight: 800; color: #12202B; display: flex; align-items: center; justify-content: center; gap: 4px;">
          <span>${berg.iceberg_id}</span>
          ${isMegaberg ? '<span style="font-size: 8px; background: #B23A2F; color: #fff; padding: 0.5px 3px; border-radius: 2px; font-weight: 700;">MEGABERG</span>' : ''}
        </div>
        <div style="font-size: 9px; color: #57707E; font-weight: 500;">
          ${(berg.length_m / 1000).toFixed(0)} km wide • ${berg.drift_speed_knots} kts
        </div>
      </div>
    `
    : `
      <div style="
        margin-top: 2px;
        background: ${isSelected ? '#12202B' : 'rgba(255, 255, 255, 0.96)'};
        border: 1.5px solid ${hazardColor};
        border-radius: 0px;
        padding: 1px 5px;
        box-shadow: 0 2px 6px rgba(0,0,0,0.22);
        white-space: nowrap;
        text-align: center;
        font-family: 'JetBrains Mono', monospace;
      ">
        <div style="font-size: 10px; font-weight: 800; color: ${isSelected ? '#FFFFFF' : '#12202B'}; display: flex; align-items: center; justify-content: center; gap: 3px;">
          <span>${berg.iceberg_id}</span>
          ${isMegaberg ? `<span style="font-size: 8px; background: ${hazardColor}; color: #fff; padding: 0 2px; font-weight: bold;">MEGA</span>` : ''}
        </div>
        <div style="font-size: 8px; color: ${isSelected ? '#A4CDE0' : '#57707E'};">
          ${driftDistNM > 0 ? `+${driftDistNM.toFixed(0)}NM ` : ''}${berg.drift_speed_knots}kts @ ${heading}°
        </div>
      </div>
    `;

  return `
    <div style="position: relative; display: flex; flex-direction: column; align-items: center; cursor: pointer; transform: translate(-50%, -50%);">
      ${isPlaying ? `
        <!-- Dynamic Simulation Sonar/Radar Ping Ring -->
        <div class="animate-radar-pulse" style="
          position: absolute;
          width: ${widthPx + 24}px;
          height: ${heightPx + 24}px;
          top: ${heightPx / 2}px;
          left: ${widthPx / 2}px;
          margin-top: -${(heightPx + 24) / 2}px;
          margin-left: -${(widthPx + 24) / 2}px;
          border-radius: 50%;
          border: 1.5px solid ${hazardColor};
          pointer-events: none;
        "></div>
      ` : ''}

      <!-- Realistic SVG Iceberg Body -->
      <svg width="${widthPx + 8}" height="${heightPx + 8}" viewBox="0 0 ${widthPx + 8} ${heightPx + 8}" style="overflow: visible; filter: drop-shadow(0 3px 6px rgba(0,0,0,0.3));">
        ${bergShapeSvg}
      </svg>

      <!-- Context Label (Naval vs Civilian) -->
      ${labelHtml}
    </div>
  `;
}

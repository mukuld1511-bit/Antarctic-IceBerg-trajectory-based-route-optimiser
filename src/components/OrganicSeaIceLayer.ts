import L from "leaflet";
import { SICCell } from "../types";

/**
 * Organic Sea-Ice Concentration (SIC) Canvas Layer
 * Replaces coarse blocky grid rectangles with satellite-grade organic sea-ice pack rendering:
 * - Smooth overlapping radial Gaussian concentration gradients
 * - Multi-scale crystalline color mapping (frost white multi-year ice, turquoise pack ice, cyan marginal leads)
 * - Procedural fracture networks (polar leads / open water cracks between ice floes)
 * - Subsurface glacial luminescence and soft natural edge falloff
 */

export class OrganicSeaIceLayer {
  private map: L.Map;
  private canvas: HTMLCanvasElement;
  private ctx: CanvasRenderingContext2D | null;
  private cells: SICCell[] = [];
  private opacity: number = 0.85;
  private visible: boolean = true;
  private attached: boolean = false;

  constructor(map: L.Map) {
    this.map = map;
    this.canvas = L.DomUtil.create("canvas", "leaflet-organic-sic-canvas");
    this.canvas.style.position = "absolute";
    this.canvas.style.pointerEvents = "none";
    this.canvas.style.zIndex = "250"; // Above bathymetry, below route & markers
    this.ctx = this.canvas.getContext("2d");

    this.onMove = this.onMove.bind(this);
  }

  public attach() {
    if (this.attached) return;
    const pane = this.map.getPanes().overlayPane;
    pane.appendChild(this.canvas);
    this.map.on("move moveend zoomend resize", this.onMove);
    this.attached = true;
    this.redraw();
  }

  public detach() {
    if (!this.attached) return;
    this.map.off("move moveend zoomend resize", this.onMove);
    if (this.canvas.parentNode) {
      this.canvas.parentNode.removeChild(this.canvas);
    }
    this.attached = false;
  }

  public updateData(cells: SICCell[], opacity: number, visible: boolean) {
    this.cells = cells;
    this.opacity = opacity;
    this.visible = visible;
    this.redraw();
  }

  private onMove() {
    this.redraw();
  }

  public redraw() {
    if (!this.attached || !this.ctx || !this.visible) {
      if (this.ctx && this.canvas) {
        this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
      }
      return;
    }

    const map = this.map;
    const size = map.getSize();
    const bounds = map.getBounds();

    // Align canvas with the current map layer bounds
    const topLeft = map.latLngToLayerPoint(bounds.getNorthWest());
    L.DomUtil.setPosition(this.canvas, topLeft);

    // Update pixel dimensions if resized
    if (this.canvas.width !== size.x || this.canvas.height !== size.y) {
      this.canvas.width = size.x;
      this.canvas.height = size.y;
    }

    const ctx = this.ctx;
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);

    if (!Array.isArray(this.cells) || this.cells.length === 0) return;

    ctx.save();
    ctx.globalAlpha = this.opacity;

    // First Pass: Continuous organic sea-ice pack field with smooth radial gradients
    // We project each cell and blend overlapping concentrations seamlessly
    const currentZoom = map.getZoom();
    // Dynamically scale footprint radius based on latitude resolution (~1.0 deg) and map zoom
    const samplePoint = map.latLngToContainerPoint([-70, 0]);
    const samplePointOffset = map.latLngToContainerPoint([-69, 0]);
    const baseRadiusPx = Math.max(16, Math.abs(samplePoint.y - samplePointOffset.y) * 1.35);

    // Filter to visible cells in viewport + buffer
    const latBuffer = 3.0;
    const lonBuffer = 6.0;
    const minLat = bounds.getSouth() - latBuffer;
    const maxLat = bounds.getNorth() + latBuffer;
    const minLon = bounds.getWest() - lonBuffer;
    const maxLon = bounds.getEast() + lonBuffer;

    const visibleCells = this.cells.filter(
      (c) => c && c.lat >= minLat && c.lat <= maxLat && c.lon >= minLon && c.lon <= maxLon && c.sic >= 0.08
    );

    // 1. Draw smooth blended radial sea ice field
    for (const cell of visibleCells) {
      const pt = map.latLngToContainerPoint([cell.lat, cell.lon]);
      const sic = cell.sic;

      // Skip off-screen
      if (pt.x < -baseRadiusPx * 2 || pt.x > size.x + baseRadiusPx * 2 || pt.y < -baseRadiusPx * 2 || pt.y > size.y + baseRadiusPx * 2) {
        continue;
      }

      const radius = baseRadiusPx * (0.85 + sic * 0.45);
      const grad = ctx.createRadialGradient(pt.x, pt.y, 0, pt.x, pt.y, radius);

      if (sic > 0.75) {
        // Consolidated multi-year fast ice: brilliant crystalline white core with frost-cyan rim
        grad.addColorStop(0, "rgba(255, 255, 255, 0.96)");
        grad.addColorStop(0.45, "rgba(235, 248, 255, 0.90)");
        grad.addColorStop(0.75, "rgba(175, 230, 245, 0.72)");
        grad.addColorStop(1, "rgba(75, 185, 215, 0.0)");
      } else if (sic > 0.45) {
        // Close pack ice: luminous glacial turquoise
        grad.addColorStop(0, "rgba(215, 245, 255, 0.88)");
        grad.addColorStop(0.5, "rgba(140, 220, 240, 0.75)");
        grad.addColorStop(0.8, "rgba(75, 175, 210, 0.45)");
        grad.addColorStop(1, "rgba(35, 130, 180, 0.0)");
      } else if (sic > 0.22) {
        // Open pack ice: drifting crystalline floes
        grad.addColorStop(0, "rgba(160, 225, 245, 0.70)");
        grad.addColorStop(0.6, "rgba(85, 175, 215, 0.45)");
        grad.addColorStop(1, "rgba(40, 120, 180, 0.0)");
      } else {
        // Marginal ice zone / brash ice: soft polar ocean cyan
        grad.addColorStop(0, "rgba(100, 195, 230, 0.45)");
        grad.addColorStop(0.7, "rgba(45, 140, 190, 0.22)");
        grad.addColorStop(1, "rgba(25, 95, 155, 0.0)");
      }

      ctx.fillStyle = grad;
      ctx.beginPath();
      ctx.arc(pt.x, pt.y, radius, 0, Math.PI * 2);
      ctx.fill();
    }

    // 2. Procedural Fractured Leads (Natural cracks in consolidated pack ice)
    // Simulates realistic satellite SAR fractures where dark polar water shows between floes
    if (currentZoom >= 4) {
      ctx.strokeStyle = "rgba(18, 55, 85, 0.42)";
      ctx.lineWidth = Math.max(0.75, Math.min(2.0, currentZoom * 0.3));
      ctx.lineCap = "round";

      for (let i = 0; i < visibleCells.length; i += 3) {
        const cell = visibleCells[i];
        if (cell.sic < 0.55) continue;

        const pt = map.latLngToContainerPoint([cell.lat, cell.lon]);
        const hash = Math.sin(cell.lat * 12.9898 + cell.lon * 78.233) * 43758.5453;
        const seed = hash - Math.floor(hash);

        // Draw 1-2 jagged fracture veins across this consolidated floe
        const angle = seed * Math.PI * 2;
        const len = baseRadiusPx * (0.6 + seed * 0.5);
        const startX = pt.x - (Math.cos(angle) * len) / 2;
        const startY = pt.y - (Math.sin(angle) * len) / 2;

        ctx.beginPath();
        ctx.moveTo(startX, startY);
        // Jagged mid-point bend
        const midX = pt.x + (seed - 0.5) * 8;
        const midY = pt.y + (0.5 - seed) * 8;
        const endX = pt.x + (Math.cos(angle) * len) / 2;
        const endY = pt.y + (Math.sin(angle) * len) / 2;
        ctx.quadraticCurveTo(midX, midY, endX, endY);
        ctx.stroke();
      }
    }

    ctx.restore();
  }
}

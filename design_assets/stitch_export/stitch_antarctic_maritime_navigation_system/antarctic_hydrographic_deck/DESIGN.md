---
name: Antarctic Hydrographic Deck
colors:
  surface: '#f5fafd'
  surface-dim: '#d6dbde'
  surface-bright: '#f5fafd'
  surface-container-lowest: '#ffffff'
  surface-container-low: '#eff4f7'
  surface-container: '#eaeff2'
  surface-container-high: '#e4e9ec'
  surface-container-highest: '#dee3e6'
  on-surface: '#171c1f'
  on-surface-variant: '#3e484c'
  inverse-surface: '#2c3134'
  inverse-on-surface: '#ecf1f4'
  outline: '#6e797c'
  outline-variant: '#bec8cc'
  surface-tint: '#00687c'
  primary: '#006275'
  on-primary: '#ffffff'
  primary-container: '#0e7c93'
  on-primary-container: '#ecfaff'
  inverse-primary: '#7cd3ec'
  secondary: '#49626f'
  on-secondary: '#ffffff'
  secondary-container: '#cce6f7'
  on-secondary-container: '#4f6876'
  tertiary: '#7c5000'
  on-tertiary: '#ffffff'
  tertiary-container: '#9d6600'
  on-tertiary-container: '#fff6f0'
  error: '#ba1a1a'
  on-error: '#ffffff'
  error-container: '#ffdad6'
  on-error-container: '#93000a'
  primary-fixed: '#b0ecff'
  primary-fixed-dim: '#7cd3ec'
  on-primary-fixed: '#001f27'
  on-primary-fixed-variant: '#004e5e'
  secondary-fixed: '#cce6f7'
  secondary-fixed-dim: '#b0cada'
  on-secondary-fixed: '#021e2a'
  on-secondary-fixed-variant: '#314a57'
  tertiary-fixed: '#ffddb5'
  tertiary-fixed-dim: '#feb957'
  on-tertiary-fixed: '#2a1800'
  on-tertiary-fixed-variant: '#633f00'
  background: '#f5fafd'
  on-background: '#171c1f'
  surface-variant: '#dee3e6'
typography:
  display-lg:
    fontFamily: Inter
    fontSize: 32px
    fontWeight: '600'
    lineHeight: 38px
  headline-md:
    fontFamily: Inter
    fontSize: 22px
    fontWeight: '600'
    lineHeight: 28px
  headline-sm:
    fontFamily: Inter
    fontSize: 16px
    fontWeight: '600'
    lineHeight: 22px
  body-lg:
    fontFamily: Inter
    fontSize: 15px
    fontWeight: '400'
    lineHeight: 22px
  body-md:
    fontFamily: Inter
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  body-sm:
    fontFamily: Inter
    fontSize: 12px
    fontWeight: '400'
    lineHeight: 16px
  data-mono-lg:
    fontFamily: JetBrains Mono
    fontSize: 18px
    fontWeight: '500'
    lineHeight: 24px
  data-mono-md:
    fontFamily: JetBrains Mono
    fontSize: 13px
    fontWeight: '400'
    lineHeight: 18px
  data-mono-sm:
    fontFamily: JetBrains Mono
    fontSize: 11px
    fontWeight: '400'
    lineHeight: 14px
  label-caps:
    fontFamily: Inter
    fontSize: 10px
    fontWeight: '600'
    lineHeight: 12px
spacing:
  grid-hairline: 1px
  pad-micro: 0.25rem
  pad-tight: 0.5rem
  pad-compact: 0.75rem
  pad-base: 1rem
  pad-deck: 1.5rem
  panel-gap: 0.5rem
  gutter: 1rem
  margin-screen: 1rem
---

## Brand & Style

This design system delivers an operational interface for ice-class vessel masters, ice pilots, and polar researchers conducting expeditions in the Southern Ocean. The visual ethos merges the cartographic authority of British Admiralty hydrographic charts with the tactile, high-precision calibration of bridge brass instrumentation and modern polar bathymetric telemetry.

The aesthetic balance reflects calm, clinical precision under critical cognitive load. Every pixel serves situational awareness across extreme environmental conditions: whiteouts, night watches under red-tint bridge lighting, and high-glare sea-ice observation. It eschews generic consumer software tropes—there are no playful rounded corners, ambient blur washes, or decorative gradients. Instead, the interface relies on hairline hydrographic rulings, structured information density, strictly categorized data states, and utilitarian coordinate readouts reminiscent of precision navigational repeaters.

## Colors

The palette simulates matte, water-resistant nautical chart paper under natural sub-Antarctic overcast daylight.

- **Base Field (`#EEF3F6`)**: The primary deck canvas. Mimics cold pack-ice water wash and unprinted chart margins.
- **Panel Surface (`#FFFFFF`)**: Pure flat white, representing working chart zones and primary operational instrument modules.
- **Hairline Grids & Dividers (`#D7E1E8`)**: Direct parallel to bathymetric contour lines and meridians/parallels. Used for structural containment without creating heavy visual partitions.
- **Primary Ink (`#12202B`)**: Deep navy-charcoal drawing from archival maritime plotters. Used for primary typography, vital readings, and active vector headings.
- **Muted Slate (`#57707E`)**: Technical metadata, units of measure, inactive chart overlays, and grid indexing labels.
- **Instrument Cyan (`#0E7C93`)**: Primary operational accent; denotes active tools, selected waypoints, depth sounder focus, and interactive state triggers.
- **Maritime Caution Amber (`#A9700F`)**: Ice shelf proximity alerts, marginal sea-ice concentration (4/10 to 6/10 coverage), and draft clearance warnings.
- **Navigational Coral Red (`#B23A2F`)**: Critical alerts: multi-year floe collision risk, pressure ridge closure, hull strain limits, or depth sounding below safety contour.
- **Hydrographic Sea Green (`#059669`)**: Clear pack passages, nominal engine telemetry, verified safe leads, and active GPS lock.

## Typography

Typography is split categorically into two structural domains:

1. **Operational Narrative & Navigation (Inter)**: Applied to deck labels, advisory panels, system configuration, dialogs, and situational reports. Line heights are kept tight to prevent loose layout flow. Caps are reserved strictly for technical acronyms (e.g., SOG, COG, ECDIS, NCPOR) and micro section tags; standard sentence case is mandatory elsewhere.
2. **Telemetry, Spatial Coordinates & Chronometry (JetBrains Mono)**: Applied strictly to latitude/longitude (`64°48'32"S 064°04'00"W`), UTC timestamps (`2025-01-14T03:22:18Z`), gyro headings (`042.5°T`), vessel drift knots, bathymetric fathoms/meters, and sensor status flags. The monospaced alignment preserves vertical column integrity during high-frequency data refresh rates.

## Layout & Spacing

The layout model is an instrument matrix: a structured, dense grid that accommodates simultaneous vector chart feeds, sonar readouts, weather overlay streams, and engine/rudder telemetry.

- **Grid Architecture**: 12-column variable fluid grid locked to a minimum 1280px operational deck view. Margin gutters are fixed at `1rem` to maximize operational canvas area.
- **Tile Abutment**: Panels abut one another using single-pixel (`#D7E1E8`) borders rather than wide gutters, mirroring maritime console tiles.
- **Vertical Rhythm**: Built upon a strict 4px base increment. High-frequency telemetry cells utilize `0.25rem` (4px) and `0.5rem` (8px) internal padding to maintain compact visibility without scroll sprawl.
- **Reflow Rules**: On multi-screen bridge displays, the chart maintains a dominant 8-column canvas while auxiliary telemetry tiles collapse into twin 2-column flanking strips. On portable tablet terminals used on the bridge wings, the flanking strips tuck into docked slide-out drawers.

## Elevation & Depth

Visual hierarchy is maintained through crisp hairline borders and distinct tonal surfaces rather than diffused drop shadows, which can cause perceptual ambiguity on low-angle bridge monitors.

- **Zero-Depth Plane**: Background field (`#EEF3F6`) acts as datum level.
- **Instrument Surface**: Panels sit directly on the datum plane with flat pure white (`#FFFFFF`) fills, bound strictly by 1px solid borders in `#D7E1E8`.
- **Active / Focused Tier**: When an instrument cluster or route waypoint is active, its border shifts to 1px solid `#0E7C93` accompanied by an inner hairline inset (`inset 0 0 0 1px #0E7C93`), preserving structural boundaries without blurring onto adjacent charts.
- **Floating Overlays & Menus**: Fixed contextual menus and warning overlays use flat `#FFFFFF` panels reinforced by a high-definition, hard-edged technical shadow: `0 2px 4px rgba(18, 32, 43, 0.08), 0 8px 16px rgba(18, 32, 43, 0.06)`. No colored glow or glassmorphic blur filters are permitted.

## Shapes

Every component utilizes an absolute `0px` radius (Sharp / Level 0). 

Rounded geometry conflicts with the engineering rigor of navigational chart plotters, drafting dividers, and marine bridge consoles. Every boundary, button, telemetry tag, tab selector, and panel border is strictly orthogonal. Where directional indicators or status pips are required, 45-degree chamfers or precise geometric symbols (rhombus, square, crosshair) replace rounded dots and pills.

## Components

### Action Triggers & Navigational Buttons
- **Primary Operational Action**: Solid `#0E7C93` fill, `#FFFFFF` Inter bold text, 0px border radius, vertical height of 36px, with 12px horizontal padding. Hover state: `#0A5C6D`. Active press: 1px internal inset `#12202B`.
- **Secondary / Chart Utility Action**: White background, `#12202B` text, bounded by 1px solid `#D7E1E8`. Hover: background `#EEF3F6`, border `#57707E`.
- **Hazard Action (e.g., Ice Clearance Override)**: White background, `#B23A2F` text, 1px solid `#B23A2F`. Hover: solid `#B23A2F` with white text.

### Telemetry Tags & Chips
- Monospaced readout badges (`JetBrains Mono`, 11px) enclosed in a 1px border.
- **Nominal Sea Ice / Open Lead**: `#059669` text, background tint `rgba(5, 150, 105, 0.08)`, border `rgba(5, 150, 105, 0.3)`.
- **Cautionary Drift**: `#A9700F` text, background tint `rgba(169, 112, 15, 0.08)`, border `rgba(169, 112, 15, 0.3)`.
- **Pack Ice Critical**: `#B23A2F` text, background tint `rgba(178, 58, 47, 0.08)`, border `rgba(178, 58, 47, 0.4)`.

### Instrument Field Inputs & Parameter Entry
- Sharp rectangular containers (`height: 34px`), `#FFFFFF` background, 1px `#D7E1E8` hairline.
- Focus: 1px border `#0E7C93` with an immediate sharp bracket visual anchor in the corner.
- Monospace mode is default for numerical entries (latitude, knot limits, bearing inputs). Prefixes and suffixes (e.g., `°T`, `kts`, `m`) use `#57707E` locked in fixed-width trailing blocks.

### Chart Inspection Cards & Sensor Readout Blocks
- Modular, sharp panels framed in `#D7E1E8`. 
- Header bar: Flat `#EEF3F6` bar, 26px height, uppercase 10px tracking `#57707E` label on the left, UTC timestamp on the right.
- Content body: Flat white `#FFFFFF` surface with data-row partitions rendered as 1px dotted `#D7E1E8` dividers.

### Hydrographic Depth Sounder & Bathymetric Sliders
- Strict linear tracks using a 2px `#D7E1E8` spine.
- Thumb: 12x12px square or brass-needle pointer `#0E7C93` without shadow, locked to coordinate tick-marks.
- Tick-marks: Alternating 4px and 8px hairline notches spaced across depth gradients.
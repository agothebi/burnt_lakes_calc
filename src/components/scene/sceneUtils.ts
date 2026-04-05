// ─────────────────────────────────────────────────────────────────────────────
// Color interpolation
// ─────────────────────────────────────────────────────────────────────────────

type RGB = [number, number, number]

export interface ColorStop {
  at: number
  color: RGB
}

function lerpRGB(a: RGB, b: RGB, t: number): string {
  const r = Math.round(a[0] + (b[0] - a[0]) * t)
  const g = Math.round(a[1] + (b[1] - a[1]) * t)
  const bl = Math.round(a[2] + (b[2] - a[2]) * t)
  return `rgb(${r},${g},${bl})`
}

/** Interpolate a multi-stop color gradient at position t (0–1). */
export function interpolateStops(stops: ColorStop[], t: number): string {
  const clamped = Math.max(0, Math.min(1, t))
  if (clamped <= stops[0].at) return `rgb(${stops[0].color.join(',')})`
  const last = stops[stops.length - 1]
  if (clamped >= last.at) return `rgb(${last.color.join(',')})`

  for (let i = 0; i < stops.length - 1; i++) {
    const a = stops[i]
    const b = stops[i + 1]
    if (clamped >= a.at && clamped <= b.at) {
      const local = (clamped - a.at) / (b.at - a.at)
      return lerpRGB(a.color, b.color, local)
    }
  }
  return `rgb(${stops[0].color.join(',')})`
}

// ─────────────────────────────────────────────────────────────────────────────
// Scene color stops
// ─────────────────────────────────────────────────────────────────────────────

export const STOPS = {
  skyTop: [
    { at: 0,    color: [120, 195, 232] as RGB },  // clear morning blue
    { at: 0.35, color: [255, 150, 45]  as RGB },  // warm golden orange
    { at: 0.65, color: [195, 45, 20]   as RGB },  // fire red
    { at: 1,    color: [38, 5, 5]      as RGB },  // near-black crimson
  ],
  skyBot: [
    { at: 0,    color: [175, 220, 242] as RGB },  // pale blue horizon
    { at: 0.35, color: [255, 100, 28]  as RGB },  // orange glow
    { at: 0.65, color: [135, 22, 12]   as RGB },  // dark red horizon
    { at: 1,    color: [18, 5, 5]      as RGB },  // deep black-red
  ],
  sun: [
    { at: 0,    color: [255, 245, 120] as RGB },  // bright yellow-white
    { at: 0.4,  color: [255, 140, 40]  as RGB },  // deep orange
    { at: 0.75, color: [185, 55, 20]   as RGB },  // red dwarf
    { at: 1,    color: [80, 18, 8]     as RGB },  // dark ember
  ],
  mountainFar: [
    { at: 0,    color: [88, 128, 74]   as RGB },  // muted sage green
    { at: 0.5,  color: [98, 90, 68]    as RGB },  // dusty khaki
    { at: 1,    color: [58, 53, 48]    as RGB },  // ash gray
  ],
  mountainNear: [
    { at: 0,    color: [72, 108, 62]   as RGB },  // deeper green
    { at: 0.5,  color: [85, 80, 58]    as RGB },  // dead olive
    { at: 1,    color: [50, 45, 40]    as RGB },  // dark ash
  ],
  treeFar: [
    { at: 0,    color: [32, 98, 48]    as RGB },  // deep forest green
    { at: 0.38, color: [125, 112, 38]  as RGB },  // yellowing
    { at: 0.72, color: [82, 62, 30]    as RGB },  // dead brown
    { at: 1,    color: [52, 47, 42]    as RGB },  // ash silhouette
  ],
  treeNear: [
    { at: 0,    color: [22, 82, 38]    as RGB },  // lush deep green
    { at: 0.38, color: [108, 92, 28]   as RGB },  // yellowing fast
    { at: 0.72, color: [68, 52, 22]    as RGB },  // very dead
    { at: 1,    color: [42, 38, 33]    as RGB },  // charcoal
  ],
  treeTrunk: [
    { at: 0,    color: [88, 58, 22]    as RGB },  // warm brown
    { at: 0.6,  color: [65, 45, 18]    as RGB },  // dark brown
    { at: 1,    color: [35, 28, 20]    as RGB },  // charred black-brown
  ],
  water: [
    { at: 0,    color: [60, 158, 210]  as RGB },  // clear lake blue
    { at: 0.38, color: [52, 128, 158]  as RGB },  // muted blue-gray
    { at: 0.7,  color: [82, 75, 52]    as RGB },  // muddy brown
    { at: 1,    color: [48, 36, 18]    as RGB },  // dark dried mud
  ],
  waterShimmer: [
    { at: 0,    color: [200, 235, 250] as RGB },  // bright shimmer
    { at: 0.5,  color: [150, 175, 185] as RGB },  // muted
    { at: 1,    color: [80, 70, 55]    as RGB },  // dull
  ],
  lakebed: [
    { at: 0,    color: [120, 90, 55]   as RGB },  // sandy/muddy
    { at: 0.5,  color: [95, 72, 42]    as RGB },  // cracked earth
    { at: 1,    color: [48, 38, 25]    as RGB },  // dry dark bed
  ],
  reed: [
    { at: 0,    color: [58, 118, 48]   as RGB },  // fresh green reed
    { at: 0.45, color: [130, 108, 38]  as RGB },  // yellowing
    { at: 1,    color: [62, 52, 38]    as RGB },  // dead straw
  ],
  shore: [
    { at: 0,    color: [158, 130, 82]  as RGB },  // sandy shore
    { at: 0.5,  color: [112, 88, 58]   as RGB },  // dry earth
    { at: 1,    color: [48, 38, 28]    as RGB },  // cracked dark earth
  ],
  foreground: [
    { at: 0,    color: [138, 112, 68]  as RGB },  // warm grass/earth
    { at: 0.5,  color: [88, 68, 42]    as RGB },  // scorched
    { at: 1,    color: [38, 30, 20]    as RGB },  // charred
  ],
  ember: [
    { at: 0,    color: [255, 130, 20]  as RGB },  // orange ember
    { at: 1,    color: [255, 60, 10]   as RGB },  // hot red ember
  ],
}

// ─────────────────────────────────────────────────────────────────────────────
// Derived scalar values
// ─────────────────────────────────────────────────────────────────────────────

/** Water surface Y position in SVG units (viewBox 0 0 400 650).
 *  Drops from 335 → 475 as progress 0→1 (lake draining). */
export function waterSurfaceY(p: number): number {
  return 335 + p * 140
}

/** Sun center Y — sinks toward horizon and below as scene burns. */
export function sunCY(p: number): number {
  return 72 + p * 175
}

/** Cloud opacity — clouds dissipate as sky fills with smoke/haze. */
export function cloudOpacity(p: number): number {
  return Math.max(0, 1 - p * 2.8)
}

/** Ember glow opacity — 0 until progress > 0.55, then ramps to 1. */
export function emberOpacity(p: number): number {
  if (p < 0.55) return 0
  return Math.min(1, (p - 0.55) / 0.38)
}

/** Reed scale Y — reeds wilt and shrink to ~20% at full burn. */
export function reedScaleY(p: number): number {
  return Math.max(0.2, 1 - p * 0.8)
}

/** Shimmer opacity — disappears as water becomes murky/depleted. */
export function shimmerOpacity(p: number): number {
  return Math.max(0, 1 - p * 2.2)
}

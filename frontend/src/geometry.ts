import * as L from "leaflet"

export interface Pt {
  x: number
  y: number
}

export interface LatLngLike {
  lat: number
  lng: number
}

export interface Smoothable {
  smooth?: boolean
}

export interface GeometryInit {
  map: L.Map
  ctx: CanvasRenderingContext2D
}

let mapRef: L.Map | null = null
let ctxRef: CanvasRenderingContext2D | null = null

function getMap(): L.Map {
  if (!mapRef) throw new Error("Geometry non initialisée : appelez initGeometry() d'abord")
  return mapRef
}

function getCtx(): CanvasRenderingContext2D {
  if (!ctxRef) throw new Error("Geometry non initialisée : appelez initGeometry() d'abord")
  return ctxRef
}

export function initGeometry({ map, ctx }: GeometryInit): void {
  mapRef = map
  ctxRef = ctx
}

export function cp(p: LatLngLike): L.Point {
  return getMap().latLngToContainerPoint(L.latLng(p.lat, p.lng))
}

export function dist(a: Pt, b: Pt): number {
  return Math.hypot(a.x - b.x, a.y - b.y)
}

export function metersToPixels(m: number, lat: number): number {
  const zoom = getMap().getZoom()
  const mpp = (156543.03392 * Math.cos((lat * Math.PI) / 180)) / Math.pow(2, zoom)
  return m / mpp
}

export function pathFromPoints(pts: Pt[]): void {
  const ctx = getCtx()
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctx.lineTo(pts[i].x, pts[i].y)
}

/* Spline de Catmull-Rom (équivalente à des Bézier cubiques bout à bout) */
export function catmullRomSpline(pts: Pt[], segmentsPerPiece: number, closed: boolean): Pt[] {
  const n = pts.length
  if (n < 3) return pts.slice()

  const at = (i: number): Pt => {
    if (closed) return pts[((i % n) + n) % n]
    return pts[Math.max(0, Math.min(n - 1, i))]
  }

  const out: Pt[] = []
  const last = closed ? n : n - 1

  for (let i = 0; i < last; i++) {
    const p0 = at(i - 1)
    const p1 = at(i)
    const p2 = at(i + 1)
    const p3 = at(i + 2)
    for (let s = 0; s < segmentsPerPiece; s++) {
      const t = s / segmentsPerPiece
      const t2 = t * t
      const t3 = t2 * t
      const x =
        0.5 *
        (2 * p1.x +
          (-p0.x + p2.x) * t +
          (2 * p0.x - 5 * p1.x + 4 * p2.x - p3.x) * t2 +
          (-p0.x + 3 * p1.x - 3 * p2.x + p3.x) * t3)
      const y =
        0.5 *
        (2 * p1.y +
          (-p0.y + p2.y) * t +
          (2 * p0.y - 5 * p1.y + 4 * p2.y - p3.y) * t2 +
          (-p0.y + 3 * p1.y - 3 * p2.y + p3.y) * t3)
      out.push({ x, y })
    }
  }

  out.push(closed ? at(0) : pts[n - 1])
  return out
}

export function smoothIfNeeded(e: Smoothable, pts: Pt[], closed?: boolean): Pt[] {
  if (e.smooth && pts.length > 2) return catmullRomSpline(pts, 12, !!closed)
  return pts
}

export function walkPath(
  pts: Pt[],
  step: number,
  cb: (p: Pt, angle: number) => void
): void {
  let d = 0
  let next = step / 2
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const segLen = Math.hypot(b.x - a.x, b.y - a.y)
    while (next <= d + segLen) {
      const t = (next - d) / segLen
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t
      cb({ x, y }, Math.atan2(b.y - a.y, b.x - a.x))
      next += step
    }
    d += segLen
  }
}

export function distToSegment(p: Pt, a: Pt, b: Pt): number {
  const l2 = (b.x - a.x) ** 2 + (b.y - a.y) ** 2
  if (l2 === 0) return dist(p, a)
  let t = ((p.x - a.x) * (b.x - a.x) + (p.y - a.y) * (b.y - a.y)) / l2
  t = Math.max(0, Math.min(1, t))
  return dist(p, { x: a.x + t * (b.x - a.x), y: a.y + t * (b.y - a.y) })
}

export function minDistToSegments(pts: Pt[], p: Pt, closed?: boolean): number {
  let m = Infinity
  const n = pts.length - (closed ? 0 : 1)
  for (let i = 0; i < n; i++) {
    m = Math.min(m, distToSegment(p, pts[i], pts[(i + 1) % pts.length]))
  }
  return m
}

export function offsetPolyline(pts: Pt[], offset: number): Pt[] {
  const n = pts.length
  const out: Pt[] = []
  for (let i = 0; i < n; i++) {
    let dx = 0
    let dy = 0
    if (i > 0) {
      dx += pts[i].x - pts[i - 1].x
      dy += pts[i].y - pts[i - 1].y
    }
    if (i < n - 1) {
      dx += pts[i + 1].x - pts[i].x
      dy += pts[i + 1].y - pts[i].y
    }
    const len = Math.hypot(dx, dy) || 1
    const nx = -dy / len
    const ny = dx / len
    out.push({ x: pts[i].x + nx * offset, y: pts[i].y + ny * offset })
  }
  return out
}

export function pointInPolygon(p: Pt, pts: Pt[]): boolean {
  let inside = false
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const xi = pts[i].x
    const yi = pts[i].y
    const xj = pts[j].x
    const yj = pts[j].y
    const intersect =
      yi > p.y !== yj > p.y && p.x < ((xj - xi) * (p.y - yi)) / (yj - yi) + xi
    if (intersect) inside = !inside
  }
  return inside
}

export function offsetLatLng(base: LatLngLike, dxMeters: number, dyMeters: number): LatLngLike {
  const R = 6378137
  const dLat = (dyMeters / R) * (180 / Math.PI)
  const dLng = (dxMeters / (R * Math.cos((base.lat * Math.PI) / 180))) * (180 / Math.PI)
  return { lat: base.lat + dLat, lng: base.lng + dLng }
}

export function circleLatLng(
  center: LatLngLike,
  radiusMeters: number,
  segments: number
): LatLngLike[] {
  const coords: LatLngLike[] = []
  for (let i = 0; i <= segments; i++) {
    const a = (i / segments) * Math.PI * 2
    coords.push(offsetLatLng(center, radiusMeters * Math.cos(a), radiusMeters * Math.sin(a)))
  }
  return coords
}

export function makeSquareIsland(
  center: LatLngLike,
  dirDeg: number,
  distance: number,
  size: number
): LatLngLike[] {
  const rad = (dirDeg * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  const px = -uy
  const py = ux
  const islandCenter = offsetLatLng(center, ux * distance, uy * distance)
  const half = size / 2
  return [
    offsetLatLng(islandCenter, -ux * half - px * half, -uy * half - py * half),
    offsetLatLng(islandCenter, ux * half - px * half, uy * half - py * half),
    offsetLatLng(islandCenter, ux * half + px * half, uy * half + py * half),
    offsetLatLng(islandCenter, -ux * half + px * half, -uy * half + py * half),
  ]
}

export function makeCrossing(
  center: LatLngLike,
  dirDeg: number,
  distance: number,
  span: number
): [LatLngLike, LatLngLike] {
  const rad = (dirDeg * Math.PI) / 180
  const ux = Math.cos(rad)
  const uy = Math.sin(rad)
  const px = -uy
  const py = ux
  const c = offsetLatLng(center, ux * distance, uy * distance)
  return [
    offsetLatLng(c, (px * span) / 2, (py * span) / 2),
    offsetLatLng(c, (-px * span) / 2, (-py * span) / 2),
  ]
}
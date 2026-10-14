import type { Map as LeafletMap } from "leaflet"

import {
  cp,
  metersToPixels,
  pathFromPoints,
  catmullRomSpline,
  smoothIfNeeded,
  walkPath,
  offsetPolyline,
} from "./geometry.js"
import type { Pt, LatLngLike } from "./geometry.js"

import { buildPatterns } from "./texture.js"

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type ElementType =
  | "espace_vert"
  | "massif"
  | "hachures"
  | "chemin_pieton"
  | "piste_cyclable"
  | "bande_cyclable"
  | "rue_cyclable"
  | "route"
  | "rond_point"
  | "stationnement"
  | "passage_pieton"
  | "cedez_le_passage"
  | "ligne_stop"
  | "stop_sol"
  | "fleche_sol"
  | "chevron_velo"
  | "arbre"
  | "feu_clignotant"
  | "feu_tricolore"

export type Direction = "unidirectional" | "bidirectional"
export type ParkingLayout = "bataille" | "epi" | "creneau"
export type CornerStyle = "straight" | "smooth"
export type ArrowType =
  | "tout_droit"
  | "gauche"
  | "droite"
  | "tout_droit_gauche"
  | "tout_droit_droite"

export interface MapElement {
  type: ElementType
  coords: LatLngLike[]
  z?: number
  smooth?: boolean
  lanes?: number
  direction?: Direction
  width?: number
  lineCap?: CanvasLineCap
  radius?: number
  hatchWidth?: number
  cornerStyle?: CornerStyle
  color?: string
  layout?: ParkingLayout
  bay?: number
  depth?: number
  stripeWidth?: number
  span?: number
  arrowType?: ArrowType
}

export interface ToolConfigEntry {
  mode?: "point" | "edit" | string
}

export interface RenderState {
  drawingPoints: LatLngLike[]
  elements: MapElement[]
  selectedElementForEdit: MapElement | null
  currentTool: string | null
  toolConfig: Record<string, ToolConfigEntry>
  mousePos: LatLngLike | null
  byId: (id: string) => HTMLInputElement
}

export interface RenderInit {
  overlay: HTMLCanvasElement
  map: LeafletMap
  ctx: CanvasRenderingContext2D
  getState: () => RenderState
}

/** Forme attendue du retour de buildPatterns() (texture.ts). */
export interface Patterns {
  asphaltPattern: CanvasPattern
  grassPattern: CanvasPattern
  bushPattern: CanvasPattern
  pavementPattern: CanvasPattern
}

/* ------------------------------------------------------------------ */
/* État du module                                                     */
/* ------------------------------------------------------------------ */

let overlayRef: HTMLCanvasElement | null = null
let drawingPointsRef: LatLngLike[] = []
let mapRef: LeafletMap | null = null
// Initialisé par initRender() ; draw() vérifie quand même qu'il est défini.
let ctxRef: CanvasRenderingContext2D = null!
let elementsRef: MapElement[] = []
let selectedElementForEditRef: MapElement | null = null
let currentToolRef: string | null = null
let getStateRef: (() => RenderState) | null = null
let toolConfig: Record<string, ToolConfigEntry> = {}
let mousePos: LatLngLike | null = null
let byId: ((id: string) => HTMLInputElement) | null = null

let asphaltPattern!: CanvasPattern
let grassPattern!: CanvasPattern
let bushPattern!: CanvasPattern
let pavementPattern!: CanvasPattern

/*
  ATTENTION : `zOrderBase` n'était défini nulle part dans le code fourni
  (ReferenceError dès qu'un élément n'a pas de `z`). Valeurs ci-dessous
  à ajuster selon votre ordre d'empilement réel, ou à importer si elles
  existent déjà ailleurs.
*/
const zOrderBase: Record<ElementType, number> = {
  espace_vert: 0,
  massif: 1,
  chemin_pieton: 2,
  piste_cyclable: 3,
  route: 4,
  rond_point: 5,
  stationnement: 6,
  hachures: 7,
  bande_cyclable: 8,
  rue_cyclable: 9,
  passage_pieton: 10,
  cedez_le_passage: 11,
  ligne_stop: 12,
  stop_sol: 13,
  fleche_sol: 14,
  chevron_velo: 15,
  arbre: 16,
  feu_clignotant: 17,
  feu_tricolore: 18,
}

/* ------------------------------------------------------------------ */
/* Init / sync                                                        */
/* ------------------------------------------------------------------ */

function initRender({ overlay, map, ctx, getState }: RenderInit): void {
  overlayRef = overlay
  mapRef = map
  ctxRef = ctx
  getStateRef = getState
  const patterns: Patterns = buildPatterns(ctx)
  ;({ asphaltPattern, grassPattern, bushPattern, pavementPattern } = patterns)
}

function syncRenderState(): void {
  if (!getStateRef) return

  const state = getStateRef()

  drawingPointsRef = state.drawingPoints
  elementsRef = state.elements
  selectedElementForEditRef = state.selectedElementForEdit
  currentToolRef = state.currentTool
  toolConfig = state.toolConfig
  mousePos = state.mousePos
  byId = state.byId
}

function resizeOverlay(): void {
  if (!mapRef || !overlayRef) return
  const size = mapRef.getSize()
  overlayRef.width = size.x
  overlayRef.height = size.y
  draw()
}

function draw(): void {
  syncRenderState()

  if (!overlayRef || !ctxRef || !elementsRef) return
  if (overlayRef.width === 0 || overlayRef.height === 0) return

  ctxRef.clearRect(0, 0, overlayRef.width, overlayRef.height)
  const sorted = [...elementsRef].sort((a, b) => {
    const za = a.z !== undefined ? a.z : zOrderBase[a.type]
    const zb = b.z !== undefined ? b.z : zOrderBase[b.type]
    return za - zb
  })
  sorted.forEach((e) => {
    switch (e.type) {
      case "espace_vert":      drawGreenSpace(e); break
      case "massif":           drawBushMass(e); break
      case "hachures":         drawHatchZone(e); break
      case "chemin_pieton":    drawPedestrianPath(e); break
      case "piste_cyclable":   drawCyclePath(e); break
      case "bande_cyclable":   drawPaintedCycleLane(e); break
      case "rue_cyclable":     drawCycleStreet(e); break
      case "route":            drawRoad(e); break
      case "rond_point":       drawRoundabout(e); break
      case "stationnement":    drawParking(e); break
      case "passage_pieton":   drawCrossing(e); break
      case "cedez_le_passage": drawYieldLine(e); break
      case "ligne_stop":       drawStopLine(e); break
      case "stop_sol":         drawGroundStop(e); break
      case "fleche_sol":       drawGroundArrow(e); break
      case "chevron_velo":     drawSharrow(e); break
      case "arbre":            drawTree(e); break
      case "feu_clignotant":   drawBlinkingLight(e); break
      case "feu_tricolore":    drawTrafficLight(e); break
    }
  })
  drawEditHandles()
  drawBranchNodesOverlay()
  drawPreview()
}

/* ------------------------------------------------------------------ */
/* Mobilier / signalisation                                           */
/* ------------------------------------------------------------------ */

function drawBlinkingLight(e: MapElement): void {
  const p = cp(e.coords[0])

  const isBlinkingOn = Math.floor(Date.now() / 400) % 2 === 0

  ctxRef.save()

  ctxRef.strokeStyle = "#333333"
  ctxRef.lineWidth = 3
  ctxRef.beginPath()
  ctxRef.moveTo(p.x, p.y + 10)
  ctxRef.lineTo(p.x, p.y - 12)
  ctxRef.stroke()

  ctxRef.fillStyle = "#1a1a1a"
  ctxRef.strokeStyle = "#444"
  ctxRef.lineWidth = 1
  ctxRef.fillRect(p.x - 6, p.y - 24, 12, 16)
  ctxRef.strokeRect(p.x - 6, p.y - 24, 12, 16)

  if (isBlinkingOn) {
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y - 16, 12, 0, Math.PI * 2)
    ctxRef.fillStyle = "rgba(255, 204, 0, 0.35)"
    ctxRef.fill()
  }

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y - 16, 4.5, 0, Math.PI * 2)
  ctxRef.fillStyle = isBlinkingOn ? "#ffcc00" : "#665200"
  ctxRef.fill()

  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = 1.2
  ctxRef.stroke()

  ctxRef.restore()
}

function drawEditHandles(): void {
  if (!selectedElementForEditRef) return
  ctxRef.save()
  ctxRef.fillStyle = "#ff9d3d"
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = 2
  selectedElementForEditRef.coords.forEach((coord) => {
    const p = cp(coord)
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y, 6, 0, Math.PI * 2)
    ctxRef.fill()
    ctxRef.stroke()
  })
  ctxRef.restore()
}

function drawBranchNodesOverlay(): void {
  if (currentToolRef !== "branch") return
  ctxRef.save()
  ctxRef.fillStyle = "#3cb371"
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = 2
  elementsRef.forEach((e) => {
    if (["route", "piste_cyclable", "chemin_pieton"].includes(e.type)) {
      e.coords.forEach((coord) => {
        const p = cp(coord)
        ctxRef.beginPath()
        ctxRef.arc(p.x, p.y, 5, 0, Math.PI * 2)
        ctxRef.fill()
        ctxRef.stroke()
      })
    }
  })
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Routes                                                             */
/* ------------------------------------------------------------------ */

function drawRoad(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const lanes = Math.max(1, Math.round(e.lanes || 2))
  const bidirectional = e.direction !== "unidirectional"
  const widthPx = Math.max(4, metersToPixels(e.width || 6, lat))
  const lineCapStyle: CanvasLineCap = e.lineCap || "round"

  ctxRef.save()
  ctxRef.lineJoin = "round"
  ctxRef.lineCap = lineCapStyle

  pathFromPoints(pts)
  ctxRef.strokeStyle = "#2c2c2c"
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.55
  ctxRef.strokeStyle = asphaltPattern
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  const dividerFracs: number[] = []
  for (let i = 1; i < lanes; i++) dividerFracs.push(-0.5 + i / lanes)

  let centerIdx = -1
  if (bidirectional && dividerFracs.length > 0) {
    centerIdx = dividerFracs.reduce(
      (best, val, idx) => (Math.abs(val) < Math.abs(dividerFracs[best]) ? idx : best),
      0
    )
  }

  dividerFracs.forEach((frac, idx) => {
    const offsetPts = offsetPolyline(pts, frac * widthPx)
    ctxRef.beginPath()
    ctxRef.moveTo(offsetPts[0].x, offsetPts[0].y)
    for (let k = 1; k < offsetPts.length; k++) ctxRef.lineTo(offsetPts[k].x, offsetPts[k].y)
    if (idx === centerIdx) {
      ctxRef.setLineDash([])
      ctxRef.strokeStyle = "#ffffff"
      ctxRef.lineWidth = Math.max(1.6, widthPx * 0.045)
      ctxRef.stroke()
    } else {
      ctxRef.setLineDash([metersToPixels(3, lat), metersToPixels(3, lat)])
      ctxRef.strokeStyle = "#ffffff"
      ctxRef.lineWidth = Math.max(1.2, widthPx * 0.03)
      ctxRef.stroke()
      ctxRef.setLineDash([])
    }
  })

  if (!bidirectional) {
    drawRoadArrows(pts, widthPx, lanes, lat)
  }
  ctxRef.restore()
}

function drawRoadArrows(pts: Pt[], widthPx: number, lanes: number, lat: number): void {
  const step = metersToPixels(22, lat)
  if (step < 12) return
  for (let l = 0; l < lanes; l++) {
    const frac = -0.5 + (l + 0.5) / lanes
    const offsetPts = offsetPolyline(pts, frac * widthPx)
    walkPath(offsetPts, step, (p, angle) => {
      drawArrowIcon(p, angle, Math.max(6, widthPx * 0.16))
    })
  }
}

function drawArrowIcon(p: Pt, angle: number, size: number): void {
  ctxRef.save()
  ctxRef.translate(p.x, p.y)
  ctxRef.rotate(angle)
  ctxRef.strokeStyle = "rgba(255,255,255,0.9)"
  ctxRef.fillStyle = "rgba(255,255,255,0.9)"
  ctxRef.lineWidth = Math.max(1, size * 0.18)
  ctxRef.beginPath()
  ctxRef.moveTo(-size, 0)
  ctxRef.lineTo(size * 0.35, 0)
  ctxRef.stroke()
  ctxRef.beginPath()
  ctxRef.moveTo(size, 0)
  ctxRef.lineTo(size * 0.2, -size * 0.5)
  ctxRef.lineTo(size * 0.2, size * 0.5)
  ctxRef.closePath()
  ctxRef.fill()
  ctxRef.restore()
}

function drawRoundabout(e: MapElement): void {
  const p = cp(e.coords[0])
  const lat = e.coords[0].lat
  const r = Math.max(10, metersToPixels(e.radius || 12, lat))
  const lanes = Math.max(1, Math.round(e.lanes || 2))
  const ringWidth = r * (0.3 + lanes * 0.1)

  ctxRef.save()
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.strokeStyle = "#c9c9c9"
  ctxRef.lineWidth = 4
  ctxRef.stroke()

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.arc(p.x, p.y, r - ringWidth, 0, Math.PI * 2, true)
  ctxRef.fillStyle = asphaltPattern
  ctxRef.fill()
  ctxRef.strokeStyle = "#2c2c2c"
  ctxRef.lineWidth = 2
  ctxRef.stroke()

  for (let i = 1; i < lanes; i++) {
    const laneRadius = r - ringWidth * (i / lanes)
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y, laneRadius, 0, Math.PI * 2)
    ctxRef.setLineDash([metersToPixels(2, lat), metersToPixels(2, lat)])
    ctxRef.strokeStyle = "#ffffff"
    ctxRef.lineWidth = Math.max(1.2, r * 0.025)
    ctxRef.stroke()
    ctxRef.setLineDash([])
  }

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r - ringWidth - 2, 0, Math.PI * 2)
  ctxRef.fillStyle = grassPattern
  ctxRef.fill()
  ctxRef.strokeStyle = "#345c28"
  ctxRef.lineWidth = 2
  ctxRef.stroke()

  for (let l = 0; l < lanes; l++) {
    const laneMiddleRadius = r - ringWidth * ((l + 0.5) / lanes)
    for (let i = 0; i < 3; i++) {
      const angle = (i * Math.PI * 2) / 3 - Math.PI / 2 + l * 0.2
      const ax = p.x + laneMiddleRadius * Math.cos(angle)
      const ay = p.y + laneMiddleRadius * Math.sin(angle)
      drawArrowIcon({ x: ax, y: ay }, angle - Math.PI / 2, Math.max(4, r * 0.08))
    }
  }
  ctxRef.restore()
}

function drawHatchZone(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  const lat = e.coords[0].lat
  const hatchSpacing = Math.max(8, metersToPixels(e.hatchWidth || 1.5, lat))
  const cornerStyle: CornerStyle = e.cornerStyle || "straight"

  ctxRef.save()

  if (cornerStyle === "smooth") {
    drawSmoothPolygon(pts)
  } else {
    ctxRef.beginPath()
    ctxRef.moveTo(pts[0].x, pts[0].y)
    for (let i = 1; i < pts.length; i++) {
      ctxRef.lineTo(pts[i].x, pts[i].y)
    }
    ctxRef.closePath()
  }

  ctxRef.fillStyle = asphaltPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2.5
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.stroke()

  ctxRef.clip()
  let minX = Infinity
  let maxX = -Infinity
  let minY = Infinity
  let maxY = -Infinity
  pts.forEach((p) => {
    if (p.x < minX) minX = p.x
    if (p.x > maxX) maxX = p.x
    if (p.y < minY) minY = p.y
    if (p.y > maxY) maxY = p.y
  })

  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = Math.max(2, hatchSpacing * 0.4)
  const diag = Math.hypot(maxX - minX, maxY - minY) * 1.5
  for (let offset = -diag; offset < diag; offset += hatchSpacing) {
    ctxRef.beginPath()
    ctxRef.moveTo(minX + offset, minY - diag)
    ctxRef.lineTo(minX + offset + diag * 2, minY + diag)
    ctxRef.stroke()
  }
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Aménagements cyclables                                             */
/* ------------------------------------------------------------------ */

function drawCyclePath(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(3, metersToPixels(e.width || 2, lat))
  const bidirectional = e.direction === "bidirectional"
  ctxRef.save()
  ctxRef.lineJoin = "round"
  ctxRef.lineCap = "round"

  pathFromPoints(pts)
  ctxRef.strokeStyle = e.color || "#3c8a3c"
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.4
  ctxRef.strokeStyle = bushPattern
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  if (bidirectional) {
    pathFromPoints(pts)
    ctxRef.setLineDash([metersToPixels(1, lat), metersToPixels(1, lat)])
    ctxRef.strokeStyle = "rgba(255,255,255,0.9)"
    ctxRef.lineWidth = Math.max(1, widthPx * 0.08)
    ctxRef.stroke()
    ctxRef.setLineDash([])
  }
  ctxRef.restore()

  if (bidirectional) {
    // Conduite à la française : voie de droite = "aller", voie de gauche = "retour".
    const laneRight = offsetPolyline(pts, widthPx * 0.25)
    const laneLeft = offsetPolyline(pts, -widthPx * 0.25)
    drawBikePictograms(laneRight, widthPx * 0.7, lat, false)
    drawBikePictograms(laneLeft, widthPx * 0.7, lat, true)
  } else {
    drawBikePictograms(pts, widthPx, lat, false)
  }
}

function drawBikePictograms(pts: Pt[], widthPx: number, lat: number, reversed: boolean): void {
  const step = metersToPixels(14, lat)
  if (step < 8) return
  walkPath(pts, step, (p, dirAngle) => {
    const angle = reversed ? dirAngle + Math.PI : dirAngle
    ctxRef.save()
    ctxRef.translate(p.x, p.y)
    ctxRef.rotate(angle)
    const s = Math.max(6, widthPx * 0.4)
    ctxRef.strokeStyle = "rgba(255,255,255,0.92)"
    ctxRef.lineWidth = Math.max(1, s * 0.16)
    ctxRef.beginPath(); ctxRef.arc(-s * 0.55, 0, s * 0.32, 0, Math.PI * 2); ctxRef.stroke()
    ctxRef.beginPath(); ctxRef.arc(s * 0.55, 0, s * 0.32, 0, Math.PI * 2); ctxRef.stroke()
    ctxRef.beginPath()
    ctxRef.moveTo(-s * 0.55, 0); ctxRef.lineTo(0, -s * 0.55); ctxRef.lineTo(s * 0.55, 0)
    ctxRef.lineTo(-0.05 * s, -0.55 * s)
    ctxRef.stroke()
    ctxRef.beginPath()
    ctxRef.moveTo(s * 1.0, -0.16 * s)
    ctxRef.lineTo(s * 1.35, 0)
    ctxRef.lineTo(s * 1.0, 0.16 * s)
    ctxRef.stroke()
    ctxRef.restore()
  })
}

function drawPaintedCycleLane(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(6, metersToPixels(e.width || 1.5, lat))
  const bidirectional = e.direction === "bidirectional"
  ctxRef.save()
  ctxRef.lineJoin = "round"
  ctxRef.lineCap = "round"

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.3
  ctxRef.strokeStyle = e.color || "#3c8a3c"
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  ;[widthPx / 2, -widthPx / 2].forEach((off) => {
    const edge = offsetPolyline(pts, off)
    ctxRef.beginPath()
    ctxRef.moveTo(edge[0].x, edge[0].y)
    for (let k = 1; k < edge.length; k++) ctxRef.lineTo(edge[k].x, edge[k].y)
    ctxRef.strokeStyle = "#ffffff"
    ctxRef.lineWidth = Math.max(1.2, widthPx * 0.08)
    ctxRef.stroke()
  })
  ctxRef.restore()

  if (bidirectional) {
    const laneRight = offsetPolyline(pts, widthPx * 0.25)
    const laneLeft = offsetPolyline(pts, -widthPx * 0.25)
    drawBikePictograms(laneRight, widthPx * 0.8, lat, false)
    drawBikePictograms(laneLeft, widthPx * 0.8, lat, true)
  } else {
    drawBikePictograms(pts, widthPx, lat, false)
  }
}

function drawCycleStreet(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const step = metersToPixels(18, lat)
  if (step < 10) return
  walkPath(pts, step, (p, angle) => {
    ctxRef.save()
    ctxRef.translate(p.x, p.y)
    ctxRef.rotate(angle)
    const s = Math.max(9, metersToPixels(1.1, lat))
    ctxRef.strokeStyle = "rgba(255,255,255,0.95)"
    ctxRef.lineWidth = Math.max(1.3, s * 0.13)
    ctxRef.beginPath(); ctxRef.arc(0, 0, s * 1.4, 0, Math.PI * 2); ctxRef.stroke()
    ctxRef.beginPath(); ctxRef.arc(-s * 0.45, s * 0.25, s * 0.24, 0, Math.PI * 2); ctxRef.stroke()
    ctxRef.beginPath(); ctxRef.arc(s * 0.2, s * 0.25, s * 0.24, 0, Math.PI * 2); ctxRef.stroke()
    ctxRef.beginPath()
    ctxRef.moveTo(-s * 0.45, s * 0.25); ctxRef.lineTo(-s * 0.12, -s * 0.15); ctxRef.lineTo(s * 0.2, s * 0.25)
    ctxRef.lineTo(-s * 0.12, -s * 0.15); ctxRef.lineTo(s * 0.12, -s * 0.35)
    ctxRef.stroke()
    ctxRef.restore()
  })
}

/* ------------------------------------------------------------------ */
/* Cheminements piétons / stationnement                               */
/* ------------------------------------------------------------------ */

function drawPedestrianPath(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(4, metersToPixels(e.width || 2.5, lat))

  ctxRef.save()
  ctxRef.lineJoin = "round"
  ctxRef.lineCap = "round"

  // Bordure
  pathFromPoints(pts)
  ctxRef.strokeStyle = "#8f887a"
  ctxRef.lineWidth = widthPx + 3
  ctxRef.stroke()

  // Dallage
  pathFromPoints(pts)
  ctxRef.strokeStyle = pavementPattern
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.restore()
}

function drawParking(e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const layout: ParkingLayout = e.layout || "bataille"
  const bayWidth = Math.max(6, metersToPixels(e.bay || 2.5, lat))
  const depthPx = Math.max(10, metersToPixels(e.depth || 5, lat))

  ctxRef.save()
  ctxRef.lineCap = "butt"
  ctxRef.lineJoin = "round"

  let bandThickness = depthPx
  if (layout === "creneau") bandThickness = Math.max(8, metersToPixels(2.2, lat))

  pathFromPoints(pts)
  ctxRef.strokeStyle = "#333333"
  ctxRef.lineWidth = bandThickness
  ctxRef.stroke()

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.5
  ctxRef.strokeStyle = asphaltPattern
  ctxRef.lineWidth = bandThickness
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = Math.max(1.5, bayWidth * 0.05)

  let distAcc = 0
  let next = bayWidth / 2
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    const segLen = Math.hypot(b.x - a.x, b.y - a.y)
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const nx = Math.cos(angle + Math.PI / 2)
    const ny = Math.sin(angle + Math.PI / 2)

    while (next <= distAcc + segLen) {
      const t = (next - distAcc) / segLen
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t

      if (layout === "bataille") {
        ctxRef.beginPath()
        ctxRef.moveTo(x - (nx * bandThickness) / 2, y - (ny * bandThickness) / 2)
        ctxRef.lineTo(x + (nx * bandThickness) / 2, y + (ny * bandThickness) / 2)
        ctxRef.stroke()
      } else if (layout === "epi") {
        const angleEpi = angle + Math.PI / 4
        const ux2 = Math.cos(angleEpi)
        const uy2 = Math.sin(angleEpi)
        const halfLen = bandThickness / 2 / Math.sin(Math.PI / 4)
        ctxRef.beginPath()
        ctxRef.moveTo(x - ux2 * halfLen, y - uy2 * halfLen)
        ctxRef.lineTo(x + ux2 * halfLen, y + uy2 * halfLen)
        ctxRef.stroke()
      } else if (layout === "creneau") {
        ctxRef.save()
        ctxRef.translate(x, y)
        ctxRef.rotate(angle)
        const len = bayWidth * 0.95
        ctxRef.strokeRect(-len / 2, -bandThickness / 2, len, bandThickness)
        ctxRef.restore()
      }
      next += bayWidth
    }
    distAcc += segLen
  }
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Marquage au sol                                                    */
/* ------------------------------------------------------------------ */

function drawCrossing(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  const lat = e.coords[0].lat
  const dx = P2.x - P1.x
  const dy = P2.y - P1.y
  const total = Math.hypot(dx, dy)
  if (total < 2) return
  const ux = dx / total
  const uy = dy / total
  const nx = -uy
  const ny = ux
  const stripeW = Math.max(2, metersToPixels(e.stripeWidth || 0.5, lat))
  const spanPx = Math.max(6, metersToPixels(e.span || 3.5, lat))

  ctxRef.save()
  ctxRef.fillStyle = "#ffffff"
  let pos = 0
  while (pos < total) {
    const cx = P1.x + ux * (pos + stripeW / 2)
    const cy = P1.y + uy * (pos + stripeW / 2)
    const pA = { x: cx - (ux * stripeW) / 2 - (nx * spanPx) / 2, y: cy - (uy * stripeW) / 2 - (ny * spanPx) / 2 }
    const pB = { x: cx + (ux * stripeW) / 2 - (nx * spanPx) / 2, y: cy + (uy * stripeW) / 2 - (ny * spanPx) / 2 }
    const pC = { x: cx + (ux * stripeW) / 2 + (nx * spanPx) / 2, y: cy + (uy * stripeW) / 2 + (ny * spanPx) / 2 }
    const pD = { x: cx - (ux * stripeW) / 2 + (nx * spanPx) / 2, y: cy - (uy * stripeW) / 2 + (ny * spanPx) / 2 }
    ctxRef.beginPath()
    ctxRef.moveTo(pA.x, pA.y); ctxRef.lineTo(pB.x, pB.y); ctxRef.lineTo(pC.x, pC.y); ctxRef.lineTo(pD.x, pD.y)
    ctxRef.closePath(); ctxRef.fill()
    pos += stripeW * 2
  }
  ctxRef.restore()
}

function drawYieldLine(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  const lat = e.coords[0].lat
  const dx = P2.x - P1.x
  const dy = P2.y - P1.y
  const total = Math.hypot(dx, dy)
  if (total < 2) return
  const ux = dx / total
  const uy = dy / total
  const nx = -uy
  const ny = ux
  const triangleBase = Math.max(6, metersToPixels(0.8, lat))
  const triangleHeight = Math.max(8, metersToPixels(1.2, lat))

  ctxRef.save()
  ctxRef.fillStyle = "#ffffff"
  ctxRef.strokeStyle = "#2c2c2c"
  ctxRef.lineWidth = 1

  let pos = triangleBase / 2
  while (pos < total) {
    const cx = P1.x + ux * pos
    const cy = P1.y + uy * pos
    const tipX = cx + nx * triangleHeight
    const tipY = cy + ny * triangleHeight
    const leftX = cx - (ux * triangleBase) / 2
    const leftY = cy - (uy * triangleBase) / 2
    const rightX = cx + (ux * triangleBase) / 2
    const rightY = cy + (uy * triangleBase) / 2

    ctxRef.beginPath()
    ctxRef.moveTo(tipX, tipY)
    ctxRef.lineTo(leftX, leftY)
    ctxRef.lineTo(rightX, rightY)
    ctxRef.closePath()
    ctxRef.fill()
    pos += triangleBase * 1.6
  }
  ctxRef.restore()
}

function drawStopLine(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const lat = e.coords[0].lat
  const thickness = Math.max(3, metersToPixels(0.5, lat))

  ctxRef.save()
  pathFromPoints(pts)
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.lineWidth = thickness
  ctxRef.lineCap = "square"
  ctxRef.stroke()
  ctxRef.restore()
}

function drawGroundStop(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const cx = (P1.x + P2.x) / 2
  const cy = (P1.y + P2.y) / 2
  const unit = Math.max(10, metersToPixels(1, lat))

  ctxRef.save()
  ctxRef.translate(cx, cy)
  ctxRef.rotate(angle - Math.PI / 2)
  ctxRef.scale(1, 2.4)
  ctxRef.fillStyle = "#ffffff"
  ctxRef.font = `bold ${Math.max(9, unit * 2.6)}px Arial, sans-serif`
  ctxRef.textAlign = "center"
  ctxRef.textBaseline = "middle"
  ctxRef.fillText("STOP", 0, 0)
  ctxRef.restore()
}

function drawGroundArrow(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const L_ = Math.max(20, metersToPixels(2.6, lat))
  const type: ArrowType = e.arrowType || "tout_droit"
  const headSize = L_ * 0.22

  function arrowHead(x: number, y: number, dirAngle: number): void {
    ctxRef.save()
    ctxRef.translate(x, y)
    ctxRef.rotate(dirAngle)
    ctxRef.beginPath()
    ctxRef.moveTo(headSize, 0)
    ctxRef.lineTo(-headSize * 0.6, headSize * 0.55)
    ctxRef.lineTo(-headSize * 0.6, -headSize * 0.55)
    ctxRef.closePath()
    ctxRef.fill()
    ctxRef.restore()
  }

  ctxRef.save()
  ctxRef.translate(P1.x, P1.y)
  ctxRef.rotate(angle)
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.fillStyle = "#ffffff"
  ctxRef.lineWidth = Math.max(2, L_ * 0.09)
  ctxRef.lineJoin = "round"
  ctxRef.lineCap = "round"

  if (type === "tout_droit" || type === "tout_droit_gauche" || type === "tout_droit_droite") {
    ctxRef.beginPath(); ctxRef.moveTo(0, 0); ctxRef.lineTo(L_ * 0.75, 0); ctxRef.stroke()
    arrowHead(L_ * 0.75, 0, 0)
  }
  if (type === "gauche" || type === "tout_droit_gauche") {
    const bendX = type === "gauche" ? L_ * 0.55 : L_ * 0.4
    ctxRef.beginPath()
    ctxRef.moveTo(0, 0)
    ctxRef.lineTo(bendX, 0)
    ctxRef.quadraticCurveTo(bendX + L_ * 0.15, 0, bendX + L_ * 0.15, -L_ * 0.25)
    ctxRef.stroke()
    arrowHead(bendX + L_ * 0.15, -L_ * 0.3, -Math.PI / 2)
  }
  if (type === "droite" || type === "tout_droit_droite") {
    const bendX = type === "droite" ? L_ * 0.55 : L_ * 0.4
    ctxRef.beginPath()
    ctxRef.moveTo(0, 0)
    ctxRef.lineTo(bendX, 0)
    ctxRef.quadraticCurveTo(bendX + L_ * 0.15, 0, bendX + L_ * 0.15, L_ * 0.25)
    ctxRef.stroke()
    arrowHead(bendX + L_ * 0.15, L_ * 0.3, Math.PI / 2)
  }
  ctxRef.restore()
}

function drawSharrow(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const cx = (P1.x + P2.x) / 2
  const cy = (P1.y + P2.y) / 2
  const s = Math.max(10, metersToPixels(0.9, lat))

  ctxRef.save()
  ctxRef.translate(cx, cy)
  ctxRef.rotate(angle)
  ctxRef.strokeStyle = "#ffffff"
  ctxRef.fillStyle = "#ffffff"
  ctxRef.lineWidth = Math.max(1.4, s * 0.14)

  ctxRef.beginPath(); ctxRef.arc(-s * 0.7, s * 0.35, s * 0.28, 0, Math.PI * 2); ctxRef.stroke()
  ctxRef.beginPath(); ctxRef.arc(-s * 0.1, s * 0.35, s * 0.28, 0, Math.PI * 2); ctxRef.stroke()
  ctxRef.beginPath()
  ctxRef.moveTo(-s * 0.7, s * 0.35); ctxRef.lineTo(-s * 0.35, -s * 0.1); ctxRef.lineTo(-s * 0.1, s * 0.35)
  ctxRef.lineTo(-s * 0.35, -s * 0.1); ctxRef.lineTo(-s * 0.05, -s * 0.35)
  ctxRef.stroke()

  ;[0, s * 0.6].forEach((offsetX) => {
    ctxRef.beginPath()
    ctxRef.moveTo(s * 0.55 + offsetX, -s * 0.4)
    ctxRef.lineTo(s * 0.9 + offsetX, 0)
    ctxRef.lineTo(s * 0.55 + offsetX, s * 0.4)
    ctxRef.stroke()
  })
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Végétation                                                         */
/* ------------------------------------------------------------------ */

function drawSmoothPolygon(pts: Pt[]): void {
  ctxRef.beginPath()
  const n = pts.length
  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const m0 = mid(pts[n - 1], pts[0])
  ctxRef.moveTo(m0.x, m0.y)
  for (let i = 0; i < n; i++) {
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    const m = mid(cur, next)
    ctxRef.quadraticCurveTo(cur.x, cur.y, m.x, m.y)
  }
  ctxRef.closePath()
}

function drawGreenSpace(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  drawSmoothPolygon(pts)
  ctxRef.fillStyle = grassPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2
  ctxRef.strokeStyle = "#345c28"
  ctxRef.stroke()
  ctxRef.restore()
}

function drawBushMass(e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  drawSmoothPolygon(pts)
  ctxRef.fillStyle = bushPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2.5
  ctxRef.strokeStyle = "#1c3c20"
  ctxRef.stroke()
  ctxRef.restore()
}

function drawTree(e: MapElement): void {
  const p = cp(e.coords[0])
  const lat = e.coords[0].lat
  const r = Math.max(5, metersToPixels(e.radius || 2.2, lat))
  ctxRef.save()
  ctxRef.beginPath()
  ctxRef.ellipse(p.x + r * 0.25, p.y + r * 0.3, r * 0.95, r * 0.75, 0, 0, Math.PI * 2)
  ctxRef.fillStyle = "rgba(0,0,0,0.28)"
  ctxRef.fill()

  const grad = ctxRef.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r)
  grad.addColorStop(0, "#93d65e")
  grad.addColorStop(0.55, "#4f9c3a")
  grad.addColorStop(1, "#1f5c22")
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.fillStyle = grad
  ctxRef.fill()
  ctxRef.restore()
}

function drawTrafficLight(e: MapElement): void {
  const p = cp(e.coords[0])
  ctxRef.save()
  ctxRef.strokeStyle = "#333333"
  ctxRef.lineWidth = 3
  ctxRef.beginPath()
  ctxRef.moveTo(p.x, p.y + 10)
  ctxRef.lineTo(p.x, p.y - 12)
  ctxRef.stroke()

  ctxRef.fillStyle = "#1a1a1a"
  ctxRef.strokeStyle = "#444"
  ctxRef.lineWidth = 1
  ctxRef.fillRect(p.x - 5, p.y - 24, 10, 22)
  ctxRef.strokeRect(p.x - 5, p.y - 24, 10, 22)

  ctxRef.fillStyle = "#e14b4b"; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 19, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.fillStyle = "#ffa500"; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 13, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.fillStyle = "#3cb371"; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 7, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Aperçu du tracé en cours                                           */
/* ------------------------------------------------------------------ */

const SMOOTHABLE_TYPES: readonly string[] = ["route", "piste_cyclable", "chemin_pieton", "stationnement"]

function drawPreview(): void {
  if (drawingPointsRef.length === 0) return
  const pts: Pt[] = drawingPointsRef.map(cp)
  const cfg: ToolConfigEntry | undefined = currentToolRef ? toolConfig[currentToolRef] : undefined
  const showMouseSegment = !!mousePos && !!cfg && cfg.mode !== "point" && cfg.mode !== "edit"
  const previewPts = pts.slice()
  if (showMouseSegment && mousePos) {
    previewPts.push(cp(mousePos))
  }
  ctxRef.save()

  const targetType = currentToolRef === "branch" ? "route" : currentToolRef
  const smoothCheckbox = byId?.("set-smooth-curves")
  if (
    targetType !== null &&
    SMOOTHABLE_TYPES.includes(targetType) &&
    smoothCheckbox?.checked &&
    previewPts.length > 2
  ) {
    const smoothPts = catmullRomSpline(previewPts, 12, false)
    ctxRef.strokeStyle = "rgba(255,213,74,0.55)"
    ctxRef.lineWidth = 2
    ctxRef.setLineDash([])
    pathFromPoints(smoothPts)
    ctxRef.stroke()
  }

  ctxRef.strokeStyle = "#ffd54a"
  ctxRef.fillStyle = "#ffd54a"
  ctxRef.lineWidth = 2
  ctxRef.setLineDash([6, 4])
  ctxRef.beginPath()
  ctxRef.moveTo(pts[0].x, pts[0].y)
  for (let i = 1; i < pts.length; i++) ctxRef.lineTo(pts[i].x, pts[i].y)
  if (showMouseSegment && mousePos) {
    const mp = cp(mousePos)
    ctxRef.lineTo(mp.x, mp.y)
  }
  ctxRef.stroke()
  ctxRef.setLineDash([])
  pts.forEach((pt) => {
    ctxRef.beginPath()
    ctxRef.arc(pt.x, pt.y, 4, 0, Math.PI * 2)
    ctxRef.fill()
  })
  ctxRef.restore()
}

export { initRender, resizeOverlay, draw }
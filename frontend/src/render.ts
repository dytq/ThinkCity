import type { Map as LeafletMap } from 'leaflet'

import {
  cp,
  metersToPixels,
  pathFromPoints,
  catmullRomSpline,
  smoothIfNeeded,
  walkPath,
  offsetPolyline
} from './geometry.ts'
import type { Pt, LatLngLike } from './geometry.ts'

import { buildPatterns } from './texture.ts'
import type { Patterns } from './texture.ts'

/* ------------------------------------------------------------------ */
/* Types                                                              */
/* ------------------------------------------------------------------ */

export type ElementType =
  | 'espace_vert'
  | 'massif'
  | 'hachures'
  | 'chemin_pieton'
  | 'piste_cyclable'
  | 'bande_cyclable'
  | 'rue_cyclable'
  | 'route'
  | 'rond_point'
  | 'stationnement'
  | 'passage_pieton'
  | 'cedez_le_passage'
  | 'ligne_stop'
  | 'stop_sol'
  | 'fleche_sol'
  | 'chevron_velo'
  | 'arbre'
  | 'feu_clignotant'
  | 'feu_tricolore'
  // --- nouveaux types ---
  | 'rails_tramway'
  | 'voie_bus'
  | 'eau'
  | 'zone_pietonne'
  | 'chaussee'
  | 'arret_bus'
  | 'batiment'
  | 'entree_metro'
  | 'vehicule'
  | 'camion'
  | 'bus'
  | 'tramway'
  | 'deux_roues'
  | 'velo'
  | 'banc_public'
  | 'eclairage_public'
  | 'parking_velo'
  | 'fontaine'
  | 'ligne_continue'
  | 'ligne_discontinue'

type VehicleType = 'vehicule' | 'camion' | 'bus' | 'tramway' | 'deux_roues' | 'velo'

export type Direction = 'unidirectional' | 'bidirectional'
export type ParkingLayout = 'bataille' | 'epi' | 'creneau'
export type CornerStyle = 'straight' | 'smooth'
export type ArrowType =
  | 'tout_droit'
  | 'gauche'
  | 'droite'
  | 'tout_droit_gauche'
  | 'tout_droit_droite'

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
  height?: number
  dashLength?: number
  dashGap?: number
}

export interface ToolConfigEntry {
  mode?: 'point' | 'edit' | string
}

export interface RenderState {
  drawingPoints: LatLngLike[]
  elements: MapElement[]
  selectedElementForEdit: MapElement | null
  currentTool: string | null
  toolConfig: Record<string, ToolConfigEntry>
  mousePos: LatLngLike | null
  byId: (id: string) => HTMLInputElement
  /** false = les éléments déjà placés sont masqués (l'aperçu du tracé en cours reste visible) */
  showElements: boolean
}

export interface RenderInit {
  overlay: HTMLCanvasElement
  map: LeafletMap
  ctx: CanvasRenderingContext2D
  getState: () => RenderState
}

export type { Patterns }

/* ------------------------------------------------------------------ */
/* État du module                                                     */
/* ------------------------------------------------------------------ */

let overlayRef: HTMLCanvasElement | null = null
let drawingPointsRef: LatLngLike[] = []
let mapRef: LeafletMap | null = null
// Initialisé par initRender() ; draw() vérifie quand même qu'il est défini.
let ctxRef: CanvasRenderingContext2D
let elementsRef: MapElement[] = []
let selectedElementForEditRef: MapElement | null = null
let currentToolRef: string | null = null
let getStateRef: (() => RenderState) | null = null
let toolConfig: Record<string, ToolConfigEntry> = {}
let mousePos: LatLngLike | null = null
let byId: ((id: string) => HTMLInputElement) | null = null
let showElementsRef = true

let asphaltPattern!: CanvasPattern
let grassPattern!: CanvasPattern
let bushPattern!: CanvasPattern
let pavementPattern!: CanvasPattern
let waterPattern!: CanvasPattern
let ballastPattern!: CanvasPattern
let busLanePattern!: CanvasPattern
let roofPattern!: CanvasPattern

/*
  Ordre d'empilement par défaut (utilisé seulement si `z` est absent).
  Synchronisé avec le zOrderBase du composant Vue.
*/
const zOrderBase: Record<ElementType, number> = {
  route: 0,
  chaussee: 0.5,
  eau: 0.8,
  espace_vert: 1,
  zone_pietonne: 1.5,
  massif: 2,
  batiment: 2.5,
  hachures: 3,

  piste_cyclable: 4,
  bande_cyclable: 4.5,
  rue_cyclable: 4.6,
  voie_bus: 4.7,
  rails_tramway: 4.8,
  chemin_pieton: 5,

  rond_point: 6,
  stationnement: 7,
  ligne_continue: 7.5,
  ligne_discontinue: 7.6,

  passage_pieton: 8,
  cedez_le_passage: 9,
  arret_bus: 9.5,
  ligne_stop: 10,
  stop_sol: 10.2,
  fleche_sol: 10.4,
  chevron_velo: 10.6,

  arbre: 11,
  entree_metro: 11.2,
  banc_public: 11.3,
  parking_velo: 11.4,
  fontaine: 11.5,
  feu_tricolore: 12,
  eclairage_public: 12.2,
  feu_clignotant: 12.5,

  vehicule: 13,
  camion: 13.1,
  bus: 13.2,
  tramway: 13.3,
  deux_roues: 13.4,
  velo: 13.5
}

/** Tracés sur lesquels on peut démarrer une branche (doit rester synchronisé avec le composant). */
const BRANCHABLE_TYPES: readonly string[] = ['route', 'piste_cyclable', 'chemin_pieton', 'voie_bus', 'rails_tramway']

/** Dimensions réelles (en mètres) des véhicules + tailles minimales à l'écran (px). */
const VEHICLE_SPECS: Record<VehicleType, { len: number, wid: number, minLen: number, minWid: number, color: string }> = {
  vehicule: { len: 4.5, wid: 1.8, minLen: 14, minWid: 7, color: '#4a6fa5' },
  camion: { len: 10, wid: 2.5, minLen: 28, minWid: 9, color: '#4a6fa5' },
  bus: { len: 12, wid: 2.55, minLen: 32, minWid: 9, color: '#4a6fa5' },
  tramway: { len: 30, wid: 2.4, minLen: 70, minWid: 9, color: '#4a6fa5' },
  deux_roues: { len: 2, wid: 0.8, minLen: 10, minWid: 4, color: '#4a6fa5' },
  velo: { len: 1.8, wid: 0.6, minLen: 9, minWid: 3.5, color: '#4a6fa5' }
}

/* ------------------------------------------------------------------ */
/* Init / sync                                                        */
/* ------------------------------------------------------------------ */

function initRender ({ overlay, map, ctx, getState }: RenderInit): void {
  if (ctx == null) {
    throw new Error('Impossible d’initialiser le contexte Canvas 2D')
  }
  overlayRef = overlay
  mapRef = map
  ctxRef = ctx
  getStateRef = getState
  const patterns: Patterns = buildPatterns(ctx)
  ;({
    asphaltPattern, grassPattern, bushPattern, pavementPattern,
    waterPattern, ballastPattern, busLanePattern, roofPattern
  } = patterns)
}

function syncRenderState (): void {
  if (getStateRef == null) return

  const state = getStateRef()

  drawingPointsRef = state.drawingPoints
  elementsRef = state.elements
  selectedElementForEditRef = state.selectedElementForEdit
  currentToolRef = state.currentTool
  toolConfig = state.toolConfig
  mousePos = state.mousePos
  byId = state.byId
  showElementsRef = state.showElements
}

function resizeOverlay (): void {
  if ((mapRef == null) || (overlayRef == null)) return
  const size = mapRef.getSize()
  overlayRef.width = size.x
  overlayRef.height = size.y
  draw()
}

function draw (): void {
  syncRenderState()

  if ((overlayRef == null) || ctxRef == null || elementsRef == null) return
  if (overlayRef.width === 0 || overlayRef.height === 0) return

  ctxRef.clearRect(0, 0, overlayRef.width, overlayRef.height)
  const sorted = (showElementsRef ? [...elementsRef] : []).sort((a, b) => {
    const za = a.z !== undefined ? a.z : zOrderBase[a.type]
    const zb = b.z !== undefined ? b.z : zOrderBase[b.type]
    return za - zb
  })
  sorted.forEach((e) => {
    switch (e.type) {
      case 'espace_vert': drawGreenSpace(e); break
      case 'massif': drawBushMass(e); break
      case 'hachures': drawHatchZone(e); break
      case 'chemin_pieton': drawPedestrianPath(e); break
      case 'piste_cyclable': drawCyclePath(e); break
      case 'bande_cyclable': drawPaintedCycleLane(e); break
      case 'rue_cyclable': drawCycleStreet(e); break
      case 'route': drawRoad(e); break
      case 'rond_point': drawRoundabout(e); break
      case 'stationnement': drawParking(e); break
      case 'passage_pieton': drawCrossing(e); break
      case 'cedez_le_passage': drawYieldLine(e); break
      case 'ligne_stop': drawStopLine(e); break
      case 'stop_sol': drawGroundStop(e); break
      case 'fleche_sol': drawGroundArrow(e); break
      case 'chevron_velo': drawSharrow(e); break
      case 'arbre': drawTree(e); break
      case 'feu_clignotant': drawBlinkingLight(e); break
      case 'feu_tricolore': drawTrafficLight(e); break
      // --- nouveaux types ---
      case 'rails_tramway': drawTramRails(e); break
      case 'voie_bus': drawBusLane(e); break
      case 'eau': drawWater(e); break
      case 'zone_pietonne': drawPedestrianZone(e); break
      case 'chaussee': drawRoadSurface(e); break
      case 'arret_bus': drawBusStop(e); break
      case 'batiment': drawBuilding(e); break
      case 'entree_metro': drawMetroEntrance(e); break
      case 'vehicule':
      case 'camion':
      case 'bus':
      case 'tramway':
      case 'deux_roues':
      case 'velo': drawVehicle(e); break
      case 'banc_public': drawBench(e); break
      case 'eclairage_public': drawStreetLamp(e); break
      case 'parking_velo': drawBikeRack(e); break
      case 'fontaine': drawFountain(e); break
      case 'ligne_continue': drawSolidLine(e); break
      case 'ligne_discontinue': drawDashedLine(e); break
    }
  })
  if (showElementsRef) {
    drawEditHandles()
    drawBranchNodesOverlay()
  }
  drawPreview()
}

/* ------------------------------------------------------------------ */
/* Helpers communs                                                    */
/* ------------------------------------------------------------------ */

/** Trace (sans remplir) un polygone fermé à angles droits. */
function tracePolygon (pts: Pt[]): void {
  ctxRef.beginPath()
  pts.forEach((p, i) => {
    if (i === 0) ctxRef.moveTo(p.x, p.y)
    else ctxRef.lineTo(p.x, p.y)
  })
  ctxRef.closePath()
}

/** Trace (sans remplir) un rectangle à coins arrondis. */
function roundRectPath (x: number, y: number, w: number, h: number, r: number): void {
  const rr = Math.max(0, Math.min(r, w / 2, h / 2))
  ctxRef.beginPath()
  ctxRef.moveTo(x + rr, y)
  ctxRef.lineTo(x + w - rr, y)
  ctxRef.arcTo(x + w, y, x + w, y + rr, rr)
  ctxRef.lineTo(x + w, y + h - rr)
  ctxRef.arcTo(x + w, y + h, x + w - rr, y + h, rr)
  ctxRef.lineTo(x + rr, y + h)
  ctxRef.arcTo(x, y + h, x, y + h - rr, rr)
  ctxRef.lineTo(x, y + rr)
  ctxRef.arcTo(x, y, x + rr, y, rr)
  ctxRef.closePath()
}

/** Évite le texte à l'envers : retourne l'angle ramené dans le demi-plan lisible. */
function uprightAngle (a: number): number {
  return Math.cos(a) < 0 ? a + Math.PI : a
}

/* ------------------------------------------------------------------ */
/* Mobilier / signalisation                                           */
/* ------------------------------------------------------------------ */

function drawBlinkingLight (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return

  const p = cp(coord)

  const isBlinkingOn = Math.floor(Date.now() / 400) % 2 === 0

  ctxRef.save()

  ctxRef.strokeStyle = '#333333'
  ctxRef.lineWidth = 3
  ctxRef.beginPath()
  ctxRef.moveTo(p.x, p.y + 10)
  ctxRef.lineTo(p.x, p.y - 12)
  ctxRef.stroke()

  ctxRef.fillStyle = '#1a1a1a'
  ctxRef.strokeStyle = '#444'
  ctxRef.lineWidth = 1
  ctxRef.fillRect(p.x - 6, p.y - 24, 12, 16)
  ctxRef.strokeRect(p.x - 6, p.y - 24, 12, 16)

  if (isBlinkingOn) {
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y - 16, 12, 0, Math.PI * 2)
    ctxRef.fillStyle = 'rgba(255, 204, 0, 0.35)'
    ctxRef.fill()
  }

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y - 16, 4.5, 0, Math.PI * 2)
  ctxRef.fillStyle = isBlinkingOn ? '#ffcc00' : '#665200'
  ctxRef.fill()

  ctxRef.strokeStyle = '#ffffff'
  ctxRef.lineWidth = 1.2
  ctxRef.stroke()

  ctxRef.restore()
}

function drawEditHandles (): void {
  if (selectedElementForEditRef == null) return
  ctxRef.save()
  ctxRef.fillStyle = '#ff9d3d'
  ctxRef.strokeStyle = '#ffffff'
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

function drawBranchNodesOverlay (): void {
  if (currentToolRef !== 'branch') return
  ctxRef.save()
  ctxRef.fillStyle = '#3cb371'
  ctxRef.strokeStyle = '#ffffff'
  ctxRef.lineWidth = 2
  elementsRef.forEach((e) => {
    if (BRANCHABLE_TYPES.includes(e.type)) {
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

function drawRoad (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const lanes = Math.max(1, Math.round(e.lanes ?? 2))
  const bidirectional = e.direction !== 'unidirectional'
  const widthPx = Math.max(4, metersToPixels(e.width ?? 6, lat))
  const lineCapStyle: CanvasLineCap = e.lineCap ?? 'round'

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = lineCapStyle

  pathFromPoints(pts)
  ctxRef.strokeStyle = '#2c2c2c'
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
    centerIdx = dividerFracs.reduce((best, val, idx) => {
      const bestVal = dividerFracs[best]

      if (bestVal === undefined) return idx

      return Math.abs(val) < Math.abs(bestVal) ? idx : best
    }, 0)
  }

  dividerFracs.forEach((frac, idx) => {
    const offsetPts = offsetPolyline(pts, frac * widthPx)
    ctxRef.beginPath()
    const offsetPtsFirst = offsetPts[0]
    if (offsetPtsFirst == null) return
    ctxRef.moveTo(offsetPtsFirst.x, offsetPtsFirst.y)
    for (let k = 1; k < offsetPts.length; k++) {
      const offsetPtsK = offsetPts[k]
      if (offsetPtsK == null) continue
      ctxRef.lineTo(offsetPtsK.x, offsetPtsK.y)
    }
    if (idx === centerIdx) {
      ctxRef.setLineDash([])
      ctxRef.strokeStyle = '#ffffff'
      ctxRef.lineWidth = Math.max(1.6, widthPx * 0.045)
      ctxRef.stroke()
    } else {
      ctxRef.setLineDash([metersToPixels(3, lat), metersToPixels(3, lat)])
      ctxRef.strokeStyle = '#ffffff'
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

function drawRoadArrows (pts: Pt[], widthPx: number, lanes: number, lat: number): void {
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

function drawArrowIcon (p: Pt, angle: number, size: number): void {
  ctxRef.save()
  ctxRef.translate(p.x, p.y)
  ctxRef.rotate(angle)
  ctxRef.strokeStyle = 'rgba(255,255,255,0.9)'
  ctxRef.fillStyle = 'rgba(255,255,255,0.9)'
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

function drawRoundabout (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  const lat = coord.lat
  const r = Math.max(10, metersToPixels(e.radius ?? 12, lat))
  const lanes = Math.max(1, Math.round(e.lanes ?? 2))
  const ringWidth = r * (0.3 + lanes * 0.1)

  ctxRef.save()
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.strokeStyle = '#c9c9c9'
  ctxRef.lineWidth = 4
  ctxRef.stroke()

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.arc(p.x, p.y, r - ringWidth, 0, Math.PI * 2, true)
  ctxRef.fillStyle = asphaltPattern
  ctxRef.fill()
  ctxRef.strokeStyle = '#2c2c2c'
  ctxRef.lineWidth = 2
  ctxRef.stroke()

  for (let i = 1; i < lanes; i++) {
    const laneRadius = r - ringWidth * (i / lanes)
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y, laneRadius, 0, Math.PI * 2)
    ctxRef.setLineDash([metersToPixels(2, lat), metersToPixels(2, lat)])
    ctxRef.strokeStyle = '#ffffff'
    ctxRef.lineWidth = Math.max(1.2, r * 0.025)
    ctxRef.stroke()
    ctxRef.setLineDash([])
  }

  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r - ringWidth - 2, 0, Math.PI * 2)
  ctxRef.fillStyle = grassPattern
  ctxRef.fill()
  ctxRef.strokeStyle = '#345c28'
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

function drawHatchZone (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const hatchSpacing = Math.max(8, metersToPixels(e.hatchWidth ?? 1.5, lat))
  const cornerStyle: CornerStyle = e.cornerStyle ?? 'straight'

  ctxRef.save()

  if (cornerStyle === 'smooth') {
    drawSmoothPolygon(pts)
  } else {
    ctxRef.beginPath()
    const pt = pts[0]
    if (pt == null) return
    ctxRef.moveTo(pt.x, pt.y)
    for (let i = 1; i < pts.length; i++) {
      const ptI = pts[i]
      if (ptI == null) continue
      ctxRef.lineTo(ptI.x, ptI.y)
    }
    ctxRef.closePath()
  }

  ctxRef.fillStyle = asphaltPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2.5
  ctxRef.strokeStyle = '#ffffff'
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

  ctxRef.strokeStyle = '#ffffff'
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

function drawCyclePath (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(3, metersToPixels(e.width ?? 2, lat))
  const bidirectional = e.direction === 'bidirectional'
  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = e.lineCap ?? 'round'

  pathFromPoints(pts)
  ctxRef.strokeStyle = e.color ?? '#3c8a3c'
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
    ctxRef.strokeStyle = 'rgba(255,255,255,0.9)'
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

function drawBikePictograms (pts: Pt[], widthPx: number, lat: number, reversed: boolean): void {
  const step = metersToPixels(14, lat)
  if (step < 8) return
  walkPath(pts, step, (p, dirAngle) => {
    const angle = reversed ? dirAngle + Math.PI : dirAngle
    ctxRef.save()
    ctxRef.translate(p.x, p.y)
    ctxRef.rotate(angle)
    const s = Math.max(6, widthPx * 0.4)
    ctxRef.strokeStyle = 'rgba(255,255,255,0.92)'
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

function drawPaintedCycleLane (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(6, metersToPixels(e.width ?? 1.5, lat))
  const bidirectional = e.direction === 'bidirectional'
  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = e.lineCap ?? 'round'

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.3
  ctxRef.strokeStyle = e.color ?? '#3c8a3c'
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  ;[widthPx / 2, -widthPx / 2].forEach((off) => {
    const edge = offsetPolyline(pts, off)
    ctxRef.beginPath()
    const edgeFirst = edge[0]
    if (edgeFirst == null) return
    ctxRef.moveTo(edgeFirst.x, edgeFirst.y)
    for (let k = 1; k < edge.length; k++) {
      const edgeK = edge[k]
      if (edgeK == null) continue
      ctxRef.lineTo(edgeK.x, edgeK.y)
    }
    ctxRef.strokeStyle = '#ffffff'
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

function drawCycleStreet (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const step = metersToPixels(18, lat)
  if (step < 10) return
  walkPath(pts, step, (p, angle) => {
    ctxRef.save()
    ctxRef.translate(p.x, p.y)
    ctxRef.rotate(angle)
    const s = Math.max(9, metersToPixels(1.1, lat))
    ctxRef.strokeStyle = 'rgba(255,255,255,0.95)'
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

function drawPedestrianPath (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(4, metersToPixels(e.width ?? 2.5, lat))

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = e.lineCap ?? 'round'

  // Bordure
  pathFromPoints(pts)
  ctxRef.strokeStyle = '#8f887a'
  ctxRef.lineWidth = widthPx + 3
  ctxRef.stroke()

  // Dallage
  pathFromPoints(pts)
  ctxRef.strokeStyle = pavementPattern
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.restore()
}

function drawParking (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const layout: ParkingLayout = e.layout ?? 'bataille'
  const bayWidth = Math.max(6, metersToPixels(e.bay ?? 2.5, lat))
  const depthPx = Math.max(10, metersToPixels(e.depth ?? 5, lat))

  ctxRef.save()
  ctxRef.lineCap = 'butt'
  ctxRef.lineJoin = 'round'

  let bandThickness = depthPx
  if (layout === 'creneau') bandThickness = Math.max(8, metersToPixels(2.2, lat))

  pathFromPoints(pts)
  ctxRef.strokeStyle = '#333333'
  ctxRef.lineWidth = bandThickness
  ctxRef.stroke()

  pathFromPoints(pts)
  ctxRef.globalAlpha = 0.5
  ctxRef.strokeStyle = asphaltPattern
  ctxRef.lineWidth = bandThickness
  ctxRef.stroke()
  ctxRef.globalAlpha = 1

  ctxRef.strokeStyle = '#ffffff'
  ctxRef.lineWidth = Math.max(1.5, bayWidth * 0.05)

  let distAcc = 0
  let next = bayWidth / 2
  for (let i = 0; i < pts.length - 1; i++) {
    const a = pts[i]
    const b = pts[i + 1]
    if ((a == null) || (b == null)) continue
    const segLen = Math.hypot(b.x - a.x, b.y - a.y)
    const angle = Math.atan2(b.y - a.y, b.x - a.x)
    const nx = Math.cos(angle + Math.PI / 2)
    const ny = Math.sin(angle + Math.PI / 2)

    while (next <= distAcc + segLen) {
      const t = (next - distAcc) / segLen
      const x = a.x + (b.x - a.x) * t
      const y = a.y + (b.y - a.y) * t

      if (layout === 'bataille') {
        ctxRef.beginPath()
        ctxRef.moveTo(x - (nx * bandThickness) / 2, y - (ny * bandThickness) / 2)
        ctxRef.lineTo(x + (nx * bandThickness) / 2, y + (ny * bandThickness) / 2)
        ctxRef.stroke()
      } else if (layout === 'epi') {
        const angleEpi = angle + Math.PI / 4
        const ux2 = Math.cos(angleEpi)
        const uy2 = Math.sin(angleEpi)
        const halfLen = bandThickness / 2 / Math.sin(Math.PI / 4)
        ctxRef.beginPath()
        ctxRef.moveTo(x - ux2 * halfLen, y - uy2 * halfLen)
        ctxRef.lineTo(x + ux2 * halfLen, y + uy2 * halfLen)
        ctxRef.stroke()
      } else if (layout === 'creneau') {
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

function drawCrossing (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const dx = P2.x - P1.x
  const dy = P2.y - P1.y
  const total = Math.hypot(dx, dy)
  if (total < 2) return
  const ux = dx / total
  const uy = dy / total
  const nx = -uy
  const ny = ux
  const stripeW = Math.max(2, metersToPixels(e.stripeWidth ?? 0.5, lat))
  const spanPx = Math.max(6, metersToPixels(e.span ?? 3.5, lat))

  ctxRef.save()
  ctxRef.fillStyle = '#ffffff'
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

function drawYieldLine (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
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
  ctxRef.fillStyle = '#ffffff'
  ctxRef.strokeStyle = '#2c2c2c'
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

function drawStopLine (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const thickness = Math.max(3, metersToPixels(0.5, lat))

  ctxRef.save()
  pathFromPoints(pts)
  ctxRef.strokeStyle = '#ffffff'
  ctxRef.lineWidth = thickness
  ctxRef.lineCap = 'square'
  ctxRef.stroke()
  ctxRef.restore()
}

function drawGroundStop (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const cx = (P1.x + P2.x) / 2
  const cy = (P1.y + P2.y) / 2
  const unit = Math.max(10, metersToPixels(1, lat))

  ctxRef.save()
  ctxRef.translate(cx, cy)
  ctxRef.rotate(angle - Math.PI / 2)
  ctxRef.scale(1, 2.4)
  ctxRef.fillStyle = '#ffffff'
  ctxRef.font = `bold ${Math.max(9, unit * 2.6)}px Arial, sans-serif`
  ctxRef.textAlign = 'center'
  ctxRef.textBaseline = 'middle'
  ctxRef.fillText('STOP', 0, 0)
  ctxRef.restore()
}

function drawGroundArrow (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const L_ = Math.max(20, metersToPixels(2.6, lat))
  const type: ArrowType = e.arrowType ?? 'tout_droit'
  const headSize = L_ * 0.22

  function arrowHead (x: number, y: number, dirAngle: number): void {
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
  ctxRef.strokeStyle = '#ffffff'
  ctxRef.fillStyle = '#ffffff'
  ctxRef.lineWidth = Math.max(2, L_ * 0.09)
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = 'round'

  if (type === 'tout_droit' || type === 'tout_droit_gauche' || type === 'tout_droit_droite') {
    ctxRef.beginPath(); ctxRef.moveTo(0, 0); ctxRef.lineTo(L_ * 0.75, 0); ctxRef.stroke()
    arrowHead(L_ * 0.75, 0, 0)
  }
  if (type === 'gauche' || type === 'tout_droit_gauche') {
    const bendX = type === 'gauche' ? L_ * 0.55 : L_ * 0.4
    ctxRef.beginPath()
    ctxRef.moveTo(0, 0)
    ctxRef.lineTo(bendX, 0)
    ctxRef.quadraticCurveTo(bendX + L_ * 0.15, 0, bendX + L_ * 0.15, -L_ * 0.25)
    ctxRef.stroke()
    arrowHead(bendX + L_ * 0.15, -L_ * 0.3, -Math.PI / 2)
  }
  if (type === 'droite' || type === 'tout_droit_droite') {
    const bendX = type === 'droite' ? L_ * 0.55 : L_ * 0.4
    ctxRef.beginPath()
    ctxRef.moveTo(0, 0)
    ctxRef.lineTo(bendX, 0)
    ctxRef.quadraticCurveTo(bendX + L_ * 0.15, 0, bendX + L_ * 0.15, L_ * 0.25)
    ctxRef.stroke()
    arrowHead(bendX + L_ * 0.15, L_ * 0.3, Math.PI / 2)
  }
  ctxRef.restore()
}

function drawSharrow (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const cx = (P1.x + P2.x) / 2
  const cy = (P1.y + P2.y) / 2
  const s = Math.max(10, metersToPixels(0.9, lat))

  ctxRef.save()
  ctxRef.translate(cx, cy)
  ctxRef.rotate(angle)
  ctxRef.strokeStyle = '#ffffff'
  ctxRef.fillStyle = '#ffffff'
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

function drawSmoothPolygon (pts: Pt[]): void {
  ctxRef.beginPath()
  const n = pts.length
  const mid = (a: Pt, b: Pt): Pt => ({ x: (a.x + b.x) / 2, y: (a.y + b.y) / 2 })
  const ptOrigin = pts[n - 1]
  const ptDest = pts[0]
  if ((ptOrigin == null) || (ptDest == null)) return
  const m0 = mid(ptOrigin, ptDest)
  ctxRef.moveTo(m0.x, m0.y)
  for (let i = 0; i < n; i++) {
    const cur = pts[i]
    const next = pts[(i + 1) % n]
    if ((cur == null) || (next == null)) continue
    const m = mid(cur, next)
    ctxRef.quadraticCurveTo(cur.x, cur.y, m.x, m.y)
  }
  ctxRef.closePath()
}

function drawGreenSpace (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  drawSmoothPolygon(pts)
  ctxRef.fillStyle = grassPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2
  ctxRef.strokeStyle = '#345c28'
  ctxRef.stroke()
  ctxRef.restore()
}

function drawBushMass (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  drawSmoothPolygon(pts)
  ctxRef.fillStyle = bushPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2.5
  ctxRef.strokeStyle = '#1c3c20'
  ctxRef.stroke()
  ctxRef.restore()
}

function drawTree (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  const lat = coord.lat
  const r = Math.max(5, metersToPixels(e.radius ?? 2.2, lat))
  ctxRef.save()
  ctxRef.beginPath()
  ctxRef.ellipse(p.x + r * 0.25, p.y + r * 0.3, r * 0.95, r * 0.75, 0, 0, Math.PI * 2)
  ctxRef.fillStyle = 'rgba(0,0,0,0.28)'
  ctxRef.fill()

  const grad = ctxRef.createRadialGradient(p.x - r * 0.3, p.y - r * 0.3, r * 0.1, p.x, p.y, r)
  grad.addColorStop(0, '#93d65e')
  grad.addColorStop(0.55, '#4f9c3a')
  grad.addColorStop(1, '#1f5c22')
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.fillStyle = grad
  ctxRef.fill()
  ctxRef.restore()
}

function drawTrafficLight (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  ctxRef.save()
  ctxRef.strokeStyle = '#333333'
  ctxRef.lineWidth = 3
  ctxRef.beginPath()
  ctxRef.moveTo(p.x, p.y + 10)
  ctxRef.lineTo(p.x, p.y - 12)
  ctxRef.stroke()

  ctxRef.fillStyle = '#1a1a1a'
  ctxRef.strokeStyle = '#444'
  ctxRef.lineWidth = 1
  ctxRef.fillRect(p.x - 5, p.y - 24, 10, 22)
  ctxRef.strokeRect(p.x - 5, p.y - 24, 10, 22)

  ctxRef.fillStyle = '#e14b4b'; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 19, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.fillStyle = '#ffa500'; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 13, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.fillStyle = '#3cb371'; ctxRef.beginPath(); ctxRef.arc(p.x, p.y - 7, 2.2, 0, Math.PI * 2); ctxRef.fill()
  ctxRef.restore()
}

/* ================================================================== */
/* ===================== NOUVEAUX ÉLÉMENTS ========================== */
/* ================================================================== */

/* ------------------------------------------------------------------ */
/* Zones : chaussée, eau, zone piétonne                               */
/* ------------------------------------------------------------------ */

function drawRoadSurface (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  ctxRef.lineJoin = 'round'
  tracePolygon(pts)
  ctxRef.fillStyle = '#2c2c2c'
  ctxRef.fill()
  ctxRef.globalAlpha = 0.55
  ctxRef.fillStyle = asphaltPattern
  ctxRef.fill()
  ctxRef.globalAlpha = 1
  ctxRef.lineWidth = 1.5
  ctxRef.strokeStyle = '#1d1d1d'
  ctxRef.stroke()
  ctxRef.restore()
}

function drawWater (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return

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

  ctxRef.save()
  drawSmoothPolygon(pts)
  ctxRef.fillStyle = waterPattern
  ctxRef.fill()
  // Voile en dégradé pour donner de la profondeur
  const grad = ctxRef.createLinearGradient(minX, minY, maxX, maxY)
  grad.addColorStop(0, 'rgba(120,190,240,0.45)')
  grad.addColorStop(1, 'rgba(20,70,120,0.45)')
  ctxRef.fillStyle = grad
  ctxRef.fill()
  ctxRef.lineWidth = 2.5
  ctxRef.strokeStyle = '#c9c4b8'
  ctxRef.stroke()

  // Ondulations clippées dans la surface
  ctxRef.clip()
  ctxRef.strokeStyle = 'rgba(255,255,255,0.22)'
  ctxRef.lineWidth = 1.4
  const waveStep = 16
  const waveLen = 24
  for (let y = minY + waveStep / 2; y < maxY; y += waveStep) {
    ctxRef.beginPath()
    const phase = ((y - minY) / waveStep) % 2 === 0 ? 0 : waveLen / 2
    ctxRef.moveTo(minX - waveLen + phase, y)
    for (let x = minX - waveLen + phase; x < maxX + waveLen; x += waveLen) {
      ctxRef.quadraticCurveTo(x + waveLen / 4, y - 3, x + waveLen / 2, y)
      ctxRef.quadraticCurveTo(x + (waveLen * 3) / 4, y + 3, x + waveLen, y)
    }
    ctxRef.stroke()
  }
  ctxRef.restore()
}

function drawPedestrianZone (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  ctxRef.save()
  ctxRef.lineJoin = 'round'
  tracePolygon(pts)
  ctxRef.fillStyle = pavementPattern
  ctxRef.fill()
  ctxRef.lineWidth = 3
  ctxRef.strokeStyle = '#8f887a'
  ctxRef.stroke()
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Voiries : rails de tramway, voie de bus                            */
/* ------------------------------------------------------------------ */

function drawTramRails (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  // `width` = largeur de la plateforme ; l'écartement des rails est l'écartement standard (1,435 m)
  const bedPx = Math.max(8, metersToPixels(e.width ?? 3, lat))
  const gaugeHalf = Math.max(2.5, metersToPixels(1.435, lat) / 2)
  const railPx = Math.max(1.2, metersToPixels(0.1, lat))

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = e.lineCap ?? 'butt'

  // Plateforme (ballast)
  pathFromPoints(pts)
  ctxRef.strokeStyle = ballastPattern
  ctxRef.lineWidth = bedPx
  ctxRef.stroke()

  // Traverses
  const sleeperStep = Math.max(4, metersToPixels(0.7, lat))
  walkPath(pts, sleeperStep, (p, angle) => {
    ctxRef.save()
    ctxRef.translate(p.x, p.y)
    ctxRef.rotate(angle)
    ctxRef.strokeStyle = '#4a4540'
    ctxRef.lineWidth = Math.max(1, sleeperStep * 0.3)
    ctxRef.beginPath()
    ctxRef.moveTo(0, -gaugeHalf * 1.35)
    ctxRef.lineTo(0, gaugeHalf * 1.35)
    ctxRef.stroke()
    ctxRef.restore()
  })

  // Rails
  ;[gaugeHalf, -gaugeHalf].forEach((off) => {
    const rail = offsetPolyline(pts, off)
    const first = rail[0]
    if (first == null) return
    ctxRef.beginPath()
    ctxRef.moveTo(first.x, first.y)
    for (let k = 1; k < rail.length; k++) {
      const pk = rail[k]
      if (pk == null) continue
      ctxRef.lineTo(pk.x, pk.y)
    }
    ctxRef.strokeStyle = '#d4d6d8'
    ctxRef.lineWidth = railPx
    ctxRef.stroke()
  })
  ctxRef.restore()
}

function drawBusLane (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(6, metersToPixels(e.width ?? 3.5, lat))

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = e.lineCap ?? 'butt'

  // Revêtement rouge
  pathFromPoints(pts)
  ctxRef.strokeStyle = busLanePattern
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()

  // Bords blancs
  ;[widthPx / 2, -widthPx / 2].forEach((off) => {
    const edge = offsetPolyline(pts, off)
    const first = edge[0]
    if (first == null) return
    ctxRef.beginPath()
    ctxRef.moveTo(first.x, first.y)
    for (let k = 1; k < edge.length; k++) {
      const pk = edge[k]
      if (pk == null) continue
      ctxRef.lineTo(pk.x, pk.y)
    }
    ctxRef.strokeStyle = '#ffffff'
    ctxRef.lineWidth = Math.max(1.2, widthPx * 0.05)
    ctxRef.stroke()
  })

  // Inscription « BUS » répétée
  const step = metersToPixels(24, lat)
  if (step >= 24) {
    const fontPx = Math.max(8, widthPx * 0.42)
    walkPath(pts, step, (p, angle) => {
      ctxRef.save()
      ctxRef.translate(p.x, p.y)
      ctxRef.rotate(uprightAngle(angle))
      ctxRef.fillStyle = 'rgba(255,255,255,0.92)'
      ctxRef.font = `bold ${fontPx}px Arial, sans-serif`
      ctxRef.textAlign = 'center'
      ctxRef.textBaseline = 'middle'
      ctxRef.fillText('BUS', 0, 0)
      ctxRef.restore()
    })
  }
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Arrêt de bus                                                       */
/* ------------------------------------------------------------------ */

function drawBusStop (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const dx = P2.x - P1.x
  const dy = P2.y - P1.y
  const total = Math.hypot(dx, dy)
  if (total < 4) return
  const angle = Math.atan2(dy, dx)
  const depth = Math.max(8, metersToPixels(2.8, lat))

  ctxRef.save()
  ctxRef.translate(P1.x, P1.y)
  ctxRef.rotate(angle)

  // Zone d'arrêt (marquage jaune)
  ctxRef.fillStyle = 'rgba(255,204,0,0.14)'
  ctxRef.fillRect(0, 0, total, depth)
  ctxRef.strokeStyle = '#ffcc00'
  ctxRef.lineWidth = Math.max(1.5, depth * 0.07)
  ctxRef.setLineDash([depth * 0.5, depth * 0.3])
  ctxRef.strokeRect(0, 0, total, depth)
  ctxRef.setLineDash([])

  // Inscription
  if (total > depth * 1.5) {
    ctxRef.fillStyle = '#ffcc00'
    ctxRef.font = `bold ${Math.max(7, depth * 0.45)}px Arial, sans-serif`
    ctxRef.textAlign = 'center'
    ctxRef.textBaseline = 'middle'
    ctxRef.save()
    ctxRef.translate(total / 2, depth / 2)
    ctxRef.rotate(Math.cos(angle) < 0 ? Math.PI : 0)
    ctxRef.fillText('BUS', 0, 0)
    ctxRef.restore()
  }

  // Abribus côté trottoir
  const shelterLen = Math.min(total * 0.7, Math.max(12, metersToPixels(3.5, lat)))
  const shelterDepth = Math.max(4, metersToPixels(1, lat))
  const sx = (total - shelterLen) / 2
  const sy = -shelterDepth - 2
  ctxRef.fillStyle = 'rgba(0,0,0,0.25)'
  ctxRef.fillRect(sx + 2, sy + 2, shelterLen, shelterDepth)
  ctxRef.fillStyle = 'rgba(176,214,235,0.75)'
  ctxRef.fillRect(sx, sy, shelterLen, shelterDepth)
  ctxRef.strokeStyle = '#4a5560'
  ctxRef.lineWidth = 1.2
  ctxRef.strokeRect(sx, sy, shelterLen, shelterDepth)
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Bâtiments                                                          */
/* ------------------------------------------------------------------ */

function drawBuilding (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 3) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const hPx = Math.min(90, Math.max(4, metersToPixels((e.height ?? 12) * 0.25, lat)))
  const off: Pt = { x: 0, y: -hPx }

  ctxRef.save()
  ctxRef.lineJoin = 'round'

  // Ombre portée
  tracePolygon(pts.map((p) => ({ x: p.x + hPx * 0.8, y: p.y + hPx * 0.5 })))
  ctxRef.fillStyle = 'rgba(0,0,0,0.3)'
  ctxRef.fill()

  // Façades (extrusion)
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i]
    const b = pts[(i + 1) % pts.length]
    if ((a == null) || (b == null)) continue
    const edgeAngle = Math.atan2(b.y - a.y, b.x - a.x)
    const shade = Math.round(95 + 45 * Math.abs(Math.sin(edgeAngle)))
    ctxRef.beginPath()
    ctxRef.moveTo(a.x, a.y)
    ctxRef.lineTo(b.x, b.y)
    ctxRef.lineTo(b.x + off.x, b.y + off.y)
    ctxRef.lineTo(a.x + off.x, a.y + off.y)
    ctxRef.closePath()
    ctxRef.fillStyle = `rgb(${shade},${shade},${shade + 6})`
    ctxRef.fill()
    ctxRef.lineWidth = 1
    ctxRef.strokeStyle = 'rgba(40,40,40,0.55)'
    ctxRef.stroke()
  }

  // Toit
  const roof = pts.map((p) => ({ x: p.x + off.x, y: p.y + off.y }))
  tracePolygon(roof)
  ctxRef.fillStyle = roofPattern
  ctxRef.fill()
  ctxRef.lineWidth = 2
  ctxRef.strokeStyle = '#5a5a5a'
  ctxRef.stroke()

  // Liseré clair sur le toit
  tracePolygon(roof)
  ctxRef.strokeStyle = 'rgba(255,255,255,0.25)'
  ctxRef.lineWidth = 1
  ctxRef.setLineDash([])
  ctxRef.stroke()
  ctxRef.restore()
}

function drawMetroEntrance (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  const lat = coord.lat
  const w = Math.max(14, metersToPixels(3, lat))
  const h = Math.max(10, metersToPixels(2, lat))

  ctxRef.save()
  ctxRef.translate(p.x, p.y)

  // Trémie d'escalier
  ctxRef.fillStyle = 'rgba(0,0,0,0.25)'
  ctxRef.fillRect(-w / 2 + 2, -h / 2 + 2, w, h)
  ctxRef.fillStyle = '#4b4f55'
  ctxRef.fillRect(-w / 2, -h / 2, w, h)
  ctxRef.strokeStyle = '#d0d3d6'
  ctxRef.lineWidth = 1.5
  ctxRef.strokeRect(-w / 2, -h / 2, w, h)

  // Marches
  ctxRef.strokeStyle = 'rgba(255,255,255,0.45)'
  ctxRef.lineWidth = 1
  const steps = 5
  for (let i = 1; i < steps; i++) {
    const x = -w / 2 + (w * i) / steps
    ctxRef.beginPath()
    ctxRef.moveTo(x, -h / 2 + 2)
    ctxRef.lineTo(x, h / 2 - 2)
    ctxRef.stroke()
  }

  // Panneau « M »
  const r = Math.max(6, h * 0.45)
  const cx = 0
  const cy = -h / 2 - r - 2
  ctxRef.beginPath()
  ctxRef.arc(cx, cy, r, 0, Math.PI * 2)
  ctxRef.fillStyle = '#ffffff'
  ctxRef.fill()
  ctxRef.lineWidth = 1.5
  ctxRef.strokeStyle = '#1d4e9e'
  ctxRef.stroke()
  ctxRef.fillStyle = '#1d4e9e'
  ctxRef.font = `bold ${r * 1.4}px Arial, sans-serif`
  ctxRef.textAlign = 'center'
  ctxRef.textBaseline = 'middle'
  ctxRef.fillText('M', cx, cy + r * 0.06)
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Véhicules (vue de dessus)                                          */
/* Repère local : l'arrière est en x = 0, l'avant en x = L,           */
/* l'axe central en y = 0.                                            */
/* ------------------------------------------------------------------ */

function drawVehicleLights (L_: number, W: number): void {
  const lightW = Math.max(1.5, L_ * 0.04)
  const lightH = Math.max(1.5, W * 0.18)
  // Phares avant
  ctxRef.fillStyle = '#fff3b0'
  ctxRef.fillRect(L_ - lightW, -W * 0.38, lightW, lightH)
  ctxRef.fillRect(L_ - lightW, W * 0.38 - lightH, lightW, lightH)
  // Feux arrière
  ctxRef.fillStyle = '#d33a3a'
  ctxRef.fillRect(0, -W * 0.38, lightW, lightH)
  ctxRef.fillRect(0, W * 0.38 - lightH, lightW, lightH)
}

function drawCarBody (L_: number, W: number, color: string): void {
  roundRectPath(0, -W / 2, L_, W, W * 0.3)
  ctxRef.fillStyle = color
  ctxRef.fill()
  ctxRef.lineWidth = 1
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.stroke()

  // Habitacle vitré
  roundRectPath(L_ * 0.2, -W * 0.4, L_ * 0.52, W * 0.8, W * 0.16)
  ctxRef.fillStyle = 'rgba(20,30,42,0.78)'
  ctxRef.fill()

  // Toit
  roundRectPath(L_ * 0.31, -W * 0.34, L_ * 0.28, W * 0.68, W * 0.12)
  ctxRef.fillStyle = color
  ctxRef.fill()
  ctxRef.fillStyle = 'rgba(255,255,255,0.18)'
  ctxRef.fill()

  drawVehicleLights(L_, W)
}

function drawTruckBody (L_: number, W: number, color: string): void {
  const cargoLen = L_ * 0.7
  const cabLen = L_ * 0.28
  const cabX = L_ - cabLen

  // Caisse
  roundRectPath(0, -W / 2, cargoLen, W, W * 0.08)
  ctxRef.fillStyle = '#dcdcdc'
  ctxRef.fill()
  ctxRef.lineWidth = 1
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.stroke()
  ctxRef.strokeStyle = 'rgba(0,0,0,0.15)'
  for (let i = 1; i < 4; i++) {
    const x = (cargoLen * i) / 4
    ctxRef.beginPath()
    ctxRef.moveTo(x, -W / 2 + 1)
    ctxRef.lineTo(x, W / 2 - 1)
    ctxRef.stroke()
  }

  // Cabine
  roundRectPath(cabX, -W * 0.46, cabLen, W * 0.92, W * 0.2)
  ctxRef.fillStyle = color
  ctxRef.fill()
  ctxRef.lineWidth = 1
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.stroke()

  // Pare-brise
  roundRectPath(cabX + cabLen * 0.5, -W * 0.36, cabLen * 0.38, W * 0.72, W * 0.1)
  ctxRef.fillStyle = 'rgba(20,30,42,0.78)'
  ctxRef.fill()

  drawVehicleLights(L_, W)
}

function drawBusBody (L_: number, W: number, color: string): void {
  roundRectPath(0, -W / 2, L_, W, W * 0.22)
  ctxRef.fillStyle = color
  ctxRef.fill()
  ctxRef.lineWidth = 1
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.stroke()

  // Toit clair
  roundRectPath(L_ * 0.03, -W * 0.38, L_ * 0.88, W * 0.76, W * 0.14)
  ctxRef.fillStyle = 'rgba(255,255,255,0.22)'
  ctxRef.fill()

  // Fenêtres latérales
  const windows = Math.max(3, Math.round(L_ / (W * 1.0)))
  const winLen = (L_ * 0.8) / windows
  ctxRef.fillStyle = 'rgba(20,30,42,0.78)'
  for (let i = 0; i < windows; i++) {
    const x = L_ * 0.05 + i * winLen + winLen * 0.1
    ctxRef.fillRect(x, -W * 0.5 + 1, winLen * 0.8, Math.max(1.5, W * 0.1))
    ctxRef.fillRect(x, W * 0.5 - 1 - Math.max(1.5, W * 0.1), winLen * 0.8, Math.max(1.5, W * 0.1))
  }

  // Pare-brise
  roundRectPath(L_ * 0.93, -W * 0.4, L_ * 0.05, W * 0.8, W * 0.08)
  ctxRef.fillStyle = 'rgba(20,30,42,0.85)'
  ctxRef.fill()

  drawVehicleLights(L_, W)
}

function drawTramBody (L_: number, W: number, color: string): void {
  const sections = 3
  const gap = Math.max(1.5, L_ * 0.012)
  const secLen = (L_ - gap * (sections - 1)) / sections

  for (let s = 0; s < sections; s++) {
    const x0 = s * (secLen + gap)
    roundRectPath(x0, -W / 2, secLen, W, W * 0.2)
    ctxRef.fillStyle = color
    ctxRef.fill()
    ctxRef.lineWidth = 1
    ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
    ctxRef.stroke()

    // Toit clair
    roundRectPath(x0 + secLen * 0.04, -W * 0.36, secLen * 0.92, W * 0.72, W * 0.12)
    ctxRef.fillStyle = 'rgba(255,255,255,0.25)'
    ctxRef.fill()

    // Fenêtres
    const windows = 4
    const winLen = (secLen * 0.84) / windows
    ctxRef.fillStyle = 'rgba(20,30,42,0.78)'
    const winH = Math.max(1.5, W * 0.1)
    for (let i = 0; i < windows; i++) {
      const x = x0 + secLen * 0.08 + i * winLen + winLen * 0.1
      ctxRef.fillRect(x, -W * 0.5 + 1, winLen * 0.8, winH)
      ctxRef.fillRect(x, W * 0.5 - 1 - winH, winLen * 0.8, winH)
    }
  }

  // Articulations
  ctxRef.fillStyle = '#2a2a2a'
  for (let s = 0; s < sections - 1; s++) {
    const x = (s + 1) * secLen + s * gap
    ctxRef.fillRect(x, -W * 0.3, gap, W * 0.6)
  }

  // Pare-brise avant + arrière
  ctxRef.fillStyle = 'rgba(20,30,42,0.85)'
  roundRectPath(L_ - L_ * 0.03, -W * 0.4, L_ * 0.025, W * 0.8, W * 0.06)
  ctxRef.fill()

  drawVehicleLights(L_, W)
}

function drawTwoWheelerBody (L_: number, W: number, color: string): void {
  // Roues
  ctxRef.fillStyle = '#1c1c1c'
  const wheelLen = L_ * 0.26
  const wheelW = Math.max(1.5, W * 0.28)
  roundRectPath(0, -wheelW / 2, wheelLen, wheelW, wheelW / 2)
  ctxRef.fill()
  roundRectPath(L_ - wheelLen, -wheelW / 2, wheelLen, wheelW, wheelW / 2)
  ctxRef.fill()

  // Carrosserie
  roundRectPath(L_ * 0.18, -W * 0.22, L_ * 0.64, W * 0.44, W * 0.2)
  ctxRef.fillStyle = color
  ctxRef.fill()
  ctxRef.lineWidth = 1
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.stroke()

  // Guidon
  ctxRef.strokeStyle = '#222'
  ctxRef.lineWidth = Math.max(1.2, W * 0.1)
  ctxRef.beginPath()
  ctxRef.moveTo(L_ * 0.72, -W * 0.5)
  ctxRef.lineTo(L_ * 0.72, W * 0.5)
  ctxRef.stroke()

  // Pilote
  ctxRef.beginPath()
  ctxRef.arc(L_ * 0.5, 0, Math.max(2, W * 0.3), 0, Math.PI * 2)
  ctxRef.fillStyle = '#f0b88a'
  ctxRef.fill()
  ctxRef.strokeStyle = 'rgba(0,0,0,0.5)'
  ctxRef.lineWidth = 1
  ctxRef.stroke()
}

function drawBicycleBody (L_: number, W: number, color: string): void {
  // Roues
  ctxRef.fillStyle = '#1c1c1c'
  const wheelLen = L_ * 0.28
  const wheelW = Math.max(1.2, W * 0.2)
  roundRectPath(0, -wheelW / 2, wheelLen, wheelW, wheelW / 2)
  ctxRef.fill()
  roundRectPath(L_ - wheelLen, -wheelW / 2, wheelLen, wheelW, wheelW / 2)
  ctxRef.fill()

  // Cadre
  ctxRef.strokeStyle = color
  ctxRef.lineWidth = Math.max(1.2, W * 0.14)
  ctxRef.lineCap = 'round'
  ctxRef.beginPath()
  ctxRef.moveTo(wheelLen * 0.5, 0)
  ctxRef.lineTo(L_ - wheelLen * 0.5, 0)
  ctxRef.stroke()

  // Guidon
  ctxRef.strokeStyle = '#222'
  ctxRef.lineWidth = Math.max(1, W * 0.1)
  ctxRef.beginPath()
  ctxRef.moveTo(L_ * 0.76, -W * 0.5)
  ctxRef.lineTo(L_ * 0.76, W * 0.5)
  ctxRef.stroke()

  // Cycliste (épaules + tête)
  ctxRef.fillStyle = color
  ctxRef.beginPath()
  ctxRef.ellipse(L_ * 0.5, 0, Math.max(1.5, L_ * 0.07), Math.max(2, W * 0.42), 0, 0, Math.PI * 2)
  ctxRef.fill()
  ctxRef.beginPath()
  ctxRef.arc(L_ * 0.56, 0, Math.max(1.5, W * 0.2), 0, Math.PI * 2)
  ctxRef.fillStyle = '#f0b88a'
  ctxRef.fill()
}

function drawVehicle (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const spec = VEHICLE_SPECS[e.type as VehicleType]
  if (spec == null) return

  const lat = coord.lat
  const L_ = Math.max(spec.minLen, metersToPixels(spec.len, lat))
  const W = Math.max(spec.minWid, metersToPixels(spec.wid, lat))
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const color = e.color ?? spec.color

  ctxRef.save()
  ctxRef.translate(P1.x, P1.y)
  ctxRef.rotate(angle)
  ctxRef.lineJoin = 'round'

  // Ombre portée
  roundRectPath(L_ * 0.04, -W / 2 + W * 0.12, L_, W, W * 0.25)
  ctxRef.fillStyle = 'rgba(0,0,0,0.28)'
  ctxRef.fill()

  switch (e.type) {
    case 'vehicule': drawCarBody(L_, W, color); break
    case 'camion': drawTruckBody(L_, W, color); break
    case 'bus': drawBusBody(L_, W, color); break
    case 'tramway': drawTramBody(L_, W, color); break
    case 'deux_roues': drawTwoWheelerBody(L_, W, color); break
    case 'velo': drawBicycleBody(L_, W, color); break
  }
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Mobilier urbain                                                    */
/* ------------------------------------------------------------------ */

function drawBench (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const len = Math.hypot(P2.x - P1.x, P2.y - P1.y)
  if (len < 3) return
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const depth = Math.max(4, metersToPixels(0.5, lat))

  ctxRef.save()
  ctxRef.translate(P1.x, P1.y)
  ctxRef.rotate(angle)

  // Ombre
  ctxRef.fillStyle = 'rgba(0,0,0,0.25)'
  ctxRef.fillRect(1.5, -depth / 2 + 1.5, len, depth)

  // Assise (lattes)
  ctxRef.fillStyle = '#9b6b3e'
  ctxRef.fillRect(0, -depth / 2, len, depth)
  ctxRef.strokeStyle = 'rgba(0,0,0,0.35)'
  ctxRef.lineWidth = 1
  const slats = 3
  for (let i = 1; i < slats; i++) {
    const y = -depth / 2 + (depth * i) / slats
    ctxRef.beginPath()
    ctxRef.moveTo(0, y)
    ctxRef.lineTo(len, y)
    ctxRef.stroke()
  }
  ctxRef.strokeStyle = '#3a2a1a'
  ctxRef.lineWidth = 1.5
  ctxRef.strokeRect(0, -depth / 2, len, depth)

  // Pieds métalliques
  ctxRef.fillStyle = '#2f3338'
  const legW = Math.max(1.5, depth * 0.22)
  ctxRef.fillRect(len * 0.08, -depth / 2 - 1, legW, depth + 2)
  ctxRef.fillRect(len * 0.92 - legW, -depth / 2 - 1, legW, depth + 2)
  ctxRef.restore()
}

function drawStreetLamp (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  const lat = coord.lat
  const haloR = Math.max(14, metersToPixels(4, lat))

  ctxRef.save()
  const grad = ctxRef.createRadialGradient(p.x, p.y, 1, p.x, p.y, haloR)
  grad.addColorStop(0, 'rgba(255,236,160,0.45)')
  grad.addColorStop(1, 'rgba(255,236,160,0)')
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, haloR, 0, Math.PI * 2)
  ctxRef.fillStyle = grad
  ctxRef.fill()

  // Mât
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, 3.2, 0, Math.PI * 2)
  ctxRef.fillStyle = '#2f3338'
  ctxRef.fill()
  ctxRef.lineWidth = 1.2
  ctxRef.strokeStyle = '#ffffff'
  ctxRef.stroke()

  // Lampe
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, 1.4, 0, Math.PI * 2)
  ctxRef.fillStyle = '#ffe58a'
  ctxRef.fill()
  ctxRef.restore()
}

function drawBikeRack (e: MapElement): void {
  const pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  const [P1, P2] = pts
  if ((P1 == null) || (P2 == null)) return
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const len = Math.hypot(P2.x - P1.x, P2.y - P1.y)
  if (len < 4) return
  const angle = Math.atan2(P2.y - P1.y, P2.x - P1.x)
  const spacing = Math.max(5, metersToPixels(0.8, lat))
  const hoopLen = Math.max(6, metersToPixels(0.8, lat))
  const hoopW = Math.max(2, metersToPixels(0.12, lat))

  ctxRef.save()
  ctxRef.translate(P1.x, P1.y)
  ctxRef.rotate(angle)
  ctxRef.lineCap = 'round'

  const count = Math.max(1, Math.floor(len / spacing))
  const startX = (len - (count - 1) * spacing) / 2
  for (let i = 0; i < count; i++) {
    const x = startX + i * spacing
    // Ombre
    ctxRef.strokeStyle = 'rgba(0,0,0,0.25)'
    ctxRef.lineWidth = hoopW
    ctxRef.beginPath()
    ctxRef.moveTo(x + 1, -hoopLen / 2 + 1)
    ctxRef.lineTo(x + 1, hoopLen / 2 + 1)
    ctxRef.stroke()
    // Arceau
    ctxRef.strokeStyle = '#c4c9ce'
    ctxRef.lineWidth = hoopW
    ctxRef.beginPath()
    ctxRef.moveTo(x, -hoopLen / 2)
    ctxRef.lineTo(x, hoopLen / 2)
    ctxRef.stroke()
  }
  ctxRef.restore()
}

function drawFountain (e: MapElement): void {
  const coord = e.coords[0]
  if (coord == null) return
  const p = cp(coord)
  const lat = coord.lat
  const r = Math.max(7, metersToPixels(e.radius ?? 1.5, lat))

  ctxRef.save()
  // Ombre
  ctxRef.beginPath()
  ctxRef.arc(p.x + r * 0.12, p.y + r * 0.15, r, 0, Math.PI * 2)
  ctxRef.fillStyle = 'rgba(0,0,0,0.25)'
  ctxRef.fill()

  // Margelle
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r, 0, Math.PI * 2)
  ctxRef.fillStyle = '#cfcabd'
  ctxRef.fill()
  ctxRef.lineWidth = 1.5
  ctxRef.strokeStyle = '#8f887a'
  ctxRef.stroke()

  // Eau
  const grad = ctxRef.createRadialGradient(p.x - r * 0.2, p.y - r * 0.2, r * 0.1, p.x, p.y, r * 0.82)
  grad.addColorStop(0, '#9fd4f5')
  grad.addColorStop(1, '#3f86bb')
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, r * 0.82, 0, Math.PI * 2)
  ctxRef.fillStyle = grad
  ctxRef.fill()

  // Ondes
  ctxRef.strokeStyle = 'rgba(255,255,255,0.45)'
  ctxRef.lineWidth = 1
  ;[0.62, 0.42].forEach((k) => {
    ctxRef.beginPath()
    ctxRef.arc(p.x, p.y, r * k, 0, Math.PI * 2)
    ctxRef.stroke()
  })

  // Jet central
  ctxRef.beginPath()
  ctxRef.arc(p.x, p.y, Math.max(2, r * 0.16), 0, Math.PI * 2)
  ctxRef.fillStyle = '#ffffff'
  ctxRef.fill()
  ctxRef.strokeStyle = '#8f887a'
  ctxRef.lineWidth = 1
  ctxRef.stroke()
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Lignes de marquage : continue / discontinue                        */
/* ------------------------------------------------------------------ */

function drawSolidLine (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(1.5, metersToPixels(e.width ?? 0.15, lat))

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = 'butt'
  ctxRef.setLineDash([])
  pathFromPoints(pts)
  ctxRef.strokeStyle = e.color ?? '#ffffff'
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.restore()
}

function drawDashedLine (e: MapElement): void {
  let pts: Pt[] = e.coords.map(cp)
  if (pts.length < 2) return
  pts = smoothIfNeeded(e, pts, false)
  const coord = e.coords[0]
  if (coord == null) return
  const lat = coord.lat
  const widthPx = Math.max(1.5, metersToPixels(e.width ?? 0.15, lat))
  const dashPx = Math.max(2, metersToPixels(e.dashLength ?? 3, lat))
  const gapPx = Math.max(2, metersToPixels(e.dashGap ?? 3.5, lat))

  ctxRef.save()
  ctxRef.lineJoin = 'round'
  ctxRef.lineCap = 'butt'
  ctxRef.setLineDash([dashPx, gapPx])
  pathFromPoints(pts)
  ctxRef.strokeStyle = e.color ?? '#ffffff'
  ctxRef.lineWidth = widthPx
  ctxRef.stroke()
  ctxRef.setLineDash([])
  ctxRef.restore()
}

/* ------------------------------------------------------------------ */
/* Aperçu du tracé en cours                                           */
/* ------------------------------------------------------------------ */

const SMOOTHABLE_TYPES: readonly string[] = ['route', 'piste_cyclable', 'chemin_pieton', 'stationnement', 'rails_tramway', 'voie_bus', 'ligne_continue', 'ligne_discontinue']

function drawPreview (): void {
  if (drawingPointsRef.length === 0) return
  const pts: Pt[] = drawingPointsRef.map(cp)
  const cfg: ToolConfigEntry | undefined = currentToolRef != null ? toolConfig[currentToolRef] : undefined
  const showMouseSegment = !(mousePos == null) && !(cfg == null) && cfg.mode !== 'point' && cfg.mode !== 'edit'
  const previewPts = pts.slice()
  if (showMouseSegment && (mousePos != null)) {
    previewPts.push(cp(mousePos))
  }
  ctxRef.save()

  const targetType = currentToolRef === 'branch' ? 'route' : currentToolRef
  const smoothCheckbox = byId?.('set-smooth-curves')
  if (
    targetType !== null &&
    SMOOTHABLE_TYPES.includes(targetType) &&
    smoothCheckbox?.checked === true &&
    previewPts.length > 2
  ) {
    const smoothPts = catmullRomSpline(previewPts, 12, false)
    ctxRef.strokeStyle = 'rgba(255,213,74,0.55)'
    ctxRef.lineWidth = 2
    ctxRef.setLineDash([])
    pathFromPoints(smoothPts)
    ctxRef.stroke()
  }

  ctxRef.strokeStyle = '#ffd54a'
  ctxRef.fillStyle = '#ffd54a'
  ctxRef.lineWidth = 2
  ctxRef.setLineDash([6, 4])
  ctxRef.beginPath()
  const ptFirst = pts[0]
  if (ptFirst == null) return
  ctxRef.moveTo(ptFirst.x, ptFirst.y)
  for (let i = 1; i < pts.length; i++) {
    const pt = pts[i]
    if (pt == null) continue
    ctxRef.lineTo(pt.x, pt.y)
  }
  if (showMouseSegment && (mousePos != null)) {
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

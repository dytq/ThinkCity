<template>
  <div class="up-root" ref="root">
    <aside id="sidebar">
      <div class="sb-section">
        <h2>Équipements & Marquages</h2>
        <div class="tool-grid" id="tool-grid">
          <button class="tool-btn" data-tool="route"><span class="ico">🛣️</span>Route</button>
          <button class="tool-btn" data-tool="piste_cyclable"><span class="ico">🚴</span>Piste cycl.</button>
          <button class="tool-btn" data-tool="chemin_pieton"><span class="ico">🧱</span>Chemin piéton</button>
          <button class="tool-btn" data-tool="rond_point"><span class="ico">⭕</span>Rond-point</button>
          <button class="tool-btn" data-tool="hachures"><span class="ico">📐</span>Zébras / Hachures</button>
          <button class="tool-btn" data-tool="passage_pieton"><span class="ico">🚸</span>Pass. piéton</button>
          <button class="tool-btn" data-tool="cedez_le_passage"><span class="ico">🔻</span>Cédez-le-passage</button>
          <button class="tool-btn" data-tool="ligne_stop"><span class="ico">🛑</span>Ligne de stop</button>
          <button class="tool-btn" data-tool="stop_sol"><span class="ico">🅢</span>STOP au sol</button>
          <button class="tool-btn" data-tool="fleche_sol"><span class="ico">⬆️</span>Flèche directionnelle</button>
          <button class="tool-btn" data-tool="bande_cyclable"><span class="ico">🚲</span>Bande cyclable</button>
          <button class="tool-btn" data-tool="chevron_velo"><span class="ico">˄˄</span>Chevrons vélo</button>
          <button class="tool-btn" data-tool="rue_cyclable"><span class="ico">Ⓑ</span>Rue cyclable</button>
          <button class="tool-btn" data-tool="feu_tricolore"><span class="ico">🚦</span>Feu tricolore</button>
          <button class="tool-btn" data-tool="stationnement"><span class="ico">🅿️</span>Stationnement</button>
          <button class="tool-btn" data-tool="espace_vert"><span class="ico">🌿</span>Espace vert</button>
          <button class="tool-btn" data-tool="massif"><span class="ico">🌳</span>Massif</button>
          <button class="tool-btn" data-tool="arbre"><span class="ico">🌲</span>Arbre isolé</button>
          <button class="tool-btn edit-btn" data-tool="edit"><span class="ico">✏️</span>Éditer le tracé</button>
          <button class="tool-btn branch-btn" data-tool="branch"><span class="ico">🔀</span>Ajouter une branche</button>
          <button class="tool-btn delete-btn" data-tool="delete"><span class="ico">🗑️</span>Supprimer un élément</button>
        </div>
        <div class="action-row">
          <button class="action-btn validate" id="btn-validate">✔ Valider (Entrée)</button>
          <button class="action-btn cancel" id="btn-cancel">✕ Annuler (Échap)</button>
        </div>
      </div>
      <div class="sb-section">
        <h2>Paramètres</h2>
        <div class="setting-row" id="edit-z-row" style="display:none; background:rgba(255,157,61,0.1); padding:4px 6px; border-radius:6px; border:1px solid var(--accent-dim);">
          <label style="color:var(--accent); font-weight:600;">Ordre Z (Élément sélectionné)</label>
          <input type="number" id="set-selected-z" value="0" step="1">
        </div>
        <div class="setting-row" style="background:rgba(59,163,255,0.08); padding:4px 6px; border-radius:6px; border:1px solid #325266;">
          <label style="color:#3ba3ff;">Lissage des tracés (courbes de Bézier)</label>
          <input type="checkbox" id="set-smooth-curves" style="width:17px;height:17px;cursor:pointer;">
        </div>
        <div class="setting-row"><label>Largeur route (m)</label><input type="number" id="set-route-width" value="6" min="2" max="20" step="0.5"></div>
        <div class="setting-row"><label>Nombre de voies</label><input type="number" id="set-route-lanes" value="2" min="1" max="6" step="1"></div>
        <div class="setting-row"><label>Sens de circulation</label>
          <select id="set-route-direction">
            <option value="bidirectional">Bidirectionnelle</option>
            <option value="unidirectional">Sens unique</option>
          </select>
        </div>
        <div class="setting-row"><label>Terminaison route</label>
          <select id="set-route-linecap">
            <option value="round">Ronde</option>
            <option value="butt">Carrée (nette)</option>
            <option value="square">Carrée (dépassante)</option>
          </select>
        </div>
        <div class="setting-row"><label>Rayon rond-point (m)</label><input type="number" id="set-roundabout-radius" value="12" min="5" max="40" step="1"></div>
        <div class="setting-row"><label>Voies du rond-point</label><input type="number" id="set-roundabout-lanes" value="2" min="1" max="4" step="1"></div>
        <div class="setting-row"><label>Largeur zébras (m)</label><input type="number" id="set-hatch-width" value="1.5" min="0.5" max="4" step="0.25"></div>
        <div class="setting-row"><label>Forme zébras</label>
          <select id="set-hatch-style">
            <option value="straight">Angles droits (Net)</option>
            <option value="smooth">Arrondis</option>
          </select>
        </div>
        <div class="setting-row"><label>Largeur piste cyclable (m)</label><input type="number" id="set-cycle-width" value="2" min="1" max="6" step="0.5"></div>
        <div class="setting-row"><label>Couleur piste cyclable</label><input type="color" id="set-cycle-color" value="#3c8a3c"></div>
        <div class="setting-row"><label>Sens piste cyclable</label>
          <select id="set-cycle-direction">
            <option value="unidirectional">Unidirectionnelle</option>
            <option value="bidirectional">Bidirectionnelle</option>
          </select>
        </div>
        <div class="setting-row"><label>Largeur chemin piéton (m)</label><input type="number" id="set-ped-width" value="2.5" min="1" max="8" step="0.5"></div>

        <div class="setting-row"><label>Type stationnement</label>
          <select id="set-park-layout">
            <option value="bataille">Bataille (90°)</option>
            <option value="epi">Épi (45°)</option>
            <option value="creneau">Créneau (Parallèle)</option>
          </select>
        </div>
        <div class="setting-row"><label>Profondeur place (m)</label><input type="number" id="set-park-depth" value="5" min="1.5" max="8" step="0.5"></div>
        <div class="setting-row"><label>Largeur place (m)</label><input type="number" id="set-park-bay" value="2.5" min="1.5" max="5" step="0.1"></div>

        <div class="setting-row"><label>Largeur passage piéton (m)</label><input type="number" id="set-cross-span" value="3.5" min="2" max="10" step="0.5"></div>
        <div class="setting-row"><label>Largeur bandes piéton (m)</label><input type="number" id="set-cross-stripe" value="0.5" min="0.3" max="1" step="0.1"></div>
        <div class="setting-row"><label>Type de flèche au sol</label>
          <select id="set-arrow-type">
            <option value="tout_droit">Tout droit</option>
            <option value="gauche">Tourne à gauche</option>
            <option value="droite">Tourne à droite</option>
            <option value="tout_droit_gauche">Tout droit + gauche</option>
            <option value="tout_droit_droite">Tout droit + droite</option>
          </select>
        </div>
        <div class="setting-row"><label>Rayon houppier arbre (m)</label><input type="number" id="set-tree-radius" value="2.2" min="1" max="8" step="0.2"></div>
      </div>

      <div class="sb-section">
        <h2>Légende</h2>
        <div class="legend">
          <div class="legend-item"><span class="swatch" style="background:#2c2c2c;"></span>Route / Voies</div>
          <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:1px dashed #fff;"></span>Rond-point</div>
          <div class="legend-item"><span class="swatch" style="background:repeating-linear-gradient(45deg,#2c2c2c,#2c2c2c 4px,#fff 4px,#fff 8px);"></span>Zébras / Hachures</div>
          <div class="legend-item"><span class="swatch" style="background:#3c8a3c;"></span>Piste cyclable</div>
          <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:2px solid #3c8a3c;"></span>Bande / rue cyclable / chevrons</div>
          <div class="legend-item"><span class="swatch" style="background:#b9b2a3;"></span>Chemin piéton</div>
          <div class="legend-item"><span class="swatch" style="background:#ffffff;"></span>Passage piéton / Cédez-le-passage</div>
          <div class="legend-item"><span class="swatch" style="background:#e14b4b;"></span>Feu tricolore</div>
          <div class="legend-item"><span class="swatch" style="background:#4a7c3a;"></span>Espace vert / Arbre</div>
        </div>
        <button class="clear-all" id="btn-clear-all">🗑️ Effacer tout le projet</button>
      </div>

      <div id="status-bar">Sélectionnez un équipement ou un marquage dans la liste pour commencer.</div>
    </aside>

    <div id="map-wrap">
      <div id="map" ref="mapEl"></div>
    </div>
  </div>
</template>

<script setup>
import { ref, onMounted, onBeforeUnmount } from 'vue'
import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* Fond de carte. NB : les tuiles Google ne sont pas autorisées hors API officielle.
   Pour un projet en production, préférez par ex. Esri World Imagery ou l'IGN (Géoplateforme). */
const TILE_URL = 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
const TILE_OPTS = { maxZoom: 21, maxNativeZoom: 21, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Imagerie &copy; Google' }

const root = ref(null)
const mapEl = ref(null)

/* Objets non réactifs (Leaflet / Canvas ne doivent pas être proxifiés par Vue) */
let map = null
let overlay = null
let ctx = null
let asphaltPattern, grassPattern, bushPattern, pavementPattern

/* ============================================================
   DONNÉES & ÉTAT
   ============================================================ */
let elements = []
let idCounter = 1
let currentTool = null
let drawingPoints = []
let mousePos = null
let selectedElementForEdit = null
let draggedVertexIndex = null
let branchSourceNode = null

const toolConfig = {
  route:           {label:'Route',            mode:'line',    minPoints:2},
  piste_cyclable:  {label:'Piste cycl.',      mode:'line',    minPoints:2},
  chemin_pieton:   {label:'Chemin piéton',    mode:'line',    minPoints:2},
  rond_point:      {label:'Rond-point',       mode:'point',   minPoints:1},
  hachures:        {label:'Zébras / Hachures',mode:'polygon', minPoints:3},
  stationnement:   {label:'Stationnement',    mode:'line',    minPoints:2},
  espace_vert:     {label:'Espace vert',      mode:'polygon', minPoints:3},
  massif:          {label:'Massif',           mode:'polygon', minPoints:3},
  passage_pieton:  {label:'Pass. piéton',     mode:'twopoint',minPoints:2},
  cedez_le_passage:{label:'Cédez-le-passage', mode:'twopoint',minPoints:2},
  ligne_stop:      {label:'Ligne de stop',    mode:'twopoint',minPoints:2},
  stop_sol:        {label:'STOP au sol',      mode:'twopoint',minPoints:2},
  fleche_sol:      {label:'Flèche au sol',    mode:'twopoint',minPoints:2},
  bande_cyclable:  {label:'Bande cyclable',   mode:'line',    minPoints:2},
  chevron_velo:    {label:'Chevron vélo',     mode:'twopoint',minPoints:2},
  rue_cyclable:    {label:'Rue cyclable',     mode:'line',    minPoints:2},
  feu_tricolore:   {label:'Feu tricolore',    mode:'point',   minPoints:1},
  arbre:           {label:'Arbre isolé',      mode:'point',   minPoints:1},
  edit:            {label:'Éditer',           mode:'edit',    minPoints:0},
  branch:          {label:'Branche',          mode:'branch',  minPoints:1}
}

const instructions = {
  route:          'Cliquez pour placer les points de la route. Validez avec Entrée (ou double-clic).',
  piste_cyclable: 'Cliquez pour tracer la piste cyclable. Validez avec Entrée.',
  chemin_pieton:  'Cliquez pour tracer le chemin piéton (dallage). Validez avec Entrée.',
  rond_point:     'Cliquez sur la carte pour placer le centre du rond-point.',
  hachures:       'Cliquez pour tracer les contours de la zone de zébras (3 points min). Validez avec Entrée.',
  stationnement:  'Cliquez le long de la voie où placer les places de stationnement. Validez avec Entrée.',
  espace_vert:    'Cliquez pour dessiner le contour de la zone végétalisée (3 points min). Validez avec Entrée.',
  massif:         'Cliquez pour dessiner le contour du massif arbustif. Validez avec Entrée.',
  passage_pieton: 'Cliquez le point de départ puis le point d\'arrivée du passage piéton (2 clics).',
  cedez_le_passage:'Cliquez les deux extrémités de la ligne de cédez-le-passage (2 clics).',
  ligne_stop:     'Cliquez les deux extrémités de la ligne de stop continue (2 clics).',
  stop_sol:       'Cliquez le point de départ puis un point indiquant le sens de circulation (2 clics).',
  fleche_sol:     'Cliquez le point de départ (arrière de la flèche) puis un point indiquant le sens de circulation (2 clics).',
  bande_cyclable: 'Cliquez pour tracer la bande cyclable peinte sur chaussée. Validez avec Entrée.',
  chevron_velo:   'Cliquez le point de départ puis un point indiquant le sens de circulation (2 clics).',
  rue_cyclable:   'Cliquez pour tracer l\'axe de la rue cyclable (pictogrammes répétés). Validez avec Entrée.',
  feu_tricolore:  'Cliquez sur le bord de la route pour positionner le feu tricolore.',
  arbre:          'Cliquez sur la carte pour planter un arbre.',
  edit:           'Cliquez sur un élément pour afficher ses points de contrôle et ajuster sa géométrie et sa valeur Z.',
  branch:         'Survolez et cliquez sur un nœud d\'un chemin existant pour y démarrer une nouvelle branche.',
  delete:         'Cliquez sur un élément existant pour le supprimer.'
}

const zOrderBase = {
  espace_vert:0, massif:1, hachures:2, chemin_pieton:3, piste_cyclable:4,
  bande_cyclable:4.5, rue_cyclable:4.6,
  route:5, rond_point:6, stationnement:7, passage_pieton:8, cedez_le_passage:9,
  ligne_stop:10, stop_sol:10.2, fleche_sol:10.4, chevron_velo:10.6,
  arbre:11, feu_tricolore:12
}

/* ============================================================
   ACCÈS AU DOM (limité au composant)
   ============================================================ */
function byId(id){ return root.value.querySelector('#' + id) }

/* ============================================================
   TEXTURES
   ============================================================ */
function makeTile(size, drawFn){
  const c = document.createElement('canvas')
  c.width = size; c.height = size
  drawFn(c.getContext('2d'), size)
  return c
}
function seededRandom(seed){
  let s = seed
  return function(){ s = (s*9301+49297)%233280; return s/233280 }
}
function buildPatterns(){
  const asphaltTile = makeTile(12, (t,s)=>{
    t.fillStyle = '#2c2c2c'; t.fillRect(0,0,s,s)
    const r = seededRandom(7)
    for(let i=0;i<20;i++){
      const g = 55 + r()*70
      t.fillStyle = `rgba(${g},${g},${g},0.55)`
      t.fillRect(r()*s, r()*s, 1, 1)
    }
  })
  const grassTile = makeTile(16, (t,s)=>{
    t.fillStyle = '#4a7c3a'; t.fillRect(0,0,s,s)
    const r = seededRandom(3)
    for(let i=0;i<16;i++){
      t.strokeStyle = r()>0.5 ? 'rgba(110,170,80,0.6)' : 'rgba(45,90,40,0.6)'
      t.lineWidth = 1
      const x=r()*s, y=r()*s
      t.beginPath(); t.moveTo(x,y); t.lineTo(x+(r()*4-2), y-4); t.stroke()
    }
  })
  const bushTile = makeTile(14, (t,s)=>{
    t.fillStyle = '#2f5d34'; t.fillRect(0,0,s,s)
    const r = seededRandom(11)
    for(let i=0;i<14;i++){
      t.fillStyle = `rgba(${40+r()*40},${95+r()*45},${45+r()*25},0.65)`
      t.beginPath(); t.arc(r()*s, r()*s, 1.2+r()*1.6, 0, Math.PI*2); t.fill()
    }
  })
  const pavementTile = makeTile(20, (t,s)=>{
    t.fillStyle = '#b9b2a3'; t.fillRect(0,0,s,s)
    t.strokeStyle = '#8f887a'; t.lineWidth = 1.4
    t.strokeRect(0.5,0.5,s-1,s-1)
    t.fillStyle = 'rgba(255,255,255,0.10)'
    t.fillRect(1,1,s/2-1,s/2-1)
    t.fillStyle = 'rgba(0,0,0,0.06)'
    t.fillRect(s/2,s/2,s/2-1,s/2-1)
  })
  asphaltPattern  = ctx.createPattern(asphaltTile,'repeat')
  grassPattern    = ctx.createPattern(grassTile,'repeat')
  bushPattern     = ctx.createPattern(bushTile,'repeat')
  pavementPattern = ctx.createPattern(pavementTile,'repeat')
}

/* ============================================================
   OUTILS GÉOMÉTRIQUES
   ============================================================ */
function cp(p){ return map.latLngToContainerPoint(L.latLng(p.lat, p.lng)) }
function dist(a,b){ return Math.hypot(a.x-b.x, a.y-b.y) }
function metersToPixels(m, lat){
  const zoom = map.getZoom()
  const mpp = 156543.03392 * Math.cos(lat*Math.PI/180) / Math.pow(2, zoom)
  return m / mpp
}
function pathFromPoints(pts){
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y)
}
/* Spline de Catmull-Rom (équivalente à des Bézier cubiques bout à bout) */
function catmullRomSpline(pts, segmentsPerPiece, closed){
  const n = pts.length
  if(n < 3) return pts.slice()
  const at = (i)=>{
    if(closed) return pts[(i + n) % n]
    return pts[Math.max(0, Math.min(n - 1, i))]
  }
  const out = []
  const last = closed ? n : n - 1
  for(let i = 0; i < last; i++){
    const p0 = at(i - 1), p1 = at(i), p2 = at(i + 1), p3 = at(i + 2)
    for(let s = 0; s < segmentsPerPiece; s++){
      const t = s / segmentsPerPiece
      const t2 = t*t, t3 = t2*t
      const x = 0.5*((2*p1.x) + (-p0.x+p2.x)*t + (2*p0.x-5*p1.x+4*p2.x-p3.x)*t2 + (-p0.x+3*p1.x-3*p2.x+p3.x)*t3)
      const y = 0.5*((2*p1.y) + (-p0.y+p2.y)*t + (2*p0.y-5*p1.y+4*p2.y-p3.y)*t2 + (-p0.y+3*p1.y-3*p2.y+p3.y)*t3)
      out.push({x, y})
    }
  }
  out.push(closed ? at(0) : pts[n-1])
  return out
}
function smoothIfNeeded(e, pts, closed){
  if(e.smooth && pts.length > 2) return catmullRomSpline(pts, 12, !!closed)
  return pts
}
function walkPath(pts, step, cb){
  let d = 0, next = step/2
  for(let i=0;i<pts.length-1;i++){
    const a = pts[i], b = pts[i+1]
    const segLen = Math.hypot(b.x-a.x, b.y-a.y)
    while(next <= d+segLen){
      const t = (next-d)/segLen
      const x = a.x+(b.x-a.x)*t, y = a.y+(b.y-a.y)*t
      cb({x,y}, Math.atan2(b.y-a.y, b.x-a.x))
      next += step
    }
    d += segLen
  }
}
function distToSegment(p,a,b){
  const l2 = (b.x-a.x)**2+(b.y-a.y)**2
  if(l2===0) return dist(p,a)
  let t = ((p.x-a.x)*(b.x-a.x)+(p.y-a.y)*(b.y-a.y))/l2
  t = Math.max(0, Math.min(1,t))
  return dist(p, {x:a.x+t*(b.x-a.x), y:a.y+t*(b.y-a.y)})
}
function minDistToSegments(pts, p, closed){
  let m = Infinity
  const n = pts.length - (closed?0:1)
  for(let i=0;i<n;i++) m = Math.min(m, distToSegment(p, pts[i], pts[(i+1)%pts.length]))
  return m
}
function offsetPolyline(pts, offset){
  const n = pts.length
  const out = []
  for(let i=0;i<n;i++){
    let dx=0, dy=0
    if(i>0){ dx += pts[i].x-pts[i-1].x; dy += pts[i].y-pts[i-1].y }
    if(i<n-1){ dx += pts[i+1].x-pts[i].x; dy += pts[i+1].y-pts[i].y }
    const len = Math.hypot(dx,dy) || 1
    const nx = -dy/len, ny = dx/len
    out.push({x: pts[i].x + nx*offset, y: pts[i].y + ny*offset})
  }
  return out
}
function pointInPolygon(p, pts){
  let inside = false
  for(let i=0, j=pts.length-1; i<pts.length; j=i++){
    const xi=pts[i].x, yi=pts[i].y, xj=pts[j].x, yj=pts[j].y
    const intersect = ((yi>p.y)!==(yj>p.y)) && (p.x < (xj-xi)*(p.y-yi)/(yj-yi)+xi)
    if(intersect) inside = !inside
  }
  return inside
}
function offsetLatLng(base, dxMeters, dyMeters){
  const R = 6378137
  const dLat = (dyMeters / R) * (180/Math.PI)
  const dLng = (dxMeters / (R*Math.cos(base.lat*Math.PI/180))) * (180/Math.PI)
  return {lat: base.lat + dLat, lng: base.lng + dLng}
}
function circleLatLng(center, radiusMeters, segments){
  const coords = []
  for(let i=0; i<=segments; i++){
    const a = (i/segments) * Math.PI * 2
    coords.push(offsetLatLng(center, radiusMeters*Math.cos(a), radiusMeters*Math.sin(a)))
  }
  return coords
}
function makeSquareIsland(center, dirDeg, distance, size){
  const rad = dirDeg*Math.PI/180
  const ux = Math.cos(rad), uy = Math.sin(rad)
  const px = -uy, py = ux
  const islandCenter = offsetLatLng(center, ux*distance, uy*distance)
  const half = size/2
  return [
    offsetLatLng(islandCenter, -ux*half - px*half, -uy*half - py*half),
    offsetLatLng(islandCenter,  ux*half - px*half,  uy*half - py*half),
    offsetLatLng(islandCenter,  ux*half + px*half,  uy*half + py*half),
    offsetLatLng(islandCenter, -ux*half + px*half, -uy*half + py*half)
  ]
}
function makeCrossing(center, dirDeg, distance, span){
  const rad = dirDeg*Math.PI/180
  const ux = Math.cos(rad), uy = Math.sin(rad)
  const px = -uy, py = ux
  const c = offsetLatLng(center, ux*distance, uy*distance)
  return [
    offsetLatLng(c,  px*span/2,  py*span/2),
    offsetLatLng(c, -px*span/2, -py*span/2)
  ]
}

/* ============================================================
   RENDU
   ============================================================ */
function resizeOverlay(){
  if(!map || !overlay) return
  const size = map.getSize()
  overlay.width = size.x
  overlay.height = size.y
  draw()
}

function draw(){
  if(!overlay || !overlay.width) return
  ctx.clearRect(0,0,overlay.width, overlay.height)
  const sorted = [...elements].sort((a,b)=>{
    const za = (a.z !== undefined) ? a.z : zOrderBase[a.type]
    const zb = (b.z !== undefined) ? b.z : zOrderBase[b.type]
    return za - zb
  })
  sorted.forEach(e=>{
    switch(e.type){
      case 'espace_vert':    drawGreenSpace(e); break
      case 'massif':         drawBushMass(e); break
      case 'hachures':       drawHatchZone(e); break
      case 'chemin_pieton':  drawPedestrianPath(e); break
      case 'piste_cyclable': drawCyclePath(e); break
      case 'bande_cyclable': drawPaintedCycleLane(e); break
      case 'rue_cyclable':   drawCycleStreet(e); break
      case 'route':          drawRoad(e); break
      case 'rond_point':     drawRoundabout(e); break
      case 'stationnement':  drawParking(e); break
      case 'passage_pieton': drawCrossing(e); break
      case 'cedez_le_passage': drawYieldLine(e); break
      case 'ligne_stop':     drawStopLine(e); break
      case 'stop_sol':       drawGroundStop(e); break
      case 'fleche_sol':     drawGroundArrow(e); break
      case 'chevron_velo':   drawSharrow(e); break
      case 'arbre':          drawTree(e); break
      case 'feu_tricolore':  drawTrafficLight(e); break
    }
  })
  drawEditHandles()
  drawBranchNodesOverlay()
  drawPreview()
}

function drawEditHandles(){
  if(!selectedElementForEdit) return
  ctx.save()
  ctx.fillStyle = '#ff9d3d'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  selectedElementForEdit.coords.forEach((coord)=>{
    const p = cp(coord)
    ctx.beginPath()
    ctx.arc(p.x, p.y, 6, 0, Math.PI*2)
    ctx.fill()
    ctx.stroke()
  })
  ctx.restore()
}

function drawBranchNodesOverlay(){
  if(currentTool !== 'branch') return
  ctx.save()
  ctx.fillStyle = '#3cb371'
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = 2
  elements.forEach(e=>{
    if(['route', 'piste_cyclable', 'chemin_pieton'].includes(e.type)){
      e.coords.forEach(coord=>{
        const p = cp(coord)
        ctx.beginPath()
        ctx.arc(p.x, p.y, 5, 0, Math.PI*2)
        ctx.fill()
        ctx.stroke()
      })
    }
  })
  ctx.restore()
}

function drawRoad(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const lanes = Math.max(1, Math.round(e.lanes||2))
  const bidirectional = (e.direction !== 'unidirectional')
  const widthPx = Math.max(4, metersToPixels(e.width||6, lat))
  const lineCapStyle = e.lineCap || 'round'

  ctx.save()
  ctx.lineJoin='round'
  ctx.lineCap = lineCapStyle

  pathFromPoints(pts)
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = widthPx
  ctx.stroke()

  pathFromPoints(pts)
  ctx.globalAlpha = 0.55
  ctx.strokeStyle = asphaltPattern
  ctx.lineWidth = widthPx
  ctx.stroke()
  ctx.globalAlpha = 1

  const dividerFracs = []
  for(let i=1;i<lanes;i++) dividerFracs.push(-0.5 + i/lanes)

  let centerIdx = -1
  if(bidirectional && dividerFracs.length>0){
    centerIdx = dividerFracs.reduce((best,val,idx)=>
      Math.abs(val) < Math.abs(dividerFracs[best]) ? idx : best, 0)
  }

  dividerFracs.forEach((frac, idx)=>{
    const offsetPts = offsetPolyline(pts, frac*widthPx)
    ctx.beginPath()
    ctx.moveTo(offsetPts[0].x, offsetPts[0].y)
    for(let k=1;k<offsetPts.length;k++) ctx.lineTo(offsetPts[k].x, offsetPts[k].y)
    if(idx === centerIdx){
      ctx.setLineDash([])
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = Math.max(1.6, widthPx*0.045)
      ctx.stroke()
    } else {
      ctx.setLineDash([metersToPixels(3,lat), metersToPixels(3,lat)])
      ctx.strokeStyle = '#ffffff'
      ctx.lineWidth = Math.max(1.2, widthPx*0.03)
      ctx.stroke()
      ctx.setLineDash([])
    }
  })

  if(!bidirectional){
    drawRoadArrows(pts, widthPx, lanes, lat)
  }
  ctx.restore()
}

function drawRoadArrows(pts, widthPx, lanes, lat){
  const step = metersToPixels(22, lat)
  if(step < 12) return
  for(let l=0;l<lanes;l++){
    const frac = -0.5 + (l+0.5)/lanes
    const offsetPts = offsetPolyline(pts, frac*widthPx)
    walkPath(offsetPts, step, (p, angle)=>{
      drawArrowIcon(p, angle, Math.max(6, widthPx*0.16))
    })
  }
}

function drawArrowIcon(p, angle, size){
  ctx.save()
  ctx.translate(p.x, p.y)
  ctx.rotate(angle)
  ctx.strokeStyle = 'rgba(255,255,255,0.9)'
  ctx.fillStyle = 'rgba(255,255,255,0.9)'
  ctx.lineWidth = Math.max(1, size*0.18)
  ctx.beginPath()
  ctx.moveTo(-size, 0)
  ctx.lineTo(size*0.35, 0)
  ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(size, 0)
  ctx.lineTo(size*0.2, -size*0.5)
  ctx.lineTo(size*0.2, size*0.5)
  ctx.closePath()
  ctx.fill()
  ctx.restore()
}

function drawRoundabout(e){
  const p = cp(e.coords[0])
  const lat = e.coords[0].lat
  const r = Math.max(10, metersToPixels(e.radius||12, lat))
  const lanes = Math.max(1, Math.round(e.lanes||2))
  const ringWidth = r * (0.3 + lanes * 0.1)

  ctx.save()
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI*2)
  ctx.strokeStyle = '#c9c9c9'
  ctx.lineWidth = 4
  ctx.stroke()

  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI*2)
  ctx.arc(p.x, p.y, r - ringWidth, 0, Math.PI*2, true)
  ctx.fillStyle = asphaltPattern
  ctx.fill()
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 2
  ctx.stroke()

  for(let i=1; i<lanes; i++){
    const laneRadius = r - (ringWidth * (i / lanes))
    ctx.beginPath()
    ctx.arc(p.x, p.y, laneRadius, 0, Math.PI*2)
    ctx.setLineDash([metersToPixels(2, lat), metersToPixels(2, lat)])
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(1.2, r*0.025)
    ctx.stroke()
    ctx.setLineDash([])
  }

  ctx.beginPath()
  ctx.arc(p.x, p.y, r - ringWidth - 2, 0, Math.PI*2)
  ctx.fillStyle = grassPattern
  ctx.fill()
  ctx.strokeStyle = '#345c28'
  ctx.lineWidth = 2
  ctx.stroke()

  for(let l=0; l<lanes; l++){
    const laneMiddleRadius = r - ringWidth * ((l + 0.5) / lanes)
    for(let i=0; i<3; i++){
      const angle = (i * Math.PI * 2 / 3) - Math.PI/2 + (l * 0.2)
      const ax = p.x + laneMiddleRadius * Math.cos(angle)
      const ay = p.y + laneMiddleRadius * Math.sin(angle)
      drawArrowIcon({x:ax, y:ay}, angle - Math.PI/2, Math.max(4, r*0.08))
    }
  }
  ctx.restore()
}

function drawHatchZone(e){
  const pts = e.coords.map(cp)
  if(pts.length<3) return
  const lat = e.coords[0].lat
  const hatchSpacing = Math.max(8, metersToPixels(e.hatchWidth||1.5, lat))
  const cornerStyle = e.cornerStyle || 'straight'

  ctx.save()

  if(cornerStyle === 'smooth'){
    drawSmoothPolygon(pts)
  } else {
    ctx.beginPath()
    ctx.moveTo(pts[0].x, pts[0].y)
    for(let i=1; i<pts.length; i++){
      ctx.lineTo(pts[i].x, pts[i].y)
    }
    ctx.closePath()
  }

  ctx.fillStyle = asphaltPattern
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#ffffff'
  ctx.stroke()

  ctx.clip()
  let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity
  pts.forEach(p=>{
    if(p.x < minX) minX = p.x
    if(p.x > maxX) maxX = p.x
    if(p.y < minY) minY = p.y
    if(p.y > maxY) maxY = p.y
  })

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, hatchSpacing * 0.4)
  const diag = Math.hypot(maxX - minX, maxY - minY) * 1.5
  for(let offset = -diag; offset < diag; offset += hatchSpacing){
    ctx.beginPath()
    ctx.moveTo(minX + offset, minY - diag)
    ctx.lineTo(minX + offset + diag * 2, minY + diag)
    ctx.stroke()
  }
  ctx.restore()
}

function drawCyclePath(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(3, metersToPixels(e.width||2, lat))
  const bidirectional = (e.direction === 'bidirectional')
  ctx.save()
  ctx.lineJoin='round'; ctx.lineCap='round'

  pathFromPoints(pts)
  ctx.strokeStyle = e.color || '#3c8a3c'
  ctx.lineWidth = widthPx
  ctx.stroke()

  pathFromPoints(pts)
  ctx.globalAlpha = 0.4
  ctx.strokeStyle = bushPattern
  ctx.lineWidth = widthPx
  ctx.stroke()
  ctx.globalAlpha = 1

  if(bidirectional){
    pathFromPoints(pts)
    ctx.setLineDash([metersToPixels(1,lat), metersToPixels(1,lat)])
    ctx.strokeStyle = 'rgba(255,255,255,0.9)'
    ctx.lineWidth = Math.max(1, widthPx*0.08)
    ctx.stroke()
    ctx.setLineDash([])
  }
  ctx.restore()

  if(bidirectional){
    // Conduite à la française : voie de droite = "aller", voie de gauche = "retour".
    const laneRight = offsetPolyline(pts, widthPx*0.25)
    const laneLeft  = offsetPolyline(pts, -widthPx*0.25)
    drawBikePictograms(laneRight, widthPx*0.7, lat, false)
    drawBikePictograms(laneLeft, widthPx*0.7, lat, true)
  } else {
    drawBikePictograms(pts, widthPx, lat, false)
  }
}

function drawBikePictograms(pts, widthPx, lat, reversed){
  const step = metersToPixels(14, lat)
  if(step < 8) return
  walkPath(pts, step, (p, dirAngle)=>{
    const angle = reversed ? dirAngle + Math.PI : dirAngle
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(angle)
    const s = Math.max(6, widthPx*0.4)
    ctx.strokeStyle = 'rgba(255,255,255,0.92)'
    ctx.lineWidth = Math.max(1, s*0.16)
    ctx.beginPath(); ctx.arc(-s*0.55,0,s*0.32,0,Math.PI*2); ctx.stroke()
    ctx.beginPath(); ctx.arc(s*0.55,0,s*0.32,0,Math.PI*2); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-s*0.55,0); ctx.lineTo(0,-s*0.55); ctx.lineTo(s*0.55,0)
    ctx.lineTo(-0.05*s,-0.55*s)
    ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(s*1.0, -0.16*s)
    ctx.lineTo(s*1.35, 0)
    ctx.lineTo(s*1.0, 0.16*s)
    ctx.stroke()
    ctx.restore()
  })
}

function drawPaintedCycleLane(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(6, metersToPixels(e.width||1.5, lat))
  const bidirectional = (e.direction === 'bidirectional')
  ctx.save()
  ctx.lineJoin='round'; ctx.lineCap='round'

  pathFromPoints(pts)
  ctx.globalAlpha = 0.30
  ctx.strokeStyle = e.color || '#3c8a3c'
  ctx.lineWidth = widthPx
  ctx.stroke()
  ctx.globalAlpha = 1

  ;[widthPx/2, -widthPx/2].forEach(off=>{
    const edge = offsetPolyline(pts, off)
    ctx.beginPath()
    ctx.moveTo(edge[0].x, edge[0].y)
    for(let k=1;k<edge.length;k++) ctx.lineTo(edge[k].x, edge[k].y)
    ctx.strokeStyle = '#ffffff'
    ctx.lineWidth = Math.max(1.2, widthPx*0.08)
    ctx.stroke()
  })
  ctx.restore()

  if(bidirectional){
    const laneRight = offsetPolyline(pts, widthPx*0.25)
    const laneLeft  = offsetPolyline(pts, -widthPx*0.25)
    drawBikePictograms(laneRight, widthPx*0.8, lat, false)
    drawBikePictograms(laneLeft, widthPx*0.8, lat, true)
  } else {
    drawBikePictograms(pts, widthPx, lat, false)
  }
}

function drawCycleStreet(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const step = metersToPixels(18, lat)
  if(step < 10) return
  walkPath(pts, step, (p, angle)=>{
    ctx.save()
    ctx.translate(p.x, p.y)
    ctx.rotate(angle)
    const s = Math.max(9, metersToPixels(1.1, lat))
    ctx.strokeStyle = 'rgba(255,255,255,0.95)'
    ctx.lineWidth = Math.max(1.3, s*0.13)
    ctx.beginPath(); ctx.arc(0,0, s*1.4, 0, Math.PI*2); ctx.stroke()
    ctx.beginPath(); ctx.arc(-s*0.45, s*0.25, s*0.24, 0, Math.PI*2); ctx.stroke()
    ctx.beginPath(); ctx.arc(s*0.2, s*0.25, s*0.24, 0, Math.PI*2); ctx.stroke()
    ctx.beginPath()
    ctx.moveTo(-s*0.45, s*0.25); ctx.lineTo(-s*0.12,-s*0.15); ctx.lineTo(s*0.2, s*0.25)
    ctx.lineTo(-s*0.12,-s*0.15); ctx.lineTo(s*0.12,-s*0.35)
    ctx.stroke()
    ctx.restore()
  })
}

/* CORRIGÉ : cette fonction était tronquée dans le fichier d'origine
   (pts non lissé, widthPx / contexte non définis). */
function drawPedestrianPath(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const widthPx = Math.max(4, metersToPixels(e.width||2.5, lat))

  ctx.save()
  ctx.lineJoin='round'; ctx.lineCap='round'

  // Bordure
  pathFromPoints(pts)
  ctx.strokeStyle = '#8f887a'
  ctx.lineWidth = widthPx + 3
  ctx.stroke()

  // Dallage
  pathFromPoints(pts)
  ctx.strokeStyle = pavementPattern
  ctx.lineWidth = widthPx
  ctx.stroke()
  ctx.restore()
}

function drawParking(e){
  let pts = e.coords.map(cp)
  if(pts.length<2) return
  pts = smoothIfNeeded(e, pts, false)
  const lat = e.coords[0].lat
  const layout = e.layout || 'bataille'
  const bayWidth = Math.max(6, metersToPixels(e.bay||2.5, lat))
  const depthPx = Math.max(10, metersToPixels(e.depth||5, lat))

  ctx.save()
  ctx.lineCap='butt'; ctx.lineJoin='round'

  let bandThickness = depthPx
  if(layout === 'creneau') bandThickness = Math.max(8, metersToPixels(2.2, lat))

  pathFromPoints(pts)
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = bandThickness
  ctx.stroke()

  pathFromPoints(pts)
  ctx.globalAlpha = 0.5
  ctx.strokeStyle = asphaltPattern
  ctx.lineWidth = bandThickness
  ctx.stroke()
  ctx.globalAlpha = 1

  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = Math.max(1.5, bayWidth * 0.05)

  let distAcc = 0, next = bayWidth/2
  for(let i=0; i<pts.length-1; i++){
    const a = pts[i], b = pts[i+1]
    const segLen = Math.hypot(b.x-a.x, b.y-a.y)
    const angle = Math.atan2(b.y-a.y, b.x-a.x)
    const nx = Math.cos(angle + Math.PI/2), ny = Math.sin(angle + Math.PI/2)

    while(next <= distAcc + segLen){
      const t = (next - distAcc) / segLen
      const x = a.x + (b.x-a.x)*t
      const y = a.y + (b.y-a.y)*t

      if(layout === 'bataille'){
        ctx.beginPath()
        ctx.moveTo(x - nx * bandThickness/2, y - ny * bandThickness/2)
        ctx.lineTo(x + nx * bandThickness/2, y + ny * bandThickness/2)
        ctx.stroke()
      } else if(layout === 'epi'){
        const angleEpi = angle + Math.PI / 4
        const ux2 = Math.cos(angleEpi), uy2 = Math.sin(angleEpi)
        const halfLen = (bandThickness/2) / Math.sin(Math.PI/4)
        ctx.beginPath()
        ctx.moveTo(x - ux2*halfLen, y - uy2*halfLen)
        ctx.lineTo(x + ux2*halfLen, y + uy2*halfLen)
        ctx.stroke()
      } else if(layout === 'creneau'){
        ctx.save()
        ctx.translate(x, y)
        ctx.rotate(angle)
        const len = bayWidth * 0.95
        ctx.strokeRect(-len/2, -bandThickness/2, len, bandThickness)
        ctx.restore()
      }
      next += bayWidth
    }
    distAcc += segLen
  }
  ctx.restore()
}

function drawCrossing(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const [P1,P2] = pts
  const lat = e.coords[0].lat
  const dx = P2.x-P1.x, dy = P2.y-P1.y
  const total = Math.hypot(dx,dy)
  if(total < 2) return
  const ux = dx/total, uy = dy/total
  const nx = -uy, ny = ux
  const stripeW = Math.max(2, metersToPixels(e.stripeWidth||0.5, lat))
  const spanPx = Math.max(6, metersToPixels(e.span||3.5, lat))

  ctx.save()
  ctx.fillStyle = '#ffffff'
  let pos = 0
  while(pos < total){
    const cx = P1.x + ux*(pos+stripeW/2)
    const cy = P1.y + uy*(pos+stripeW/2)
    const pA = {x:cx-ux*stripeW/2-nx*spanPx/2, y:cy-uy*stripeW/2-ny*spanPx/2}
    const pB = {x:cx+ux*stripeW/2-nx*spanPx/2, y:cy+uy*stripeW/2-ny*spanPx/2}
    const pC = {x:cx+ux*stripeW/2+nx*spanPx/2, y:cy+uy*stripeW/2+ny*spanPx/2}
    const pD = {x:cx-ux*stripeW/2+nx*spanPx/2, y:cy-uy*stripeW/2+ny*spanPx/2}
    ctx.beginPath()
    ctx.moveTo(pA.x,pA.y); ctx.lineTo(pB.x,pB.y); ctx.lineTo(pC.x,pC.y); ctx.lineTo(pD.x,pD.y)
    ctx.closePath(); ctx.fill()
    pos += stripeW*2
  }
  ctx.restore()
}

function drawYieldLine(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const [P1,P2] = pts
  const lat = e.coords[0].lat
  const dx = P2.x-P1.x, dy = P2.y-P1.y
  const total = Math.hypot(dx,dy)
  if(total < 2) return
  const ux = dx/total, uy = dy/total
  const nx = -uy, ny = ux
  const triangleBase = Math.max(6, metersToPixels(0.8, lat))
  const triangleHeight = Math.max(8, metersToPixels(1.2, lat))

  ctx.save()
  ctx.fillStyle = '#ffffff'
  ctx.strokeStyle = '#2c2c2c'
  ctx.lineWidth = 1

  let pos = triangleBase/2
  while(pos < total){
    const cx = P1.x + ux*pos
    const cy = P1.y + uy*pos
    const tipX = cx + nx*triangleHeight
    const tipY = cy + ny*triangleHeight
    const leftX = cx - ux*triangleBase/2
    const leftY = cy - uy*triangleBase/2
    const rightX = cx + ux*triangleBase/2
    const rightY = cy + uy*triangleBase/2

    ctx.beginPath()
    ctx.moveTo(tipX, tipY)
    ctx.lineTo(leftX, leftY)
    ctx.lineTo(rightX, rightY)
    ctx.closePath()
    ctx.fill()
    pos += triangleBase * 1.6
  }
  ctx.restore()
}

function drawStopLine(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const lat = e.coords[0].lat
  const thickness = Math.max(3, metersToPixels(0.5, lat))

  ctx.save()
  pathFromPoints(pts)
  ctx.strokeStyle = '#ffffff'
  ctx.lineWidth = thickness
  ctx.lineCap = 'square'
  ctx.stroke()
  ctx.restore()
}

function drawGroundStop(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const [P1,P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y-P1.y, P2.x-P1.x)
  const cx = (P1.x+P2.x)/2, cy = (P1.y+P2.y)/2
  const unit = Math.max(10, metersToPixels(1, lat))

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle - Math.PI/2)
  ctx.scale(1, 2.4)
  ctx.fillStyle = '#ffffff'
  ctx.font = `bold ${Math.max(9, unit*2.6)}px Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.fillText('STOP', 0, 0)
  ctx.restore()
}

function drawGroundArrow(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const [P1,P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y-P1.y, P2.x-P1.x)
  const L_ = Math.max(20, metersToPixels(2.6, lat))
  const type = e.arrowType || 'tout_droit'
  const headSize = L_*0.22

  function arrowHead(x,y,dirAngle){
    ctx.save()
    ctx.translate(x,y); ctx.rotate(dirAngle)
    ctx.beginPath()
    ctx.moveTo(headSize,0)
    ctx.lineTo(-headSize*0.6, headSize*0.55)
    ctx.lineTo(-headSize*0.6, -headSize*0.55)
    ctx.closePath()
    ctx.fill()
    ctx.restore()
  }

  ctx.save()
  ctx.translate(P1.x, P1.y)
  ctx.rotate(angle)
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'
  ctx.lineWidth = Math.max(2, L_*0.09)
  ctx.lineJoin='round'; ctx.lineCap='round'

  if(type==='tout_droit' || type==='tout_droit_gauche' || type==='tout_droit_droite'){
    ctx.beginPath(); ctx.moveTo(0,0); ctx.lineTo(L_*0.75,0); ctx.stroke()
    arrowHead(L_*0.75,0,0)
  }
  if(type==='gauche' || type==='tout_droit_gauche'){
    const bendX = (type==='gauche') ? L_*0.55 : L_*0.4
    ctx.beginPath()
    ctx.moveTo(0,0)
    ctx.lineTo(bendX,0)
    ctx.quadraticCurveTo(bendX+L_*0.15,0, bendX+L_*0.15,-L_*0.25)
    ctx.stroke()
    arrowHead(bendX+L_*0.15, -L_*0.3, -Math.PI/2)
  }
  if(type==='droite' || type==='tout_droit_droite'){
    const bendX = (type==='droite') ? L_*0.55 : L_*0.4
    ctx.beginPath()
    ctx.moveTo(0,0)
    ctx.lineTo(bendX,0)
    ctx.quadraticCurveTo(bendX+L_*0.15,0, bendX+L_*0.15,L_*0.25)
    ctx.stroke()
    arrowHead(bendX+L_*0.15, L_*0.3, Math.PI/2)
  }
  ctx.restore()
}

function drawSharrow(e){
  const pts = e.coords.map(cp)
  if(pts.length<2) return
  const [P1,P2] = pts
  const lat = e.coords[0].lat
  const angle = Math.atan2(P2.y-P1.y, P2.x-P1.x)
  const cx = (P1.x+P2.x)/2, cy = (P1.y+P2.y)/2
  const s = Math.max(10, metersToPixels(0.9, lat))

  ctx.save()
  ctx.translate(cx, cy)
  ctx.rotate(angle)
  ctx.strokeStyle = '#ffffff'; ctx.fillStyle = '#ffffff'
  ctx.lineWidth = Math.max(1.4, s*0.14)

  ctx.beginPath(); ctx.arc(-s*0.7, s*0.35, s*0.28, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath(); ctx.arc(-s*0.1, s*0.35, s*0.28, 0, Math.PI*2); ctx.stroke()
  ctx.beginPath()
  ctx.moveTo(-s*0.7, s*0.35); ctx.lineTo(-s*0.35,-s*0.1); ctx.lineTo(-s*0.1, s*0.35)
  ctx.lineTo(-s*0.35,-s*0.1); ctx.lineTo(-s*0.05,-s*0.35)
  ctx.stroke()

  ;[0, s*0.6].forEach(offsetX=>{
    ctx.beginPath()
    ctx.moveTo(s*0.55+offsetX, -s*0.4)
    ctx.lineTo(s*0.9+offsetX, 0)
    ctx.lineTo(s*0.55+offsetX, s*0.4)
    ctx.stroke()
  })
  ctx.restore()
}

function drawSmoothPolygon(pts){
  ctx.beginPath()
  const n = pts.length
  const mid = (a,b)=>({x:(a.x+b.x)/2, y:(a.y+b.y)/2})
  const m0 = mid(pts[n-1], pts[0])
  ctx.moveTo(m0.x, m0.y)
  for(let i=0;i<n;i++){
    const cur = pts[i], next = pts[(i+1)%n]
    const m = mid(cur,next)
    ctx.quadraticCurveTo(cur.x, cur.y, m.x, m.y)
  }
  ctx.closePath()
}

function drawGreenSpace(e){
  const pts = e.coords.map(cp)
  if(pts.length<3) return
  ctx.save()
  drawSmoothPolygon(pts)
  ctx.fillStyle = grassPattern
  ctx.fill()
  ctx.lineWidth = 2
  ctx.strokeStyle = '#345c28'
  ctx.stroke()
  ctx.restore()
}

function drawBushMass(e){
  const pts = e.coords.map(cp)
  if(pts.length<3) return
  ctx.save()
  drawSmoothPolygon(pts)
  ctx.fillStyle = bushPattern
  ctx.fill()
  ctx.lineWidth = 2.5
  ctx.strokeStyle = '#1c3c20'
  ctx.stroke()
  ctx.restore()
}

function drawTree(e){
  const p = cp(e.coords[0])
  const lat = e.coords[0].lat
  const r = Math.max(5, metersToPixels(e.radius||2.2, lat))
  ctx.save()
  ctx.beginPath()
  ctx.ellipse(p.x+r*0.25, p.y+r*0.3, r*0.95, r*0.75, 0, 0, Math.PI*2)
  ctx.fillStyle = 'rgba(0,0,0,0.28)'
  ctx.fill()

  const grad = ctx.createRadialGradient(p.x-r*0.3, p.y-r*0.3, r*0.1, p.x, p.y, r)
  grad.addColorStop(0, '#93d65e')
  grad.addColorStop(0.55, '#4f9c3a')
  grad.addColorStop(1, '#1f5c22')
  ctx.beginPath()
  ctx.arc(p.x, p.y, r, 0, Math.PI*2)
  ctx.fillStyle = grad
  ctx.fill()
  ctx.restore()
}

function drawTrafficLight(e){
  const p = cp(e.coords[0])
  ctx.save()
  ctx.strokeStyle = '#333333'
  ctx.lineWidth = 3
  ctx.beginPath()
  ctx.moveTo(p.x, p.y + 10)
  ctx.lineTo(p.x, p.y - 12)
  ctx.stroke()

  ctx.fillStyle = '#1a1a1a'
  ctx.strokeStyle = '#444'
  ctx.lineWidth = 1
  ctx.fillRect(p.x - 5, p.y - 24, 10, 22)
  ctx.strokeRect(p.x - 5, p.y - 24, 10, 22)

  ctx.fillStyle = '#e14b4b'; ctx.beginPath(); ctx.arc(p.x, p.y - 19, 2.2, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = '#ffa500'; ctx.beginPath(); ctx.arc(p.x, p.y - 13, 2.2, 0, Math.PI*2); ctx.fill()
  ctx.fillStyle = '#3cb371'; ctx.beginPath(); ctx.arc(p.x, p.y - 7,  2.2, 0, Math.PI*2); ctx.fill()
  ctx.restore()
}

const SMOOTHABLE_TYPES = ['route','piste_cyclable','chemin_pieton','stationnement']
function drawPreview(){
  if(drawingPoints.length===0) return
  const pts = drawingPoints.map(cp)
  const cfg = toolConfig[currentTool]
  const previewPts = pts.slice()
  if(mousePos && cfg && cfg.mode!=='point' && cfg.mode!=='edit'){
    previewPts.push(cp(mousePos))
  }
  ctx.save()

  const targetType = (currentTool === 'branch') ? 'route' : currentTool
  if(SMOOTHABLE_TYPES.includes(targetType) && byId('set-smooth-curves').checked && previewPts.length>2){
    const smoothPts = catmullRomSpline(previewPts, 12, false)
    ctx.strokeStyle = 'rgba(255,213,74,0.55)'
    ctx.lineWidth = 2
    ctx.setLineDash([])
    pathFromPoints(smoothPts)
    ctx.stroke()
  }

  ctx.strokeStyle = '#ffd54a'
  ctx.fillStyle = '#ffd54a'
  ctx.lineWidth = 2
  ctx.setLineDash([6,4])
  ctx.beginPath()
  ctx.moveTo(pts[0].x, pts[0].y)
  for(let i=1;i<pts.length;i++) ctx.lineTo(pts[i].x, pts[i].y)
  if(mousePos && cfg && cfg.mode!=='point' && cfg.mode!=='edit'){
    const mp = cp(mousePos)
    ctx.lineTo(mp.x, mp.y)
  }
  ctx.stroke()
  ctx.setLineDash([])
  pts.forEach(pt=>{
    ctx.beginPath()
    ctx.arc(pt.x, pt.y, 4, 0, Math.PI*2)
    ctx.fill()
  })
  ctx.restore()
}

/* ============================================================
   OUTILS / INTERACTIONS
   ============================================================ */
function readSettingsForType(type){
  switch(type){
    case 'route': return {
      width: parseFloat(byId('set-route-width').value)||6,
      lanes: parseInt(byId('set-route-lanes').value)||2,
      direction: byId('set-route-direction').value,
      lineCap: byId('set-route-linecap').value,
      smooth: byId('set-smooth-curves').checked
    }
    case 'piste_cyclable': return {
      width: parseFloat(byId('set-cycle-width').value)||2,
      color: byId('set-cycle-color').value,
      direction: byId('set-cycle-direction').value,
      smooth: byId('set-smooth-curves').checked
    }
    case 'chemin_pieton': return {
      width: parseFloat(byId('set-ped-width').value)||2.5,
      smooth: byId('set-smooth-curves').checked
    }
    case 'bande_cyclable': return {
      width: parseFloat(byId('set-cycle-width').value)||2,
      color: byId('set-cycle-color').value,
      direction: byId('set-cycle-direction').value,
      smooth: byId('set-smooth-curves').checked
    }
    case 'rue_cyclable': return { smooth: byId('set-smooth-curves').checked }
    case 'fleche_sol': return { arrowType: byId('set-arrow-type').value }
    case 'rond_point': return {
      radius: parseFloat(byId('set-roundabout-radius').value)||12,
      lanes: parseInt(byId('set-roundabout-lanes').value)||2
    }
    case 'hachures': return {
      hatchWidth: parseFloat(byId('set-hatch-width').value)||1.5,
      cornerStyle: byId('set-hatch-style').value
    }
    case 'stationnement': return {
      layout: byId('set-park-layout').value,
      bay: parseFloat(byId('set-park-bay').value)||2.5,
      depth: parseFloat(byId('set-park-depth').value)||5,
      smooth: byId('set-smooth-curves').checked
    }
    case 'passage_pieton': return {
      span: parseFloat(byId('set-cross-span').value)||3.5,
      stripeWidth: parseFloat(byId('set-cross-stripe').value)||0.5
    }
    case 'arbre': return { radius: parseFloat(byId('set-tree-radius').value)||2.2 }
    default: return {}
  }
}

function addElement(type, coords){
  const settings = readSettingsForType(type)
  const zVal = zOrderBase[type] !== undefined ? zOrderBase[type] : 0
  elements.push(Object.assign({id: idCounter++, type, coords, z: zVal}, settings))
  draw()
}

function selectTool(name){
  currentTool = name
  drawingPoints = []
  if(name !== 'edit'){
    selectedElementForEdit = null
    byId('edit-z-row').style.display = 'none'
  }
  if(name !== 'branch'){ branchSourceNode = null }
  root.value.querySelectorAll('.tool-btn').forEach(b=> b.classList.toggle('active', b.dataset.tool===name))
  map.getContainer().style.cursor = name ? 'crosshair' : ''
  updateStatus()
  draw()
}

function updateStatus(){
  const s = byId('status-bar')
  if(!currentTool){ s.innerHTML = 'Sélectionnez un équipement ou un marquage dans la liste pour commencer.'; return }
  let txt = instructions[currentTool] || ''
  if(currentTool === 'edit' && selectedElementForEdit){
    txt = `Élément sélectionné (Type: ${selectedElementForEdit.type}, Z: ${selectedElementForEdit.z}). Glissez une poignée ou ajustez la valeur Z dans les paramètres.`
  } else if(currentTool === 'branch' && branchSourceNode){
    txt = 'Nœud de départ sélectionné. Cliquez sur la carte pour tracer la nouvelle branche. Validez avec Entrée.'
  } else if(drawingPoints.length>0 && toolConfig[currentTool] && toolConfig[currentTool].mode!=='point'){
    txt += `<br><strong>${drawingPoints.length}</strong> point(s) placé(s).`
  }
  s.innerHTML = txt
}

function finalizeDrawing(){
  const cfg = toolConfig[currentTool]
  if(!cfg || cfg.mode==='point' || cfg.mode==='edit') return
  if(drawingPoints.length < cfg.minPoints){
    cancelDrawing()
    return
  }
  const targetType = (currentTool === 'branch') ? 'route' : currentTool
  addElement(targetType, drawingPoints.slice())
  drawingPoints = []
  branchSourceNode = null
  updateStatus()
  draw()
}

function cancelDrawing(){
  drawingPoints = []
  selectedElementForEdit = null
  branchSourceNode = null
  byId('edit-z-row').style.display = 'none'
  updateStatus()
  draw()
}

/* Trouve l'élément le plus proche d'un point écran (factorisé : edit + delete) */
function findNearestElement(containerPoint){
  let best = null, bestDist = 20
  elements.forEach(e=>{
    const pts = e.coords.map(cp)
    let d
    if(['arbre', 'feu_tricolore', 'rond_point'].includes(e.type)){
      d = dist(pts[0], containerPoint)
    } else if(['espace_vert', 'massif', 'hachures'].includes(e.type)){
      d = pointInPolygon(containerPoint, pts) ? 0 : minDistToSegments(pts, containerPoint, true)
    } else {
      d = minDistToSegments(pts, containerPoint, false)
    }
    if(d < bestDist){ bestDist = d; best = e }
  })
  return best
}

function deleteNearElement(containerPoint){
  const best = findNearestElement(containerPoint)
  if(best){
    elements = elements.filter(e=>e!==best)
    if(selectedElementForEdit === best){
      selectedElementForEdit = null
      byId('edit-z-row').style.display = 'none'
    }
    draw()
  }
}

function onMapClick(ev){
  if(!currentTool) return
  if(currentTool==='delete'){ deleteNearElement(ev.containerPoint); return }

  if(currentTool==='edit'){
    selectedElementForEdit = findNearestElement(ev.containerPoint)
    if(selectedElementForEdit){
      if(selectedElementForEdit.z === undefined){
        selectedElementForEdit.z = zOrderBase[selectedElementForEdit.type] || 0
      }
      byId('edit-z-row').style.display = 'flex'
      byId('set-selected-z').value = selectedElementForEdit.z
    } else {
      byId('edit-z-row').style.display = 'none'
    }
    updateStatus()
    draw()
    return
  }

  if(currentTool==='branch'){
    const cpPoint = ev.containerPoint
    if(!branchSourceNode){
      let foundNode = null
      elements.forEach(e=>{
        if(['route', 'piste_cyclable', 'chemin_pieton'].includes(e.type)){
          e.coords.forEach(coord=>{
            if(dist(cp(coord), cpPoint) < 12) foundNode = coord
          })
        }
      })
      if(foundNode){
        branchSourceNode = foundNode
        drawingPoints = [foundNode]
        updateStatus()
        draw()
      }
      return
    } else {
      drawingPoints.push({lat: ev.latlng.lat, lng: ev.latlng.lng})
      updateStatus()
      draw()
      return
    }
  }

  const cfg = toolConfig[currentTool]
  const p = {lat: ev.latlng.lat, lng: ev.latlng.lng}

  if(cfg.mode==='point'){
    addElement(currentTool, [p])
    return
  }

  drawingPoints.push(p)
  if(cfg.mode==='twopoint' && drawingPoints.length===2){
    finalizeDrawing()
  }
  updateStatus()
  draw()
}

function onMapMouseDown(ev){
  if(currentTool !== 'edit' || !selectedElementForEdit) return
  const idx = selectedElementForEdit.coords.findIndex(c=> dist(cp(c), ev.containerPoint) < 12)
  if(idx !== -1){
    draggedVertexIndex = idx
    map.dragging.disable()
  }
}

function onMapMouseMove(ev){
  mousePos = {lat: ev.latlng.lat, lng: ev.latlng.lng}
  if(currentTool === 'edit' && selectedElementForEdit && draggedVertexIndex !== null){
    selectedElementForEdit.coords[draggedVertexIndex] = {lat: ev.latlng.lat, lng: ev.latlng.lng}
    draw()
  }
  if(drawingPoints.length>0) draw()
}

function onMapMouseUp(){
  if(draggedVertexIndex !== null){
    draggedVertexIndex = null
    map.dragging.enable()
    draw()
  }
}

function onMapDblClick(){
  if(currentTool && toolConfig[currentTool] && ['line', 'polygon', 'branch'].includes(toolConfig[currentTool].mode)){
    finalizeDrawing()
  }
}

function onKeyDown(ev){
  // Ne pas intercepter Entrée/Échap quand on tape dans un champ
  const tag = ev.target && ev.target.tagName
  if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if(ev.key === 'Enter') finalizeDrawing()
  if(ev.key === 'Escape') cancelDrawing()
}

function onWindowResize(){ if(map) map.invalidateSize() }

/* ============================================================
   CYCLE DE VIE VUE
   ============================================================ */
const sidebarCleanups = []

onMounted(()=>{
  map = L.map(mapEl.value, {
    doubleClickZoom: false,
    zoomControl: true,
    center: [48.8566, 2.3522],
    zoom: 19,
    maxZoom: 21
  })
  L.tileLayer(TILE_URL, TILE_OPTS).addTo(map)
  L.control.scale({metric:true, imperial:false}).addTo(map)

  overlay = document.createElement('canvas')
  overlay.className = 'up-overlay-canvas'
  map.getContainer().appendChild(overlay)
  ctx = overlay.getContext('2d')
  buildPatterns()

  map.on('resize', resizeOverlay)
  map.on('move', draw)
  map.on('moveend', draw)
  map.on('zoomstart', ()=>{ overlay.style.opacity = 0 })
  map.on('zoomend', ()=>{ overlay.style.opacity = 1; draw() })
  map.on('click', onMapClick)
  map.on('mousedown', onMapMouseDown)
  map.on('mousemove', onMapMouseMove)
  map.on('mouseup', onMapMouseUp)
  map.on('dblclick', onMapDblClick)

  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeyDown)

  // Boutons d'outils
  root.value.querySelectorAll('.tool-btn').forEach(btn=>{
    btn.addEventListener('click', ()=>{
      selectTool(currentTool === btn.dataset.tool ? null : btn.dataset.tool)
    })
  })
  byId('btn-validate').addEventListener('click', finalizeDrawing)
  byId('btn-cancel').addEventListener('click', cancelDrawing)
  byId('btn-clear-all').addEventListener('click', ()=>{
    if(elements.length===0) return
    if(confirm('Effacer tous les éléments du projet ? Cette action est irréversible.')){
      elements = []
      selectedElementForEdit = null
      byId('edit-z-row').style.display = 'none'
      branchSourceNode = null
      draw()
    }
  })
  byId('set-selected-z').addEventListener('input', (e)=>{
    if(selectedElementForEdit){
      selectedElementForEdit.z = parseInt(e.target.value) || 0
      draw()
    }
  })
  root.value.querySelectorAll('.sb-section input:not(#set-selected-z), .sb-section select').forEach(inp=>{
    inp.addEventListener('input', draw)
    inp.addEventListener('change', draw)
  })

  updateStatus()
  map.whenReady(resizeOverlay)
  setTimeout(resizeOverlay, 200)
})

onBeforeUnmount(()=>{
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('keydown', onKeyDown)
  if(map){ map.remove(); map = null }
  overlay = null
  ctx = null
})
</script>
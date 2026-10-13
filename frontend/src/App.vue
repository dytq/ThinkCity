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
import { 
  ref, 
  onMounted, 
  onBeforeUnmount 
} from 'vue'

import {
  initGeometry,
  cp,
  dist,
  minDistToSegments,
  pointInPolygon,
} from "./geometry.js";

import {
  initRender,
  resizeOverlay,
  draw
} from "./render.js";

import L from 'leaflet'

import 'leaflet/dist/leaflet.css'

const TILE_URL = 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
const TILE_OPTS = { maxZoom: 21, maxNativeZoom: 21, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Imagerie &copy; Google' }

const root = ref(null)
const mapEl = ref(null)

let map = null
let overlay = null
let ctx = null

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
  // remove the last point when double click
  if (['line', 'polygon', 'branch'].includes(cfg.mode) && drawingPoints.length > cfg.minPoints) {
    drawingPoints.pop()
  }
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
  const tag = ev.target && ev.target.tagName
  if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if(ev.key === 'Enter') finalizeDrawing()
  if(ev.key === 'Escape') cancelDrawing()
}

function onWindowResize(){ if(map) map.invalidateSize() }

/* ============================================================
   CYCLE DE VIE VUE
   ============================================================ */

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
  initGeometry({ map, ctx })

  initRender({
    overlay,
    map,
    ctx,
    getState: () => ({
      drawingPoints,
      elements,
      selectedElementForEdit,
      currentTool,
      toolConfig,
      mousePos,
      byId,
      cp
    })
  })
  
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
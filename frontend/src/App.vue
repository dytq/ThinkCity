<template>
  <div class="up-root" ref="root">
    <!-- ================= CARTE ================= -->
    <div id="map-wrap">
      <div id="map" ref="mapEl"></div>
    </div>

    <!-- ================= LÉGENDE (haut gauche) ================= -->
    <button class="legend-toggle" :class="{ on: showLegend }" @click="showLegend = !showLegend" title="Légende">
      ℹ️ Légende
    </button>
    <div class="legend-card" v-show="showLegend">
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c;"></span>Route / Voies</div>
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:1px dashed #fff;"></span>Rond-point</div>
      <div class="legend-item"><span class="swatch" style="background:repeating-linear-gradient(45deg,#2c2c2c,#2c2c2c 4px,#fff 4px,#fff 8px);"></span>Zébras / Hachures</div>
      <div class="legend-item"><span class="swatch" style="background:#3c8a3c;"></span>Piste cyclable</div>
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:2px solid #3c8a3c;"></span>Bande / rue cyclable / chevrons</div>
      <div class="legend-item"><span class="swatch" style="background:#b9b2a3;"></span>Chemin piéton</div>
      <div class="legend-item"><span class="swatch" style="background:#ffffff;"></span>Passage piéton / Cédez-le-passage</div>
      <div class="legend-item"><span class="swatch" style="background:#e14b4b;"></span>Feu tricolore</div>
      <div class="legend-item"><span class="swatch" style="background:#ffcc00;"></span>Feu clignotant</div>
      <div class="legend-item"><span class="swatch" style="background:#4a7c3a;"></span>Espace vert / Arbre</div>
    </div>

    <!-- ================= PROPRIÉTÉS (haut droite) ================= -->
    <section class="props-panel" v-show="uiTool">
      <header class="props-head">
        <span class="props-ico">{{ activeToolInfo.icon }}</span>
        <div>
          <h2>{{ activeToolInfo.label }}</h2>
          <p v-if="uiTool === 'edit'">Propriétés de l'élément</p>
          <p v-else-if="uiTool === 'delete'">Aucune propriété</p>
          <p v-else>Propriétés avant placement</p>
        </div>
      </header>

      <div class="props-body">
        <!-- Champs par type : tous restent dans le DOM (v-show) pour que render.js
             puisse toujours lire les mêmes id via byId() -->
        <template v-for="f in fields" :key="f.id">
          <div class="setting-row" v-show="f.tools.includes(uiTool)" :class="{ 'is-check': f.type === 'checkbox' }">
            <label :for="f.id">{{ f.label }}</label>

            <input v-if="f.type === 'number'" type="number" :id="f.id" 
                  v-model.number="settingsValues[f.id]"
                  :min="f.min" :max="f.max" :step="f.step" @input="draw" @change="draw">

            <input v-else-if="f.type === 'color'" type="color" :id="f.id" 
                  v-model="settingsValues[f.id]" @input="draw" @change="draw">

            <input v-else-if="f.type === 'checkbox'" type="checkbox" :id="f.id" 
                  v-model="settingsValues[f.id]" @input="draw" @change="draw">

            <select v-else-if="f.type === 'select'" :id="f.id" 
                    v-model="settingsValues[f.id]" @input="draw" @change="draw">
              <option v-for="o in f.options" :key="o[0]" :value="o[0]">{{ o[1] }}</option>
            </select>
          </div>
        </template>

        <!-- Mode édition -->
        <div id="edit-z-row" class="setting-row z-row" v-show="uiTool === 'edit' && hasSelection">
          <label for="set-selected-z">Ordre Z (élément sélectionné)</label>
          <input type="number" id="set-selected-z" :value="selectedZ" step="1" @input="onZInput">
        </div>
        <p class="props-empty" v-if="uiTool === 'edit' && !hasSelection">
          Cliquez sur un élément de la carte pour modifier sa géométrie et son ordre Z.
        </p>
        <p class="props-empty" v-else-if="uiTool === 'edit' && hasSelection">
          Type : <strong>{{ selectedType }}</strong>. Glissez une poignée pour déplacer un point.
        </p>
        <p class="props-empty" v-if="uiTool && uiTool !== 'edit' && !hasFieldsForTool">
          Cet élément n'a pas de paramètre à régler.
        </p>
      </div>
    </section>

    <!-- ================= DOCK DU BAS (style Cities: Skylines) ================= -->
    <div class="dock">
      <!-- <div class="status" id="status-bar" v-html="statusHtml"></div>-->

      <!-- Plateau d'outils de la catégorie active -->
      <div class="tray" id="tool-grid">
        <button v-for="t in currentCategory.tools" :key="t.id"
                class="tool-btn" :class="[{ active: uiTool === t.id }, t.cls]"
                :data-tool="t.id" :title="t.label" @click="onToolClick(t.id)">
          <span class="ico">{{ t.icon }}</span>
          <span class="lbl">{{ t.label }}</span>
        </button>
      </div>

      <!-- Barre des catégories + actions -->
      <div class="cats-bar">
        <button v-for="c in categories" :key="c.id" class="cat-btn"
                :class="{ active: activeCat === c.id }" :title="c.label" @click="activeCat = c.id">
          <span class="ico">{{ c.icon }}</span>
          <span class="lbl">{{ c.label }}</span>
        </button>

        <span class="sep"></span>
        
        <button class="action-btn clear-all" id="btn-clear-all" @click="clearAll" title="Effacer tout le projet">🗑️ Tout Supprimer</button>
      </div>
    </div>
  </div>
</template>

<script setup>
import { ref, computed, onMounted,reactive, onBeforeUnmount } from 'vue'

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
   ÉTAT RÉACTIF (UI uniquement)
   ============================================================ */
const uiTool = ref(null)            // outil actif (miroir de currentTool)
const activeCat = ref('voirie')     // catégorie ouverte dans le dock
const showLegend = ref(false)
const statusHtml = ref('')
const hasSelection = ref(false)
const selectedZ = ref(0)
const selectedType = ref('')

/* ============================================================
   CATÉGORIES DU DOCK (mêmes icônes qu'avant)
   ============================================================ */
const categories = [
  { id: 'voirie', icon: '🛣️', label: 'Voirie', tools: [
    { id: 'route',         icon: '🛣️', label: 'Route' },
    { id: 'rond_point',    icon: '⭕', label: 'Rond-point' },
    { id: 'hachures',      icon: '📐', label: 'Zébras / Hachures' },
    { id: 'stationnement', icon: '🅿️', label: 'Stationnement' },
  ]},
  { id: 'mobilite', icon: '🚴', label: 'Mobilités', tools: [
    { id: 'piste_cyclable', icon: '🚴', label: 'Piste cycl.' },
    { id: 'bande_cyclable', icon: '🚲', label: 'Bande cyclable' },
    { id: 'chevron_velo',   icon: '˄˄', label: 'Chevrons vélo' },
    { id: 'rue_cyclable',   icon: 'Ⓑ', label: 'Rue cyclable' },
    { id: 'chemin_pieton',  icon: '🧱', label: 'Chemin piéton' },
  ]},
  { id: 'marquages', icon: '🚸', label: 'Marquages', tools: [
    { id: 'passage_pieton',   icon: '🚸', label: 'Pass. piéton' },
    { id: 'cedez_le_passage', icon: '🔻', label: 'Cédez-le-passage' },
    { id: 'ligne_stop',       icon: '🛑', label: 'Ligne de stop' },
    { id: 'stop_sol',         icon: '🅢', label: 'STOP au sol' },
    { id: 'fleche_sol',       icon: '⬆️', label: 'Flèche directionnelle' },
  ]},
  { id: 'signal', icon: '🚦', label: 'Signalisation', tools: [
    { id: 'feu_tricolore',  icon: '🚦', label: 'Feu tricolore' },
    { id: 'feu_clignotant', icon: '🟡', label: 'Feu clignotant' },
  ]},
  { id: 'vegetal', icon: '🌿', label: 'Végétation', tools: [
    { id: 'espace_vert', icon: '🌿', label: 'Espace vert' },
    { id: 'massif',      icon: '🌳', label: 'Massif' },
    { id: 'arbre',       icon: '🌲', label: 'Arbre isolé' },
  ]},
  { id: 'outils', icon: '✏️', label: 'Outils', tools: [
    { id: 'edit',   icon: '✏️', label: 'Éditer le tracé',        cls: 'edit-btn' },
    { id: 'branch', icon: '🔀', label: 'Ajouter une branche',    cls: 'branch-btn' },
    { id: 'delete', icon: '🗑️', label: 'Supprimer un élément',   cls: 'delete-btn' },
  ]},
]

const toolsById = {}
categories.forEach(c => c.tools.forEach(t => { toolsById[t.id] = { ...t, cat: c.id } }))

const currentCategory = computed(() => categories.find(c => c.id === activeCat.value) || categories[0])
const activeToolInfo = computed(() => toolsById[uiTool.value] || { icon: '', label: '' })

/* ============================================================
   PROPRIÉTÉS PAR TYPE
   Les id sont identiques à l'ancienne version (render.js peut
   donc continuer à lire byId('set-...')).
   ============================================================ */
const ROUTE_TOOLS = ['route', 'branch']
const SMOOTH_TOOLS = ['route', 'branch', 'piste_cyclable', 'chemin_pieton', 'bande_cyclable', 'rue_cyclable', 'stationnement']
const CYCLE_TOOLS = ['piste_cyclable', 'bande_cyclable']

const settingsValues = reactive({
  'set-smooth-curves': false,
  'set-route-width': 6,
  'set-route-lanes': 2,
  'set-route-direction': 'bidirectional',
  'set-route-linecap': 'round',
  'set-roundabout-radius': 12,
  'set-roundabout-lanes': 2,
  'set-hatch-width': 1.5,
  'set-hatch-style': 'straight',
  'set-cycle-width': 2,
  'set-cycle-color': '#3c8a3c',
  'set-cycle-direction': 'unidirectional',
  'set-ped-width': 2.5,
  'set-park-layout': 'bataille',
  'set-park-depth': 5,
  'set-park-bay': 2.5,
  'set-cross-span': 3.5,
  'set-cross-stripe': 0.5,
  'set-arrow-type': 'tout_droit',
  'set-tree-radius': 2.2
})

const fields = [
  // Commun aux tracés
  { id: 'set-smooth-curves', label: 'Lissage des tracés (courbes de Bézier)', type: 'checkbox', def: false, tools: SMOOTH_TOOLS },

  // Route (et branche, qui crée une route)
  { id: 'set-route-width',     label: 'Largeur route (m)', type: 'number', def: 6, min: 2, max: 20, step: 0.5, tools: ROUTE_TOOLS },
  { id: 'set-route-lanes',     label: 'Nombre de voies',   type: 'number', def: 2, min: 1, max: 6,  step: 1,   tools: ROUTE_TOOLS },
  { id: 'set-route-direction', label: 'Sens de circulation', type: 'select', def: 'bidirectional', tools: ROUTE_TOOLS,
    options: [['bidirectional', 'Bidirectionnelle'], ['unidirectional', 'Sens unique']] },
  { id: 'set-route-linecap',   label: 'Terminaison route', type: 'select', def: 'round', tools: ROUTE_TOOLS,
    options: [['round', 'Ronde'], ['butt', 'Carrée (nette)']] },

  // Rond-point
  { id: 'set-roundabout-radius', label: 'Rayon rond-point (m)',  type: 'number', def: 12, min: 5, max: 40, step: 1, tools: ['rond_point'] },
  { id: 'set-roundabout-lanes',  label: 'Voies du rond-point',   type: 'number', def: 2,  min: 1, max: 4,  step: 1, tools: ['rond_point'] },

  // Zébras
  { id: 'set-hatch-width', label: 'Largeur zébras (m)', type: 'number', def: 1.5, min: 0.5, max: 4, step: 0.25, tools: ['hachures'] },
  { id: 'set-hatch-style', label: 'Forme zébras', type: 'select', def: 'straight', tools: ['hachures'],
    options: [['straight', 'Angles droits (Net)'], ['smooth', 'Arrondis']] },

  // Piste / bande cyclable
  { id: 'set-cycle-width',     label: 'Largeur piste cyclable (m)', type: 'number', def: 2, min: 1, max: 6, step: 0.5, tools: CYCLE_TOOLS },
  { id: 'set-cycle-color',     label: 'Couleur piste cyclable',     type: 'color',  def: '#3c8a3c', tools: CYCLE_TOOLS },
  { id: 'set-cycle-direction', label: 'Sens piste cyclable', type: 'select', def: 'unidirectional', tools: CYCLE_TOOLS,
    options: [['unidirectional', 'Unidirectionnelle'], ['bidirectional', 'Bidirectionnelle']] },

  // Chemin piéton
  { id: 'set-ped-width', label: 'Largeur chemin piéton (m)', type: 'number', def: 2.5, min: 1, max: 8, step: 0.5, tools: ['chemin_pieton'] },

  // Stationnement
  { id: 'set-park-layout', label: 'Type stationnement', type: 'select', def: 'bataille', tools: ['stationnement'],
    options: [['bataille', 'Bataille (90°)'], ['epi', 'Épi (45°)'], ['creneau', 'Créneau (Parallèle)']] },
  { id: 'set-park-depth', label: 'Profondeur place (m)', type: 'number', def: 5,   min: 1.5, max: 8, step: 0.5, tools: ['stationnement'] },
  { id: 'set-park-bay',   label: 'Largeur place (m)',    type: 'number', def: 2.5, min: 1.5, max: 5, step: 0.1, tools: ['stationnement'] },

  // Passage piéton
  { id: 'set-cross-span',   label: 'Largeur passage piéton (m)', type: 'number', def: 3.5, min: 2,   max: 10, step: 0.5, tools: ['passage_pieton'] },
  { id: 'set-cross-stripe', label: 'Largeur bandes piéton (m)',  type: 'number', def: 0.5, min: 0.3, max: 1,  step: 0.1, tools: ['passage_pieton'] },

  // Flèche au sol
  { id: 'set-arrow-type', label: 'Type de flèche au sol', type: 'select', def: 'tout_droit', tools: ['fleche_sol'],
    options: [
      ['tout_droit', 'Tout droit'], ['gauche', 'Tourne à gauche'], ['droite', 'Tourne à droite'],
      ['tout_droit_gauche', 'Tout droit + gauche'], ['tout_droit_droite', 'Tout droit + droite']
    ] },

  // Arbre
  { id: 'set-tree-radius', label: 'Rayon houppier arbre (m)', type: 'number', def: 2.2, min: 1, max: 8, step: 0.2, tools: ['arbre'] },
]

const hasFieldsForTool = computed(() => fields.some(f => f.tools.includes(uiTool.value)))

/* ============================================================
   DONNÉES & ÉTAT (moteur de dessin)
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
  feu_clignotant:  {label:'Feu clignotant',   mode:'point',   minPoints:1},
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
  stop_sol:       'Cliquez le point de départ puis un point indiquant le sens de circulation (3 clics).',
  fleche_sol:     'Cliquez le point de départ (arrière de la flèche) puis un point indiquant le sens de circulation (2 clics).',
  bande_cyclable: 'Cliquez pour tracer la bande cyclable peinte sur chaussée. Validez avec Entrée.',
  chevron_velo:   'Cliquez le point de départ puis un point indiquant le sens de circulation (2 clics).',
  rue_cyclable:   'Cliquez pour tracer l\'axe de la rue cyclable (pictogrammes répétés). Validez avec Entrée.',
  feu_tricolore:  'Cliquez sur le bord de la route pour positionner le feu tricolore.',
  feu_clignotant: 'Cliquez sur la carte pour positionner le feu clignotant.',
  arbre:          'Cliquez sur la carte pour planter un arbre.',
  edit:           'Cliquez sur un élément pour afficher ses points de contrôle et ajuster sa géométrie et sa valeur Z.',
  branch:         'Survolez et cliquez sur un nœud d\'un chemin existant pour y démarrer une nouvelle branche.',
  delete:         'Cliquez sur un élément existant pour le supprimer.'
}

const zOrderBase = {
  route: 0,
  espace_vert: 1,
  massif: 2,
  hachures: 3,

  piste_cyclable: 4,
  bande_cyclable: 4.5,
  rue_cyclable: 4.6,
  chemin_pieton: 5,

  rond_point: 6,
  stationnement: 7,

  passage_pieton: 8,
  cedez_le_passage: 9,
  ligne_stop: 10,
  stop_sol: 10.2,
  fleche_sol: 10.4,
  chevron_velo: 10.6,

  arbre: 11,
  feu_tricolore: 12,
  feu_clignotant: 12.5
}

/* ============================================================
   ACCÈS AU DOM (limité au composant)
   ============================================================ */
function byId(id){ return root.value.querySelector('#' + id) }

/* ============================================================
   ANIMATION DES FEUX CLIGNOTANTS
   ============================================================ */
let blinkState = true
let blinkAnimationId = null
let blinkTimeoutId = null

function animateBlinkingLights() {
  blinkState = !blinkState
  draw()
  blinkAnimationId = requestAnimationFrame(() => {
    blinkTimeoutId = setTimeout(animateBlinkingLights, 500)
  })
}

/* ============================================================
   SÉLECTION (synchronise l'état réactif de l'UI)
   ============================================================ */
function setSelected(el){
  selectedElementForEdit = el
  hasSelection.value = !!el
  if(el){
    if(el.z === undefined) el.z = zOrderBase[el.type] || 0
    selectedZ.value = el.z
    selectedType.value = (toolsById[el.type] && toolsById[el.type].label) || el.type
  }
}

function onZInput(e){
  if(selectedElementForEdit){
    selectedElementForEdit.z = parseInt(e.target.value) || 0
    selectedZ.value = selectedElementForEdit.z
    draw()
  }
}

/* ============================================================
   OUTILS / INTERACTIONS
   ============================================================ */
function readSettingsForType(type){
  switch(type){
    case 'route': return {
      width: settingsValues['set-route-width'],
      lanes: settingsValues['set-route-lanes'],
      direction: settingsValues['set-route-direction'],
      lineCap: settingsValues['set-route-linecap'],
      smooth: settingsValues['set-smooth-curves']
    }
    case 'piste_cyclable': return {
      width: settingsValues['set-cycle-width'],
      color: settingsValues['set-cycle-color'],
      direction: settingsValues['set-cycle-direction'],
      smooth: settingsValues['set-smooth-curves']
    }
    case 'chemin_pieton': return {
      width: settingsValues['set-ped-width'],
      smooth: settingsValues['set-smooth-curves']
    }
    case 'bande_cyclable': return {
      width: settingsValues['set-cycle-width'],
      color: settingsValues['set-cycle-color'],
      direction: settingsValues['set-cycle-direction'],
      smooth: settingsValues['set-smooth-curves']
    }
    case 'rue_cyclable': return { smooth: settingsValues['set-smooth-curves'] }
    case 'fleche_sol': return { arrowType: settingsValues['set-arrow-type'] }
    case 'rond_point': return {
      radius: settingsValues['set-roundabout-radius'],
      lanes: settingsValues['set-roundabout-lanes']
    }
    case 'hachures': return {
      hatchWidth: settingsValues['set-hatch-width'],
      cornerStyle: settingsValues['set-hatch-style']
    }
    case 'stationnement': return {
      layout: settingsValues['set-park-layout'],
      bay: settingsValues['set-park-bay'],
      depth: settingsValues['set-park-depth'],
      smooth: settingsValues['set-smooth-curves']
    }
    case 'passage_pieton': return {
      span: settingsValues['set-cross-span'],
      stripeWidth: settingsValues['set-cross-stripe']
    }
    case 'arbre': return { radius: settingsValues['set-tree-radius'] }
    default: return {}
  }
}

function addElement(type, coords){
  const settings = readSettingsForType(type)
  const zVal = zOrderBase[type] !== undefined ? zOrderBase[type] : 0
  elements.push(Object.assign({id: idCounter++, type, coords, z: zVal}, settings))
  draw()
}

function onToolClick(id){
  selectTool(currentTool === id ? null : id)
}

function selectTool(name){
  currentTool = name
  uiTool.value = name
  drawingPoints = []
  if(name && toolsById[name]) activeCat.value = toolsById[name].cat
  if(name !== 'edit'){ setSelected(null) }
  if(name !== 'branch'){ branchSourceNode = null }
  map.getContainer().style.cursor = name ? 'crosshair' : ''
  updateStatus()
  draw()
}

function updateStatus(){
  if(!currentTool){ statusHtml.value = 'Choisissez une catégorie, puis un équipement ou un marquage dans le dock.'; return }
  let txt = instructions[currentTool] || ''
  if(currentTool === 'edit' && selectedElementForEdit){
    txt = `Élément sélectionné (Type: ${selectedElementForEdit.type}, Z: ${selectedElementForEdit.z}). Glissez une poignée ou ajustez la valeur Z dans le panneau.`
  } else if(currentTool === 'branch' && branchSourceNode){
    txt = 'Nœud de départ sélectionné. Cliquez sur la carte pour tracer la nouvelle branche. Validez avec Entrée.'
  } else if(drawingPoints.length>0 && toolConfig[currentTool] && toolConfig[currentTool].mode!=='point'){
    txt += ` <strong>${drawingPoints.length}</strong> point(s) placé(s).`
  }
  statusHtml.value = txt
}

function finalizeDrawing(){
  const cfg = toolConfig[currentTool]
  if(!cfg || cfg.mode==='point' || cfg.mode==='edit') return
  // retire le dernier point lors d'un double-clic
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
  setSelected(null)
  branchSourceNode = null
  updateStatus()
  draw()
}

function clearAll(){
  if(elements.length===0) return
  if(confirm('Effacer tous les éléments du projet ? Cette action est irréversible.')){
    elements = []
    setSelected(null)
    branchSourceNode = null
    draw()
  }
}

/* Trouve l'élément le plus proche d'un point écran (factorisé : edit + delete) */
function findNearestElement(containerPoint){
  let best = null, bestDist = 20
  elements.forEach(e=>{
    const pts = e.coords.map(cp)
    let d
    if(['arbre', 'feu_tricolore', 'feu_clignotant', 'rond_point'].includes(e.type)){
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
    if(selectedElementForEdit === best){ setSelected(null) }
    draw()
  }
}

function onMapClick(ev){
  if(!currentTool) return
  if(currentTool==='delete'){ deleteNearElement(ev.containerPoint); return }

  if(currentTool==='edit'){
    setSelected(findNearestElement(ev.containerPoint))
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
  // échelle à droite pour ne pas passer sous le dock centré
  L.control.scale({metric:true, imperial:false, position:'bottomright'}).addTo(map)

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

  animateBlinkingLights()

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

  updateStatus()
  map.whenReady(resizeOverlay)
  setTimeout(resizeOverlay, 200)
})

onBeforeUnmount(()=>{
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('keydown', onKeyDown)
  if (blinkAnimationId) cancelAnimationFrame(blinkAnimationId)
  if (blinkTimeoutId) clearTimeout(blinkTimeoutId)
  if(map){ map.remove(); map = null }
  overlay = null
  ctx = null
})
</script>
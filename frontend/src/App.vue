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
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c;"></span>Route / Voies / Chaussée</div>
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:1px dashed #fff;"></span>Rond-point</div>
      <div class="legend-item"><span class="swatch" style="background:repeating-linear-gradient(45deg,#2c2c2c,#2c2c2c 4px,#fff 4px,#fff 8px);"></span>Zébras / Hachures</div>
      <div class="legend-item"><span class="swatch" style="background:#3c8a3c;"></span>Piste cyclable</div>
      <div class="legend-item"><span class="swatch" style="background:#2c2c2c; border:2px solid #3c8a3c;"></span>Bande / rue cyclable / chevrons</div>
      <div class="legend-item"><span class="swatch" style="background:#b9b2a3;"></span>Chemin piéton / Zone piétonne</div>
      <div class="legend-item"><span class="swatch" style="background:#ffffff;"></span>Passage piéton / Cédez-le-passage</div>
      <div class="legend-item"><span class="swatch" style="background:repeating-linear-gradient(90deg,#fff,#fff 6px,#2c2c2c 6px,#2c2c2c 10px);"></span>Ligne continue / discontinue</div>
      <div class="legend-item"><span class="swatch" style="background:#e14b4b;"></span>Feu tricolore</div>
      <div class="legend-item"><span class="swatch" style="background:#ffcc00;"></span>Feu clignotant</div>
      <div class="legend-item"><span class="swatch" style="background:#4a7c3a;"></span>Espace vert / Arbre</div>
      <div class="legend-item"><span class="swatch" style="background:#4a90c8;"></span>Eau / Fontaine</div>
      <div class="legend-item"><span class="swatch" style="background:#8c8c8c;"></span>Bâtiment</div>
      <div class="legend-item"><span class="swatch" style="background:#c0392b;"></span>Voie de bus / Arrêt de bus</div>
      <div class="legend-item"><span class="swatch" style="background:#6b6b6b; border:1px solid #bbb;"></span>Rails de tramway</div>
      <div class="legend-item"><span class="swatch" style="background:#4a6fa5;"></span>Véhicules</div>
    </div>

    <!-- ================= PROPRIÉTÉS (haut droite) ================= -->
    <section class="props-panel" v-show="uiTool">
      <header class="props-head">
        <span class="props-ico">{{ activeToolInfo.icon }}</span>
        <div>
          <h2>{{ activeToolInfo.label }}</h2>
          <p v-if="uiTool === 'edit'">Propriétés de l'élément</p>
          <p v-else>Propriétés avant placement</p>
        </div>
      </header>

      <div class="props-body">
        <!-- Champs par type : tous restent dans le DOM (v-show) pour que render.js
             puisse toujours lire les mêmes id via byId() -->
        <template v-for="f in fields" :key="f.id">
          <div class="setting-row" v-show="isFieldVisible(f)" :class="{ 'is-check': f.type === 'checkbox' }">
            <label :for="f.id">{{ f.label }}</label>

            <input v-if="f.type === 'number'" type="number" :id="f.id"
                  :value="fieldText(f)" :min="f.min" :max="f.max" :step="f.step"
                  @input="onFieldInput(f, $event)">

            <input v-else-if="f.type === 'color'" type="color" :id="f.id"
                  :value="fieldText(f)" @input="onFieldInput(f, $event)">

            <input v-else-if="f.type === 'checkbox'" type="checkbox" :id="f.id"
                  :checked="fieldChecked(f)" @change="onFieldInput(f, $event)">

            <select v-else-if="f.type === 'select'" :id="f.id"
                    :value="fieldText(f)" @change="onFieldInput(f, $event)">
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
          Cliquez sur un élément de la carte pour afficher et modifier ses propriétés, sa géométrie et son ordre Z.
        </p>
        <p class="props-empty" v-else-if="uiTool === 'edit' && hasSelection">
          Type : <strong>{{ selectedType }}</strong>. Glissez une poignée pour déplacer un point.
        </p>
        <p class="props-empty" v-if="uiTool === 'edit' && hasSelection && !hasEditFields">
          Cet élément n'a pas de paramètre à régler.
        </p>
        <p class="props-empty" v-if="uiTool && uiTool !== 'edit' && !hasFieldsForTool">
          Cet élément n'a pas de paramètre à régler.
        </p>

        <button v-if="uiTool === 'edit' && hasSelection" class="action-btn delete-selected"
                id="btn-delete-selected" title="Supprimer l'élément sélectionné (touche Suppr)"
                @click="deleteSelected">🗑️ Supprimer l'élément</button>
      </div>
    </section>

    <!-- ================= DOCK DU BAS (style Cities: Skylines) ================= -->
    <div class="dock">
      <!-- <div class="status" id="status-bar" v-html="statusHtml"></div>-->

      <!-- Plateau d'outils de la catégorie active -->
      <div class="tray" id="tool-grid" v-show="uiTool !== 'edit'">
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
                :class="{ active: activeCat === c.id && uiTool !== 'edit' }" :title="c.label" @click="onCategoryClick(c.id)">
          <span class="ico">{{ c.icon }}</span>
          <span class="lbl">{{ c.label }}</span>
        </button>

        <!-- Éditer : remplace l'ancienne catégorie « Outils » -->
        <button class="cat-btn edit-cat" :class="{ active: uiTool === 'edit' }" title="Éditer un élément" @click="onToolClick('edit')">
          <span class="ico">🔨</span>
          <span class="lbl">Éditer</span>
        </button>

        <!-- Afficher / masquer les éléments déjà ajoutés -->
        <button class="cat-btn visibility-cat" :class="{ off: !elementsVisible }"
                :title="elementsVisible ? 'Masquer les éléments ajoutés' : 'Afficher les éléments ajoutés'"
                @click="toggleElementsVisible">
          <span class="ico">{{ elementsVisible ? '👁️' : '🙈' }}</span>
          <span class="lbl">{{ elementsVisible ? 'Masquer' : 'Afficher' }}</span>
        </button>

        <span class="sep"></span>
        
        <button class="action-btn clear-all" id="btn-clear-all" @click="clearAll" title="Effacer tout le projet">💥 Tout Supprimer</button>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, reactive, onBeforeUnmount } from 'vue'

import {
  initGeometry,
  cp,
  dist,
  minDistToSegments,
  pointInPolygon,
} from "./geometry.ts";
import type { LatLngLike } from "./geometry.ts";

import {
  initRender,
  resizeOverlay,
  draw
} from "./render.ts";
import type { MapElement, ElementType, Direction } from "./render.ts";

import L from 'leaflet'
import 'leaflet/dist/leaflet.css'

/* ============================================================
   TYPES LOCAUX
   ============================================================ */
interface DrawnElement extends MapElement {
  id: number
}

type ToolMode = 'line' | 'polygon' | 'point' | 'twopoint' | 'edit' | 'branch'

interface ToolConfig {
  label: string
  mode: ToolMode
  minPoints: number
}

interface ToolInfo {
  id: string
  icon: string
  label: string
  cls?: string
}

interface Category {
  id: string
  icon: string
  label: string
  tools: ToolInfo[]
}

type SettingValue = string | number | boolean

interface Field {
  id: string
  /** Propriété de MapElement modifiée en mode édition */
  prop: keyof MapElement
  label: string
  type: 'number' | 'color' | 'checkbox' | 'select'
  def: SettingValue
  min?: number
  max?: number
  step?: number
  // (string | null)[] : le template appelle f.tools.includes(uiTool) avec uiTool nullable
  tools: readonly (string | null)[]
  options?: [string, string][]
}

const TILE_URL = 'https://{s}.google.com/vt/lyrs=s&x={x}&y={y}&z={z}'
const TILE_OPTS: L.TileLayerOptions = { maxZoom: 21, maxNativeZoom: 21, subdomains: ['mt0', 'mt1', 'mt2', 'mt3'], attribution: 'Imagerie &copy; Google' }

const root = ref<HTMLElement | null>(null)
const mapEl = ref<HTMLElement | null>(null)

let map: L.Map | null = null
let overlay: HTMLCanvasElement | null = null
let ctx: CanvasRenderingContext2D | null = null

/* ============================================================
   ÉTAT RÉACTIF (UI uniquement)
   ============================================================ */
const uiTool = ref<string | null>(null)   // outil actif (miroir de currentTool)
const activeCat = ref('voirie')           // catégorie ouverte dans le dock
const showLegend = ref(false)
const statusHtml = ref('')
const hasSelection = ref(false)
const selectedZ = ref(0)
const selectedType = ref('')          // libellé du type sélectionné
const selectedTypeId = ref('')        // id du type sélectionné (ex. 'route')
const elementsVisible = ref(true)    // false = éléments ajoutés masqués
const editRev = ref(0)                // force le rafraîchissement du panneau après modification

/* ============================================================
   CATÉGORIES DU DOCK (mêmes icônes qu'avant)
   ============================================================ */
const categories: Category[] = [
  { id: 'voirie', icon: '🛣️', label: 'Voiries', tools: [
    { id: 'route',         icon: '🛣️', label: 'Route' },
    { id: 'rond_point',    icon: '⭕', label: 'Rond-point' },
    { id: 'piste_cyclable', icon: '🚴', label: 'Piste cycl.' },
    { id: 'chemin_pieton',  icon: '🧱', label: 'Chemin piéton' },
    { id: 'rails_tramway', icon: '🚊', label: 'Rails Tramway'},
    { id: 'branch', icon: '🔀', label: 'Ajouter une branche', cls: 'branch-btn' }
  ]},
  { id: 'zones', icon: '⬚', label: 'Zone', tools: [
    { id: 'hachures',      icon: '▨', label: 'Zébras / Hachures' },
    { id: 'espace_vert', icon: '🌿', label: 'Espace vert' },
    { id: 'eau', icon: '💧', label: 'Eau' },
    { id: 'zone_pietonne', icon: '🚸', label: 'Zone Pietonne'},
    { id: 'chaussee', icon: '🛣️', label: 'Chaussée'},
  ]},
  { id: 'marquages', icon: '🖌️', label: 'Marquages', tools: [
    { id: 'passage_pieton',   icon: '🚶', label: 'Pass. piéton' },
    { id: 'cedez_le_passage', icon: '🔻', label: 'Cédez-le-passage' },
    { id: 'ligne_stop',       icon: '🛑', label: 'Ligne de stop' },
    { id: 'stop_sol',         icon: '🅢', label: 'STOP au sol' },
    { id: 'ligne_continue',  icon: '━', label: 'Ligne Continue' },
    { id: 'ligne_discontinue', icon: '- - -', label: 'Ligne Discontinue' },
    { id: 'fleche_sol',       icon: '⬆️', label: 'Flèche directionnelle' },
    { id: 'bande_cyclable', icon: '🚲', label: 'Bande cyclable' },
    { id: 'chevron_velo',   icon: '˄˄', label: 'Chevrons vélo' },
    { id: 'rue_cyclable',   icon: 'Ⓑ', label: 'Rue cyclable' },
    { id: 'stationnement', icon: '🅿️', label: 'Stationnement' },
    { id: 'arret_bus', icon: '🚏', label: 'Arrêt Bus'},
    { id: 'voie_bus', icon: '🚌', label: 'Voie Bus'}
  ]},
  { id: 'signal', icon: '🚦', label: 'Signalisations', tools: [
    { id: 'feu_tricolore',  icon: '🚦', label: 'Feu tricolore' },
    { id: 'feu_clignotant', icon: '🟡', label: 'Feu clignotant' },
  ]},
  { id: 'batiments', icon: '🏢', label: 'Bâtiments', tools: [
    { id: 'batiment', icon: '🏬', label: 'Bâtiment'},
    { id: 'entree_metro', icon: 'Ⓜ️', label: 'Entrée Metro'},
  ]},
  { id: 'vehicules', icon: '🚗', label: 'Véhicules', tools: [
    { id: 'vehicule', icon: '🚙', label: 'Voiture'},
    { id: 'camion', icon: '🚛', label: 'Camion'},
    { id: 'bus', icon: '🚌', label: 'Bus'},
    { id: 'tramway', icon: '🚊', label: 'Tramway'},
    { id: 'deux_roues', icon: '🛵', label: 'Deux Roues'},
    { id: 'velo', icon: '🚴', label: 'Vélo'}
  ]},
  { id: 'parc', icon: '🏞️', label: 'Parc', tools: [
    { id: 'arbre', icon: '🌲', label: 'Arbre isolé' },
  ]},
  { id: 'mobilier_urbain', icon: '🏙️', label: 'Mobilier Urbain', tools: [
    { id: 'banc_public', icon: '🪑', label: 'Banc Public' },
    { id: 'eclairage_public', icon: '💡', label: 'Éclairage public'}, 
    { id: 'parking_velo', icon: '🚲', label: 'Parking Vélo' },
    { id: 'fontaine', icon: '⛲', label: 'Fontaine'},
  ]},
]

const toolsById: Record<string, ToolInfo & { cat: string }> = {}
categories.forEach(c => c.tools.forEach(t => { toolsById[t.id] = { ...t, cat: c.id } }))

const currentCategory = computed<Category>(
  () => categories.find(c => c.id === activeCat.value) ?? categories[0]!
)
const EDIT_INFO = { icon: '🔨', label: 'Éditer' }
const activeToolInfo = computed<{ icon: string; label: string }>(() => {
  if (uiTool.value === 'edit') {
    const t = selectedTypeId.value ? toolsById[selectedTypeId.value] : undefined
    return t ? { icon: t.icon, label: `Éditer : ${t.label}` } : EDIT_INFO
  }
  return (uiTool.value && toolsById[uiTool.value]) || { icon: '', label: '' }
})

/* ============================================================
   PROPRIÉTÉS PAR TYPE
   Les id sont identiques à l'ancienne version (render.js peut
   donc continuer à lire byId('set-...')).
   ============================================================ */
const ROUTE_TOOLS = ['route', 'branch']
const SMOOTH_TOOLS = ['route', 'branch', 'piste_cyclable', 'chemin_pieton', 'bande_cyclable', 'rue_cyclable', 'stationnement', 'rails_tramway', 'voie_bus', 'ligne_continue', 'ligne_discontinue']
const LINE_TOOLS = ['ligne_continue', 'ligne_discontinue']
const CYCLE_TOOLS = ['piste_cyclable', 'bande_cyclable']
/* Voiries / tracés qui acceptent le choix de terminaison (ronde ou carrée nette) */
const LINECAP_TOOLS = ['route', 'branch', 'piste_cyclable', 'chemin_pieton', 'bande_cyclable', 'rails_tramway', 'voie_bus']
const VEHICLE_TOOLS = ['vehicule', 'camion', 'bus', 'tramway', 'deux_roues', 'velo']

const settingsValues = reactive<Record<string, SettingValue>>({
  'set-smooth-curves': false,
  'set-route-width': 6,
  'set-route-lanes': 2,
  'set-route-direction': 'bidirectional',
  'set-linecap': 'round',
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
  'set-tree-radius': 2.2,
  // --- nouveaux outils ---
  'set-tram-width': 3,
  'set-bus-lane-width': 3.5,
  'set-building-height': 12,
  'set-fountain-radius': 1.5,
  'set-vehicle-color': '#4a6fa5',
  'set-line-width': 0.15,
  'set-line-color': '#ffffff',
  'set-dash-length': 3,
  'set-dash-gap': 3.5
})

const fields: Field[] = [
  // Commun aux tracés
  { id: 'set-smooth-curves', prop: 'smooth', label: 'Lissage des tracés (courbes de Bézier)', type: 'checkbox', def: false, tools: SMOOTH_TOOLS },

  // Route (et branche, qui crée une route)
  { id: 'set-route-width',     prop: 'width',     label: 'Largeur route (m)', type: 'number', def: 6, min: 2, max: 20, step: 0.5, tools: ROUTE_TOOLS },
  { id: 'set-route-lanes',     prop: 'lanes',     label: 'Nombre de voies',   type: 'number', def: 2, min: 1, max: 6,  step: 1,   tools: ROUTE_TOOLS },
  { id: 'set-route-direction', prop: 'direction', label: 'Sens de circulation', type: 'select', def: 'bidirectional', tools: ROUTE_TOOLS,
    options: [['bidirectional', 'Bidirectionnelle'], ['unidirectional', 'Sens unique']] },
  { id: 'set-linecap',         prop: 'lineCap',   label: 'Terminaison du tracé', type: 'select', def: 'round', tools: LINECAP_TOOLS,
    options: [['round', 'Ronde'], ['butt', 'Carrée (nette)']] },

  // Rond-point
  { id: 'set-roundabout-radius', prop: 'radius', label: 'Rayon rond-point (m)',  type: 'number', def: 12, min: 5, max: 40, step: 1, tools: ['rond_point'] },
  { id: 'set-roundabout-lanes',  prop: 'lanes',  label: 'Voies du rond-point',   type: 'number', def: 2,  min: 1, max: 4,  step: 1, tools: ['rond_point'] },

  // Zébras
  { id: 'set-hatch-width', prop: 'hatchWidth',  label: 'Largeur zébras (m)', type: 'number', def: 1.5, min: 0.5, max: 4, step: 0.25, tools: ['hachures'] },
  { id: 'set-hatch-style', prop: 'cornerStyle', label: 'Forme zébras', type: 'select', def: 'straight', tools: ['hachures'],
    options: [['straight', 'Angles droits (Net)'], ['smooth', 'Arrondis']] },

  // Piste / bande cyclable
  { id: 'set-cycle-width',     prop: 'width',     label: 'Largeur piste cyclable (m)', type: 'number', def: 2, min: 1, max: 6, step: 0.5, tools: CYCLE_TOOLS },
  { id: 'set-cycle-color',     prop: 'color',     label: 'Couleur piste cyclable',     type: 'color',  def: '#3c8a3c', tools: CYCLE_TOOLS },
  { id: 'set-cycle-direction', prop: 'direction', label: 'Sens piste cyclable', type: 'select', def: 'unidirectional', tools: CYCLE_TOOLS,
    options: [['unidirectional', 'Unidirectionnelle'], ['bidirectional', 'Bidirectionnelle']] },

  // Chemin piéton
  { id: 'set-ped-width', prop: 'width', label: 'Largeur chemin piéton (m)', type: 'number', def: 2.5, min: 1, max: 8, step: 0.5, tools: ['chemin_pieton'] },

  // Stationnement
  { id: 'set-park-layout', prop: 'layout', label: 'Type stationnement', type: 'select', def: 'bataille', tools: ['stationnement'],
    options: [['bataille', 'Bataille (90°)'], ['epi', 'Épi (45°)'], ['creneau', 'Créneau (Parallèle)']] },
  { id: 'set-park-depth', prop: 'depth', label: 'Profondeur place (m)', type: 'number', def: 5,   min: 1.5, max: 8, step: 0.5, tools: ['stationnement'] },
  { id: 'set-park-bay',   prop: 'bay',   label: 'Largeur place (m)',    type: 'number', def: 2.5, min: 1.5, max: 5, step: 0.1, tools: ['stationnement'] },

  // Passage piéton
  { id: 'set-cross-span',   prop: 'span',        label: 'Largeur passage piéton (m)', type: 'number', def: 3.5, min: 2,   max: 10, step: 0.5, tools: ['passage_pieton'] },
  { id: 'set-cross-stripe', prop: 'stripeWidth', label: 'Largeur bandes piéton (m)',  type: 'number', def: 0.5, min: 0.3, max: 1,  step: 0.1, tools: ['passage_pieton'] },

  // Flèche au sol
  { id: 'set-arrow-type', prop: 'arrowType', label: 'Type de flèche au sol', type: 'select', def: 'tout_droit', tools: ['fleche_sol'],
    options: [
      ['tout_droit', 'Tout droit'], ['gauche', 'Tourne à gauche'], ['droite', 'Tourne à droite'],
      ['tout_droit_gauche', 'Tout droit + gauche'], ['tout_droit_droite', 'Tout droit + droite']
    ] },

  // Arbre
  { id: 'set-tree-radius', prop: 'radius', label: 'Rayon houppier arbre (m)', type: 'number', def: 2.2, min: 1, max: 8, step: 0.2, tools: ['arbre'] },

  // Tramway / bus / bâtiment / fontaine / véhicules
  { id: 'set-tram-width',      prop: 'width',  label: 'Largeur plateforme tramway (m)', type: 'number', def: 3,   min: 1.4, max: 6,   step: 0.1, tools: ['rails_tramway'] },
  { id: 'set-bus-lane-width',  prop: 'width',  label: 'Largeur voie de bus (m)',        type: 'number', def: 3.5, min: 2.5, max: 6,   step: 0.5, tools: ['voie_bus'] },
  { id: 'set-building-height', prop: 'height', label: 'Hauteur bâtiment (m)',           type: 'number', def: 12,  min: 3,   max: 100, step: 1,   tools: ['batiment'] },
  { id: 'set-fountain-radius', prop: 'radius', label: 'Rayon fontaine (m)',             type: 'number', def: 1.5, min: 0.5, max: 8,   step: 0.5, tools: ['fontaine'] },
  { id: 'set-vehicle-color',   prop: 'color',  label: 'Couleur du véhicule',            type: 'color',  def: '#4a6fa5', tools: VEHICLE_TOOLS },

  // Lignes continue / discontinue
  { id: 'set-line-width',  prop: 'width',      label: 'Épaisseur de la ligne (m)', type: 'number', def: 0.15, min: 0.05, max: 1,  step: 0.05, tools: LINE_TOOLS },
  { id: 'set-line-color',  prop: 'color',      label: 'Couleur de la ligne',       type: 'color',  def: '#ffffff', tools: LINE_TOOLS },
  { id: 'set-dash-length', prop: 'dashLength', label: 'Longueur des tirets (m)',   type: 'number', def: 3,   min: 0.5,  max: 10, step: 0.5,  tools: ['ligne_discontinue'] },
  { id: 'set-dash-gap',    prop: 'dashGap',    label: 'Espacement des tirets (m)', type: 'number', def: 3.5, min: 0.5,  max: 15, step: 0.5,  tools: ['ligne_discontinue'] },
]

const hasFieldsForTool = computed(() => fields.some(f => f.tools.includes(uiTool.value)))
/** Vrai si l'élément sélectionné (mode édition) a au moins un paramètre réglable */
const hasEditFields = computed(() => !!selectedTypeId.value && fields.some(f => f.tools.includes(selectedTypeId.value)))

/* ============================================================
   DONNÉES & ÉTAT (moteur de dessin)
   ============================================================ */
let elements: DrawnElement[] = []
let idCounter = 1
let currentTool: string | null = null
let drawingPoints: LatLngLike[] = []
let mousePos: LatLngLike | null = null
let selectedElementForEdit: DrawnElement | null = null
let draggedVertexIndex: number | null = null
let branchSourceNode: LatLngLike | null = null

const toolConfig: Record<string, ToolConfig> = {
  // Voirie
  route:           {label:'Route',            mode:'line',    minPoints:2},
  piste_cyclable:  {label:'Piste cycl.',      mode:'line',    minPoints:2},
  chemin_pieton:   {label:'Chemin piéton',    mode:'line',    minPoints:2},
  rond_point:      {label:'Rond-point',       mode:'point',   minPoints:1},
  rails_tramway:   {label:'Rails Tramway',    mode:'line',    minPoints:2},
  voie_bus:        {label:'Voie Bus',         mode:'line',    minPoints:2},

  // Zones
  hachures:        {label:'Zébras / Hachures',mode:'polygon', minPoints:3},
  espace_vert:     {label:'Espace vert',      mode:'polygon', minPoints:3},
  massif:          {label:'Massif',           mode:'polygon', minPoints:3},
  eau:             {label:'Eau',              mode:'polygon', minPoints:3},
  zone_pietonne:   {label:'Zone piétonne',    mode:'polygon', minPoints:3},
  chaussee:        {label:'Chaussée',         mode:'polygon', minPoints:3},

  // Marquages
  stationnement:   {label:'Stationnement',    mode:'line',    minPoints:2},
  ligne_continue:  {label:'Ligne continue',   mode:'line',    minPoints:2},
  ligne_discontinue:{label:'Ligne discontinue',mode:'line',   minPoints:2},
  passage_pieton:  {label:'Pass. piéton',     mode:'twopoint',minPoints:2},
  cedez_le_passage:{label:'Cédez-le-passage', mode:'twopoint',minPoints:2},
  ligne_stop:      {label:'Ligne de stop',    mode:'twopoint',minPoints:2},
  stop_sol:        {label:'STOP au sol',      mode:'twopoint',minPoints:2},
  fleche_sol:      {label:'Flèche au sol',    mode:'twopoint',minPoints:2},
  bande_cyclable:  {label:'Bande cyclable',   mode:'line',    minPoints:2},
  chevron_velo:    {label:'Chevron vélo',     mode:'twopoint',minPoints:2},
  rue_cyclable:    {label:'Rue cyclable',     mode:'line',    minPoints:2},
  arret_bus:       {label:'Arrêt Bus',        mode:'twopoint',minPoints:2},

  // Signalisation
  feu_tricolore:   {label:'Feu tricolore',    mode:'point',   minPoints:1},
  feu_clignotant:  {label:'Feu clignotant',   mode:'point',   minPoints:1},

  // Bâtiments
  batiment:        {label:'Bâtiment',         mode:'polygon', minPoints:3},
  entree_metro:    {label:'Entrée Métro',     mode:'point',   minPoints:1},

  // Véhicules (point d'arrière + point indiquant le sens)
  vehicule:        {label:'Voiture',          mode:'twopoint',minPoints:2},
  camion:          {label:'Camion',           mode:'twopoint',minPoints:2},
  bus:             {label:'Bus',              mode:'twopoint',minPoints:2},
  tramway:         {label:'Tramway',          mode:'twopoint',minPoints:2},
  deux_roues:      {label:'Deux roues',       mode:'twopoint',minPoints:2},
  velo:            {label:'Vélo',             mode:'twopoint',minPoints:2},

  // Parc
  arbre:           {label:'Arbre isolé',      mode:'point',   minPoints:1},

  // Mobilier urbain
  banc_public:     {label:'Banc public',      mode:'twopoint',minPoints:2},
  eclairage_public:{label:'Éclairage public', mode:'point',   minPoints:1},
  parking_velo:    {label:'Parking vélo',     mode:'twopoint',minPoints:2},
  fontaine:        {label:'Fontaine',         mode:'point',   minPoints:1},

  // Outils
  edit:            {label:'Éditer',           mode:'edit',    minPoints:0},
  branch:          {label:'Branche',          mode:'branch',  minPoints:1}
}

const instructions: Record<string, string> = {
  route:          'Cliquez pour placer les points de la route. Validez avec Entrée (ou double-clic).',
  piste_cyclable: 'Cliquez pour tracer la piste cyclable. Validez avec Entrée.',
  chemin_pieton:  'Cliquez pour tracer le chemin piéton (dallage). Validez avec Entrée.',
  rond_point:     'Cliquez sur la carte pour placer le centre du rond-point.',
  rails_tramway:  'Cliquez pour tracer les rails de tramway. Validez avec Entrée.',
  voie_bus:       'Cliquez pour tracer la voie de bus. Validez avec Entrée.',
  hachures:       'Cliquez pour tracer les contours de la zone de zébras (3 points min). Validez avec Entrée.',
  stationnement:  'Cliquez le long de la voie où placer les places de stationnement. Validez avec Entrée.',
  espace_vert:    'Cliquez pour dessiner le contour de la zone végétalisée (3 points min). Validez avec Entrée.',
  massif:         'Cliquez pour dessiner le contour du massif arbustif. Validez avec Entrée.',
  eau:            'Cliquez pour dessiner le contour du plan d\'eau (3 points min). Validez avec Entrée.',
  zone_pietonne:  'Cliquez pour dessiner la zone piétonne (3 points min). Validez avec Entrée.',
  chaussee:       'Cliquez pour dessiner la surface de chaussée (3 points min). Validez avec Entrée.',
  ligne_continue: 'Cliquez pour tracer la ligne continue. Validez avec Entrée (ou double-clic).',
  ligne_discontinue: 'Cliquez pour tracer la ligne discontinue. Validez avec Entrée (ou double-clic).',
  passage_pieton: 'Cliquez le point de départ puis le point d\'arrivée du passage piéton (2 clics).',
  cedez_le_passage:'Cliquez les deux extrémités de la ligne de cédez-le-passage (2 clics).',
  ligne_stop:     'Cliquez les deux extrémités de la ligne de stop continue (2 clics).',
  stop_sol:       'Cliquez le point de départ puis un point indiquant le sens de circulation (2 clics).',
  fleche_sol:     'Cliquez le point de départ (arrière de la flèche) puis un point indiquant le sens de circulation (2 clics).',
  bande_cyclable: 'Cliquez pour tracer la bande cyclable peinte sur chaussée. Validez avec Entrée.',
  chevron_velo:   'Cliquez le point de départ puis un point indiquant le sens de circulation (2 clics).',
  rue_cyclable:   'Cliquez pour tracer l\'axe de la rue cyclable (pictogrammes répétés). Validez avec Entrée.',
  arret_bus:      'Cliquez les deux extrémités de l\'arrêt de bus (2 clics).',
  feu_tricolore:  'Cliquez sur le bord de la route pour positionner le feu tricolore.',
  feu_clignotant: 'Cliquez sur la carte pour positionner le feu clignotant.',
  batiment:       'Cliquez pour dessiner l\'emprise du bâtiment (3 points min). Validez avec Entrée.',
  entree_metro:   'Cliquez sur la carte pour placer l\'entrée de métro.',
  vehicule:       'Cliquez l\'arrière du véhicule puis un point indiquant son sens (2 clics).',
  camion:         'Cliquez l\'arrière du camion puis un point indiquant son sens (2 clics).',
  bus:            'Cliquez l\'arrière du bus puis un point indiquant son sens (2 clics).',
  tramway:        'Cliquez l\'arrière du tramway puis un point indiquant son sens (2 clics).',
  deux_roues:     'Cliquez l\'arrière du deux-roues puis un point indiquant son sens (2 clics).',
  velo:           'Cliquez l\'arrière du vélo puis un point indiquant son sens (2 clics).',
  arbre:          'Cliquez sur la carte pour planter un arbre.',
  banc_public:    'Cliquez les deux extrémités du banc (2 clics).',
  eclairage_public:'Cliquez sur la carte pour placer le lampadaire.',
  parking_velo:   'Cliquez les deux extrémités de l\'arceau / rangée de vélos (2 clics).',
  fontaine:       'Cliquez sur la carte pour placer la fontaine.',
  edit:           'Cliquez sur un élément pour afficher ses propriétés, ajuster sa géométrie, sa valeur Z ou le supprimer.',
  branch:         'Survolez et cliquez sur un nœud d\'un chemin existant pour y démarrer une nouvelle branche.'
}

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

/* Types dont la géométrie est un point unique / un polygone (utilisés pour la sélection) */
const POINT_TYPES = ['arbre', 'feu_tricolore', 'feu_clignotant', 'rond_point', 'entree_metro', 'eclairage_public', 'fontaine']
const POLYGON_TYPES = ['espace_vert', 'massif', 'hachures', 'eau', 'zone_pietonne', 'chaussee', 'batiment']
/* Tracés sur lesquels on peut démarrer une branche */
const BRANCHABLE_TYPES = ['route', 'piste_cyclable', 'chemin_pieton', 'voie_bus', 'rails_tramway']

/* ============================================================
   ACCÈS AU DOM (limité au composant)
   ============================================================ */
function byId(id: string): HTMLInputElement {
  return root.value!.querySelector<HTMLInputElement>('#' + id)!
}

/* ============================================================
   ANIMATION DES FEUX CLIGNOTANTS
   ============================================================ */
let blinkState = true
let blinkAnimationId: number | null = null
let blinkTimeoutId: ReturnType<typeof setTimeout> | null = null

function animateBlinkingLights(): void {
  blinkState = !blinkState
  draw()
  blinkAnimationId = requestAnimationFrame(() => {
    blinkTimeoutId = setTimeout(animateBlinkingLights, 500)
  })
}

/* ============================================================
   SÉLECTION (synchronise l'état réactif de l'UI)
   ============================================================ */
function setSelected(el: DrawnElement | null): void {
  selectedElementForEdit = el
  hasSelection.value = !!el
  selectedTypeId.value = el ? el.type : ''
  if(el){
    if(el.z === undefined) el.z = zOrderBase[el.type] || 0
    selectedZ.value = el.z
    selectedType.value = toolsById[el.type]?.label ?? el.type
  } else {
    selectedType.value = ''
  }
  editRev.value++
}

function onZInput(e: Event): void {
  if(selectedElementForEdit){
    selectedElementForEdit.z = parseInt((e.target as HTMLInputElement).value) || 0
    selectedZ.value = selectedElementForEdit.z
    draw()
  }
}

/* ============================================================
   CHAMPS DU PANNEAU : réglages de placement OU propriétés de l'élément édité
   ============================================================ */
function isFieldVisible(f: Field): boolean {
  if(uiTool.value === 'edit') return !!selectedTypeId.value && f.tools.includes(selectedTypeId.value)
  return f.tools.includes(uiTool.value)
}

function fieldValue(f: Field): SettingValue {
  if(uiTool.value === 'edit'){
    void editRev.value                       // dépendance réactive
    const el = selectedElementForEdit
    if(!el) return f.def
    const v = (el as unknown as Record<string, unknown>)[f.prop]
    return (typeof v === 'string' || typeof v === 'number' || typeof v === 'boolean') ? v : f.def
  }
  return settingsValues[f.id] ?? f.def
}

const fieldText = (f: Field): string | number => {
  const v = fieldValue(f)
  return typeof v === 'boolean' ? '' : v
}
const fieldChecked = (f: Field): boolean => fieldValue(f) === true

function setFieldValue(f: Field, v: SettingValue): void {
  if(uiTool.value === 'edit'){
    const el = selectedElementForEdit
    if(!el) return
    ;(el as unknown as Record<string, SettingValue>)[f.prop] = v
    editRev.value++
  } else {
    settingsValues[f.id] = v
  }
  draw()
}

function onFieldInput(f: Field, e: Event): void {
  const t = e.target as HTMLInputElement
  let v: SettingValue
  if(f.type === 'checkbox') v = t.checked
  else if(f.type === 'number'){
    const n = parseFloat(t.value)
    if(Number.isNaN(n)) return
    v = n
  } else v = t.value
  setFieldValue(f, v)
}

/* ============================================================
   OUTILS / INTERACTIONS
   ============================================================ */
const num = (id: string): number => settingsValues[id] as number
const str = (id: string): string => settingsValues[id] as string
const bool = (id: string): boolean => settingsValues[id] as boolean

function readSettingsForType(type: ElementType): Partial<MapElement> {
  switch(type){
    case 'route': return {
      width: num('set-route-width'),
      lanes: num('set-route-lanes'),
      direction: str('set-route-direction') as Direction,
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'piste_cyclable': return {
      width: num('set-cycle-width'),
      color: str('set-cycle-color'),
      direction: str('set-cycle-direction') as Direction,
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'chemin_pieton': return {
      width: num('set-ped-width'),
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'bande_cyclable': return {
      width: num('set-cycle-width'),
      color: str('set-cycle-color'),
      direction: str('set-cycle-direction') as Direction,
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'rue_cyclable': return { smooth: bool('set-smooth-curves') }
    case 'fleche_sol': return { arrowType: str('set-arrow-type') as MapElement['arrowType'] }
    case 'rond_point': return {
      radius: num('set-roundabout-radius'),
      lanes: num('set-roundabout-lanes')
    }
    case 'hachures': return {
      hatchWidth: num('set-hatch-width'),
      cornerStyle: str('set-hatch-style') as MapElement['cornerStyle']
    }
    case 'stationnement': return {
      layout: str('set-park-layout') as MapElement['layout'],
      bay: num('set-park-bay'),
      depth: num('set-park-depth'),
      smooth: bool('set-smooth-curves')
    }
    case 'passage_pieton': return {
      span: num('set-cross-span'),
      stripeWidth: num('set-cross-stripe')
    }
    case 'arbre': return { radius: num('set-tree-radius') }

    case 'ligne_continue': return {
      width: num('set-line-width'),
      color: str('set-line-color'),
      smooth: bool('set-smooth-curves')
    }
    case 'ligne_discontinue': return {
      width: num('set-line-width'),
      color: str('set-line-color'),
      dashLength: num('set-dash-length'),
      dashGap: num('set-dash-gap'),
      smooth: bool('set-smooth-curves')
    }

    // --- nouveaux outils ---
    case 'rails_tramway': return {
      width: num('set-tram-width'),
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'voie_bus': return {
      width: num('set-bus-lane-width'),
      lineCap: str('set-linecap') as CanvasLineCap,
      smooth: bool('set-smooth-curves')
    }
    case 'batiment': return { height: num('set-building-height') }
    case 'fontaine': return { radius: num('set-fountain-radius') }
    case 'vehicule':
    case 'camion':
    case 'bus':
    case 'tramway':
    case 'deux_roues':
    case 'velo': return { color: str('set-vehicle-color') }

    default: return {}
  }
}

function addElement(type: ElementType, coords: LatLngLike[]): void {
  const settings = readSettingsForType(type)
  const zVal = zOrderBase[type] !== undefined ? zOrderBase[type] : 0
  elements.push(Object.assign({id: idCounter++, type, coords, z: zVal}, settings))
  elementsVisible.value = true   // un nouvel élément doit être visible
  draw()
}

function onCategoryClick(id: string): void {
  activeCat.value = id
  if(currentTool === 'edit') selectTool(null)
}

function onToolClick(id: string): void {
  selectTool(currentTool === id ? null : id)
}

function toggleElementsVisible(): void {
  elementsVisible.value = !elementsVisible.value
  if(!elementsVisible.value){
    setSelected(null)            // rien à éditer tant que tout est masqué
    updateStatus()
  }
  draw()
}

function selectTool(name: string | null): void {
  currentTool = name
  uiTool.value = name
  if(name) elementsVisible.value = true   // travailler sur les éléments nécessite de les voir
  drawingPoints = []
  if(name && toolsById[name]) activeCat.value = toolsById[name].cat
  if(name !== 'edit'){ setSelected(null) }
  if(name !== 'branch'){ branchSourceNode = null }
  if(map) map.getContainer().style.cursor = name ? 'crosshair' : ''
  updateStatus()
  draw()
}

function updateStatus(): void {
  if(!currentTool){ statusHtml.value = 'Choisissez une catégorie, puis un équipement ou un marquage dans le dock.'; return }
  let txt = instructions[currentTool] || ''
  if(currentTool === 'edit' && selectedElementForEdit){
    txt = `Élément sélectionné (Type: ${selectedElementForEdit.type}, Z: ${selectedElementForEdit.z}). Glissez une poignée ou ajustez la valeur Z dans le panneau.`
  } else if(currentTool === 'branch' && branchSourceNode){
    txt = 'Nœud de départ sélectionné. Cliquez sur la carte pour tracer la nouvelle branche. Validez avec Entrée.'
  } else if(  drawingPoints.length > 0 && toolConfig[currentTool]?.mode !== 'point' && toolConfig[currentTool] !== undefined){
    txt += ` <strong>${drawingPoints.length}</strong> point(s) placé(s).`
  }
  statusHtml.value = txt
}

function finalizeDrawing(): void {
  if(!currentTool) return
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
  const targetType = (currentTool === 'branch' ? 'route' : currentTool) as ElementType
  addElement(targetType, drawingPoints.slice())
  drawingPoints = []
  branchSourceNode = null
  updateStatus()
  draw()
}

function cancelDrawing(): void {
  drawingPoints = []
  setSelected(null)
  branchSourceNode = null
  updateStatus()
  draw()
}

function clearAll(): void {
  if(elements.length===0) return
  if(confirm('Effacer tous les éléments du projet ? Cette action est irréversible.')){
    elements = []
    setSelected(null)
    branchSourceNode = null
    draw()
  }
}

/* Trouve l'élément le plus proche d'un point écran (factorisé : edit + delete) */
function findNearestElement(containerPoint: L.Point): DrawnElement | null {
  if(!elementsVisible.value) return null
  let best: DrawnElement | null = null
  let bestDist = 20

  for (const e of elements) {
    const pts = e.coords.map(cp)
    let d: number
    if (POINT_TYPES.includes(e.type)) {
      const first = pts[0]
      if (!first) continue
      d = dist(first, containerPoint)
    } else if (POLYGON_TYPES.includes(e.type)) {
      d = pointInPolygon(containerPoint, pts)
        ? 0
        : minDistToSegments(pts, containerPoint, true)
    } else {
      d = minDistToSegments(pts, containerPoint, false)
    }
    if (d < bestDist) {
      bestDist = d
      best = e
    }
  }
  return best
}

function deleteSelected(): void {
  const el = selectedElementForEdit
  if(!el) return
  elements = elements.filter(e => e !== el)
  setSelected(null)
  updateStatus()
  draw()
}

function onMapClick(ev: L.LeafletMouseEvent): void {
  if(!currentTool) return

  if(currentTool==='edit'){
    setSelected(findNearestElement(ev.containerPoint))
    updateStatus()
    draw()
    return
  }

  if(currentTool==='branch'){
    const cpPoint = ev.containerPoint
    if(!branchSourceNode){
      let foundNode: LatLngLike | null = null
      for(const e of elements){
        if(BRANCHABLE_TYPES.includes(e.type)){
          for(const coord of e.coords){
            if(dist(cp(coord), cpPoint) < 12) foundNode = coord
          }
        }
      }
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
  const p: LatLngLike = {lat: ev.latlng.lat, lng: ev.latlng.lng}

  if (!cfg) return

  if(cfg.mode==='point'){
    addElement(currentTool as ElementType, [p])
    return
  }

  drawingPoints.push(p)
  if(cfg.mode==='twopoint' && drawingPoints.length===2){
    finalizeDrawing()
  }
  updateStatus()
  draw()
}

function onMapMouseDown(ev: L.LeafletMouseEvent): void {
  if(currentTool !== 'edit' || !selectedElementForEdit) return
  const idx = selectedElementForEdit.coords.findIndex(c=> dist(cp(c), ev.containerPoint) < 12)
  if(idx !== -1){
    draggedVertexIndex = idx
    map?.dragging.disable()
  }
}

function onMapMouseMove(ev: L.LeafletMouseEvent): void {
  mousePos = {lat: ev.latlng.lat, lng: ev.latlng.lng}
  if(currentTool === 'edit' && selectedElementForEdit && draggedVertexIndex !== null){
    selectedElementForEdit.coords[draggedVertexIndex] = {lat: ev.latlng.lat, lng: ev.latlng.lng}
    draw()
  }
  if(drawingPoints.length>0) draw()
}

function onMapMouseUp(): void {
  if(draggedVertexIndex !== null){
    draggedVertexIndex = null
    map?.dragging.enable()
    draw()
  }
}

function onMapDblClick(): void {
  if (currentTool && ['line', 'polygon', 'branch'].includes(toolConfig[currentTool]?.mode ?? '')) {
    finalizeDrawing()
  }
}

function onKeyDown(ev: KeyboardEvent): void {
  const tag = (ev.target as HTMLElement | null)?.tagName
  if(tag === 'INPUT' || tag === 'SELECT' || tag === 'TEXTAREA') return
  if(ev.key === 'Delete' && currentTool === 'edit') deleteSelected()
  if(ev.key === 'Enter') finalizeDrawing()
  if(ev.key === 'Escape') cancelDrawing()
}

function onWindowResize(): void { if(map) map.invalidateSize() }

/* ============================================================
   CYCLE DE VIE VUE
   ============================================================ */
onMounted(()=>{
  const leafletMap = L.map(mapEl.value!, {
    doubleClickZoom: false,
    zoomControl: true,
    center: [48.8566, 2.3522],
    zoom: 19,
    maxZoom: 21
  })
  map = leafletMap
  L.tileLayer(TILE_URL, TILE_OPTS).addTo(leafletMap)
  // échelle à droite pour ne pas passer sous le dock centré
  L.control.scale({metric:true, imperial:false, position:'bottomright'}).addTo(leafletMap)

  const overlayEl = document.createElement('canvas')
  overlayEl.className = 'up-overlay-canvas'
  leafletMap.getContainer().appendChild(overlayEl)
  const context = overlayEl.getContext('2d')
  if(!context) throw new Error('Impossible de créer le contexte 2D du canvas')
  overlay = overlayEl
  ctx = context
  initGeometry({ map: leafletMap, ctx: context })

  initRender({
    overlay: overlayEl,
    map: leafletMap,
    ctx: context,
    getState: () => ({
      drawingPoints,
      elements,
      selectedElementForEdit,
      currentTool,
      toolConfig,
      mousePos,
      byId,
      showElements: elementsVisible.value
    })
  })

  animateBlinkingLights()

  leafletMap.on('resize', resizeOverlay)
  leafletMap.on('move', draw)
  leafletMap.on('moveend', draw)
  leafletMap.on('zoomstart', ()=>{ overlayEl.style.opacity = '0' })
  leafletMap.on('zoomend', ()=>{ overlayEl.style.opacity = '1'; draw() })
  leafletMap.on('click', onMapClick)
  leafletMap.on('mousedown', onMapMouseDown)
  leafletMap.on('mousemove', onMapMouseMove)
  leafletMap.on('mouseup', onMapMouseUp)
  leafletMap.on('dblclick', onMapDblClick)

  window.addEventListener('resize', onWindowResize)
  document.addEventListener('keydown', onKeyDown)

  updateStatus()
  leafletMap.whenReady(resizeOverlay)
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
<script setup lang="ts">
import { ref, defineAsyncComponent, onMounted, onBeforeUnmount } from 'vue'
import HomeView from './views/HomeView.vue'

/* Chargé à la demande : Leaflet et le moteur de dessin ne pèsent
   pas sur l'affichage de la page d'accueil. */
const EditorView = defineAsyncComponent(() => import('./views/EditorView.vue'))

type View = 'home' | 'editor'
const EDITOR_HASH = '#/editeur'

const view = ref<View>(location.hash === EDITOR_HASH ? 'editor' : 'home')

function syncFromHash(): void {
  view.value = location.hash === EDITOR_HASH ? 'editor' : 'home'
  window.scrollTo({ top: 0 })
}

function openEditor(): void {
  location.hash = EDITOR_HASH      // hashchange met la vue à jour
}

function goHome(): void {
  // retire le hash sans recharger la page
  history.pushState(null, '', location.pathname + location.search)
  syncFromHash()
}

onMounted(() => window.addEventListener('hashchange', syncFromHash))
onBeforeUnmount(() => window.removeEventListener('hashchange', syncFromHash))
</script>

<template>
  <HomeView v-if="view === 'home'" @start="openEditor" />

  <template v-else>
    <Suspense>
      <EditorView />
      <template #fallback>
        <div class="fixed inset-0 grid place-items-center bg-background text-on-surface-variant">
          Chargement de l'éditeur…
        </div>
      </template>
    </Suspense>

    <!-- Retour à l'accueil (haut centre : zone libre dans l'éditeur) -->
    <button
      type="button"
      class="fixed top-2.5 left-1/2 z-[1200] flex -translate-x-1/2 cursor-pointer items-center gap-1.5 rounded-lg border border-outline-variant bg-surface-container-low px-3 py-[7px] text-xs text-on-surface shadow-[0_2px_8px_rgb(0_0_0/0.15)] hover:border-primary-container hover:bg-surface-container-high focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
      title="Retour à l'accueil"
      @click="goHome"
    >
      <span class="material-symbols-outlined text-[16px]" aria-hidden="true">arrow_back</span>
      Accueil
    </button>
  </template>
</template>
<script setup>
const emit = defineEmits(['start'])

const fontDisplay = 'font-[family-name:Epilogue]'
const fontBody = 'font-[family-name:Plus_Jakarta_Sans]'

const IMAGES = {
  logo: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBrKoFtbFJZNFKo5wfr1zDN5y8L0vrPm4cCXhG1MK3h_UoWB0ZvRlJ-R7Mifgl0OMfExEwPB2QWRvr-ItPE81ytI_Iuf272s1SoLLeyT9qulU9dbGF4XtRs-a_oR9vpKITntgIHl0StfzwmrM2lwDnssuSr63Xzlh88548GfoMUPjnr-cVEtsvwbLfvPx_XtcM5bxKeAM1V7kD_BDDkyLhJIu26dSkxi8EHM3pmFO1QchScF9qvLVYS1DO16bKsgCMeN2iBPVX-8tsU3Zo',
  hero: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBTrJFnVmPAbZxsUElqTUNHQxeseuQCUyN0jUycfeauXw1Rvk7QXkDpWwyQ2srrOnLdNwDsBidGniakzk903GNSK12mUvfqBEfl9zbsubQuKuHa01v2HMqk8bBlWC8D1cdK01a8XqgKtPHbYbs90FqKeBxbkPKu2KocIIuenRix-GqodLpaHimncWFQPjVLXPAxf9Ebmxca3KRAgjGRoDkmmIG-9L-w0RamXvVs26j-',
  plan: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDS9aiArDO8IpfGvXhmfzC4HUnWyHg49io2CwS3zyGGASUZdSLCyNk3kUp70VAzlfVUVbE4YCYBl7awbZejaKu2cwihdhI05mp8cfxOUiur6vJphBSrGTGrhdzS-HkDKMKcqM0GVBACTe6JdRg1lnDiTJtXwV9xyW4FnBxzaRjg58Gdz2sqC3610tdjTv8XotD_rxybMaJs4wLbYhiMGxirB0jyCPgSnSoF-_KGLXmV2fNewADxmR6kDw',
  footerLogo: 'https://lh3.googleusercontent.com/aida/AEtjO1WBBfcio2h3CpNgCr9_3kPD4jOaDKVL-bJib87UN_UUJ3F9sh0-Ep28MmO6bzyYzV5r4cTUU7C1-yL3E3l5KIKgMclQMDq7mSNQfMESPL3PaQTOq8EZbD4H6sMH4TxRMPK20cJiBnAgtXpkKsPckTJdryNVGxIzT4w8ZtN7YumlrjYwtJ9Rslq3Jz1JiX_cMQFe5u_rX_GkRy68xinXjnqpsWZLuN4OCeKt8mBDdggbqA',
}

/* Repères du visuel principal avec identifiants d'icônes */
const reperes = [
  {
    num: '01', label: 'Canopée & Fraîcheur', icon: 'park',
    box: 'top-[4%] left-[4%]', color: 'text-primary', border: 'border-primary/30',
    d: 'M 140 70 L 140 220 L 180 290', cx: 180, cy: 290,
  },
  {
    num: '02', label: 'Piste cyclable sécurisée', icon: 'pedal_bike',
    box: 'top-[5%] left-[34%] sm:left-[38%]', color: 'text-secondary', border: 'border-secondary/30',
    d: 'M 440 75 L 400 75 L 385 410', cx: 385, cy: 410,
  },
  {
    num: '03', label: 'Continuité PMR & accessibilité', icon: 'accessible',
    box: 'top-[20%] right-[4%] sm:right-[7%]', color: 'text-primary-container', border: 'border-primary-container/30',
    d: 'M 740 160 L 630 160 L 560 435', cx: 560, cy: 435,
  },
  {
    num: '04', label: 'Inclusion intergénérationnelle', icon: 'chair',
    box: 'bottom-[6%] left-[4%]', color: 'text-tertiary', border: 'border-outline-variant',
    d: 'M 160 520 L 140 520 L 140 460', cx: 140, cy: 460,
  },
  {
    num: '05', label: 'Espace apaisé pour les plus jeunes', icon: 'sports_soccer',
    box: 'bottom-[14%] right-[3%] sm:right-[4%]', color: 'text-secondary', border: 'border-outline-variant',
    d: 'M 830 515 L 860 515 L 872 430', cx: 872, cy: 430,
  },
]

const piliers = [
  {
    title: 'Végétaliser', tag: 'Canopée & Vivant',
    text: 'Désimperméabiliser les sols pour rafraîchir les étés et ramener la biodiversité au pied des immeubles.',
    alt: 'Canopée et végétalisation',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDz9gXtBYPkbPabll8Jo4sB26btMCvPsSoWlcfJc1q8kikQAJ9zFaGWZ33q9uQUc4za3N9Cp3zIgQ_CHON_rhyqqPnxH8wtf9NrG3O8uKAYtq7CppL_KoNbhR-F-ByRfWHXTvSn0BXV2LOvu5RZ52SBsGvCcDjMu6UQ2q0I_AmOG-DIzX7QUpZQFnA9ONaOnMKGhhGo8hOIv4mnpgV4UzYMrrW4DppoD4E2q5p2CWEF7DdS_Y7oOEyJKNZ_4LUkh5zZgP3996vu2L68gSI',
    dot: 'bg-tertiary', tagColor: 'text-tertiary', hover: 'hover:border-tertiary/50',
  },
  {
    title: 'Apaiser', tag: 'Mobilité Douce',
    text: "Partager équitablement l'espace avec des voies cyclables séparées et des zones de rencontre sécurisées.",
    alt: 'Mobilité douce et zone apaisée',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuCnc4DdVYbOCh4dRstq82bBjk5ag5jMNb-GFWpIVmXXBpyjlO1bGh4vpHtmKb5sbfhXldVmvfkX21XGA-eEuDqMXOfP0WH-be_U2p1qJ6KH_W16bwrLpUTmxUoEIKjmaEGGeT63PQztCPYNWj8Uq6UK0WxDQjAkVeoY216M5v5a8hWT6GGNbF3wq7KYB4WkQiogS6nnGZFYB3O17SH53osecVq0lF2qiQQCMRB4TsW8isPy_9jhBLQZilajh4LbobWqkpUScIQusZqy7oU',
    dot: 'bg-secondary', tagColor: 'text-secondary', hover: 'hover:border-secondary/50',
  },
  {
    title: 'Inclure', tag: 'Accessibilité Universelle',
    text: 'Garantir le confort des poussettes, des personnes à mobilité réduite et des aînés sans aucun obstacle.',
    alt: 'Accessibilité universelle et confort PMR',
    img: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDtafmSI3HGjCIDA22emeJ4JqZqfy7IeTw4sCZQz5FD1OZhsrtbdEwLbL2ueJsTlZta-GoxZbFKoWcA7vGlPdNkz4H-Xghkt3ofy5u1STuJSY-iTvWMdRetC_wiOSvIxAcG9KxDHxZf9nfJhk8gLFcAzxr0j3bSNmLCqmLe4ADaBNRMYzHp6GsE3fQhi39c83AzeeqTFBGSVB6jeTuCeGv0fDvw3Kx2qeJX-ryNpLJnfhwnUj0OMCQ2dHXY27a07pnFszA1CZCuKL-xjKw',
    dot: 'bg-primary', tagColor: 'text-primary', hover: 'hover:border-primary/50',
  },
]

const etapesAtelier = [
  {
    step: 1,
    title: 'Repérer la zone',
    badge: 'Vue satellite',
    description:
      "Naviguez et zoomez sur l'imagerie aérienne jusqu'à la rue ou au carrefour à réaménager.",
  },
  {
    step: 2,
    title: 'Tracer la voirie',
    badge: 'Voiries',
    description:
      "Choisissez route, rond-point, piste cyclable, chemin piéton ou rails de tramway, cliquez pour placer les points puis validez avec Entrée. Une branche peut partir de n'importe quel nœud existant.",
  },
  {
    step: 3,
    title: "Compléter l'aménagement",
    badge: 'Marquages & mobilier',
    description:
      "Ajoutez passages piétons, lignes, flèches, feux, espaces verts, arbres, bancs, bâtiments et véhicules pour donner vie au plan.",
  },
  {
    step: 4,
    title: 'Ajuster chaque élément',
    badge: 'Édition',
    description:
      "En mode Éditer, sélectionnez un élément pour déplacer ses points, modifier ses réglages, changer son ordre Z, le dupliquer ou le supprimer.",
  },
]

const year = new Date().getFullYear()

function scrollToSection(id) {
  document.getElementById(id)?.scrollIntoView({ behavior: 'smooth', block: 'start' })
}
</script>

<template>
  <div :class="['min-h-screen bg-background text-on-background antialiased selection:bg-primary selection:text-on-primary', fontBody]">
    <!-- HEADER -->
    <header class="sticky top-0 z-50 w-full border-b border-outline-variant/50 bg-background/85 backdrop-blur-xl">
      <div class="mx-auto flex h-20 max-w-7xl items-center px-6 lg:px-16">
        <a href="#" class="group flex items-center gap-3" aria-label="CréaStreet – accueil">
          <img
            :src="IMAGES.logo"
            alt="CréaStreet - Atelier d'urbanisme"
            class="block h-14 w-auto object-contain transition-transform group-hover:scale-105 motion-reduce:transition-none motion-reduce:group-hover:scale-100"
          />
        </a>
      </div>
    </header>

    <main class="w-full">
      <!-- HERO -->
      <section class="mx-auto flex max-w-7xl flex-col items-center px-6 pt-16 pb-12 text-center lg:px-16 lg:pt-24 lg:pb-16">

        <h1 :class="[fontDisplay, 'mb-6 max-w-4xl text-4xl leading-[1.08] font-black tracking-tight text-on-surface sm:text-6xl lg:text-7xl']">
          Dessinez la rue <br class="hidden sm:inline" />
          <span class="text-primary italic underline decoration-secondary-container decoration-wavy decoration-2 underline-offset-8">de demain</span>.
        </h1>

        <p class="mb-10 max-w-2xl text-lg leading-relaxed text-on-surface-variant sm:text-xl">
          L'outil citoyen ouvert pour végétaliser, apaiser et rendre chaque quartier 100&nbsp;% accessible à tous.
        </p>

        <div class="flex w-full flex-col items-center justify-center gap-4 sm:w-auto sm:flex-row">
          <button
            type="button"
            class="inline-flex w-full cursor-pointer items-center justify-center gap-2.5 rounded-md border border-primary/40 bg-primary px-8 py-4 text-base font-semibold text-on-primary shadow-md transition-all hover:-translate-y-0.5 hover:bg-primary-container hover:shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:w-auto"
            @click="emit('start')"
          >
            Lancer l'application
            <!-- SVG Explore -->
            <svg class="size-5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm-1.5-5.5l5.5-2.5-2.5-5.5-5.5 2.5 2.5 5.5zm1.5-4.5c.55 0 1 .45 1 1s-.45 1-1 1-1-.45-1-1 .45-1 1-1z"/>
            </svg>
          </button>

          <button
            type="button"
            class="inline-flex w-full cursor-pointer items-center justify-center gap-2 rounded-md border border-outline-variant px-6 py-4 text-base font-semibold text-on-surface-variant transition-colors hover:border-outline hover:text-on-surface focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary sm:w-auto"
            @click="scrollToSection('atelier-plan')"
          >
            Découvrir la démarche
            <!-- SVG Arrow South / Down -->
            <svg class="size-4.5 shrink-0 fill-current" viewBox="0 0 24 24" aria-hidden="true">
              <path d="M19 9l-1.41-1.41L13 12.17V4h-2v8.17L6.41 7.58 5 9l7 7 7-7z"/>
            </svg>
          </button>
        </div>
      </section>

      <!-- VITRINE + REPÈRES -->
      <section id="vision" class="mx-auto max-w-7xl px-6 pb-24 lg:px-12 lg:pb-32">
        <div class="group relative w-full overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-high shadow-[0_20px_40px_-15px_rgb(109_40_26/0.08)] lg:rounded-[2.5rem]">
          <img
            :src="IMAGES.hero"
            alt="Illustration au trait d'une rue réaménagée"
            class="block h-auto max-h-[750px] w-full object-cover transition-transform duration-1000 ease-out group-hover:scale-[1.01] motion-reduce:transition-none"
          />

          <div class="pointer-events-none absolute inset-0">
            <svg class="absolute inset-0 size-full" viewBox="0 0 1000 600" preserveAspectRatio="none" fill="none" aria-hidden="true">
              <g v-for="r in reperes" :key="r.num" :class="r.color">
                <path :d="r.d" stroke="currentColor" stroke-width="1.2" stroke-dasharray="3 3" stroke-linecap="round" opacity="0.8" />
                <circle :cx="r.cx" :cy="r.cy" r="3.5" fill="currentColor" />
                <circle :cx="r.cx" :cy="r.cy" r="6.5" stroke="currentColor" stroke-width="1" opacity="0.4" />
              </g>
            </svg>

            <div
              v-for="r in reperes"
              :key="r.num"
              :class="['pointer-events-auto absolute flex items-center gap-2 rounded-md border bg-surface-container-lowest/95 px-3 py-1.5 shadow-sm backdrop-blur-sm', r.box, r.border]"
            >
              <!-- SVG Dynamique pour chaque repère -->
              <svg :class="['size-4.5 shrink-0 fill-current', r.color]" viewBox="0 0 24 24" aria-hidden="true">
                <!-- Park / Canopée -->
                <path v-if="r.icon === 'park'" d="M17 12h2L12 2 5 12h2l-3 6h7v4h2v-4h7l-3-6z"/>
                <!-- Pedal Bike -->
                <path v-else-if="r.icon === 'pedal_bike'" d="M15.5 5.5c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zM5 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5zm8.31-6.71l-1.9-3.8c-.32-.64-1-1.04-1.71-1.04H6v2h3.2l1.4 2.8-2.6 2.6c-.39-.25-.86-.39-1.35-.39-1.5 0-2.65 1.34-2.43 2.87.16 1.12 1.1 2.05 2.22 2.21 1.53.22 2.87-.93 2.87-2.43 0-.49-.14-.96-.39-1.35l2.6-2.6 1.8 1.8V21h2v-7.17l-2.09-2.09zM19 12c-2.21 0-4 1.79-4 4s1.79 4 4 4 4-1.79 4-4-1.79-4-4-4zm0 6.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
                <!-- Accessible PMR -->
                <path v-else-if="r.icon === 'accessible'" d="M12 4c1.1 0 2-.9 2-2s-.9-2-2-2-2 .9-2 2 .9 2 2 2zm9 7h-6v13h-2v-6h-2v6H9V11H3V9h18v2z"/>
                <!-- Chair / Banc -->
                <path v-else-if="r.icon === 'chair'" d="M7 11v2h10v-2H7zm13-4v12h-2v-2H6v2H4V7c0-1.1.9-2 2-2h12c1.1 0 2 .9 2 2zM18 9H6v4h12V9z"/>
                <!-- Sports Soccer / Espace enfant -->
                <path v-else-if="r.icon === 'sports_soccer'" d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm1 3.1l2.5 1.82-.95 2.93h-3.1l-.95-2.93L13 5.1zM5.3 8.35l2.84.42 1.07 2.88-2.03 2.18-2.73-.97.85-4.51zm.3 9.35l1.66-3.83 2.91.4 1.03 2.9-2.78 1.83-2.82-1.3zm12.8 0l-2.82 1.3-2.78-1.83 1.03-2.9 2.91-.4 1.66 3.83zm1.3-4.84l-2.73.97-2.03-2.18 1.07-2.88 2.84-.42.85 4.51z"/>
              </svg>

              <div class="flex flex-col text-left">
                <span :class="['text-[10px] leading-none font-bold tracking-wider uppercase', r.color]">Repère {{ r.num }}</span>
                <span class="mt-0.5 text-xs leading-tight font-bold text-on-surface sm:text-[13px]">{{ r.label }}</span>
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- 3 PILIERS -->
      <section id="piliers" class="mx-auto max-w-6xl border-t border-outline-variant/60 px-6 py-16 lg:px-12 lg:py-24">
        <div class="mx-auto mb-16 max-w-xl text-center lg:mb-20">
          <h2 :class="[fontDisplay, 'mt-2 text-3xl font-extrabold text-on-surface sm:text-4xl']">Penser l'espace pour chacun</h2>
          <p class="text-base leading-relaxed text-on-surface-variant sm:text-lg">
            Trois règles fondamentales
          </p>
        </div>

        <div class="grid grid-cols-1 gap-8 md:grid-cols-3 lg:gap-10">
          <article
            v-for="p in piliers"
            :key="p.title"
            :class="['flex flex-col items-center rounded-md border border-outline-variant bg-surface-container-lowest p-6 text-center shadow-sm shadow-primary-fixed transition-all duration-300 hover:-translate-y-1 hover:shadow-xl motion-reduce:transition-none motion-reduce:hover:translate-y-0 sm:p-8 md:items-start md:text-left', p.hover]"
          >
            <img :src="p.img" :alt="p.alt" loading="lazy" class="mb-5 block h-44 w-full rounded-xl border border-outline-variant/60 object-cover shadow-sm" />
            <div class="mb-2 flex items-center gap-2">
              <span :class="['size-1.5 rounded-full', p.dot]"></span>
              <span :class="['text-[11px] font-bold tracking-widest uppercase', p.tagColor]">{{ p.tag }}</span>
            </div>
            <h3 :class="[fontDisplay, 'mb-3 text-2xl font-bold text-on-surface']">{{ p.title }}</h3>
            <p class="text-base leading-relaxed text-on-surface-variant">{{ p.text }}</p>
          </article>
        </div>
      </section>

      <!-- ATELIER -->
           <section
    id="atelier-plan"
    aria-labelledby="atelier-plan-title"
    class="mx-auto max-w-7xl border-t border-outline-variant/60 px-6 py-16 lg:px-12 lg:py-24"
  >
    <div class="mx-auto mb-16 max-w-3xl text-center lg:mb-20">
       <h2
        id="atelier-plan-title"
        :class="fontDisplay"
        class="mb-4 text-3xl font-extrabold tracking-tight text-on-surface sm:text-4xl lg:text-5xl"
      >
        Dessinez votre projet de rue directement sur la vue satellite
      </h2>

      <p class="text-base leading-relaxed text-on-surface-variant sm:text-lg">
        Tracez voiries, pistes cyclables, marquages et mobilier urbain par-dessus
        l'imagerie aérienne, puis ajustez chaque élément jusqu'à obtenir le plan voulu.
      </p>
    </div>

    <div class="grid grid-cols-1 items-start gap-8 lg:grid-cols-12 lg:gap-12 border rounded-md p-5 border-outline-variant bg-surface-container-lowest">
      <!-- Étapes -->
      <div
        class="rounded-md border border-outline bg-surface-container-low/20 p-6 shadow-sm sm:p-8 lg:col-span-4"
      >
        <h3
          :class="fontDisplay"
          class="mb-3 flex items-center gap-2 text-3xl font-bold text-on-surface"
        >
          Comment ça marche ?
        </h3>
        <hr>
        <ol class="space-y-6 border-l-2 border-outline-variant/60 pl-6">
          <li v-for="etape in etapesAtelier" :key="etape.step" class="list-none group relative">
            <span
              class="absolute -left-[37px]  flex size-6 items-center justify-center rounded-full border border-outline-variant bg-surface-container-high text-[11px] font-bold text-primary transition-colors group-hover:bg-primary group-hover:text-on-primary"
              aria-hidden="true"
            >
              {{ etape.step }}
            </span>

            
            <h4 class="text-lg font-bold text-on-surface transition-colors group-hover:text-primary">
              {{ etape.title }}
            </h4>
           

            <p class="text-xs leading-relaxed -mt-2 text-on-surface-variant sm:text-sm">
              {{ etape.description }}
            </p>
          </li>
        </ol>
      </div>

      <!-- Capture d'écran + légende -->
      <figure class="lg:col-span-8">
        <div
          class="relative aspect-[16/10] w-full overflow-hidden rounded-3xl border border-outline-variant bg-surface-container-low shadow-xl lg:rounded-[2.5rem]"
        >
          <img
            :src="IMAGES.plan"
            alt="Capture d'écran de l'éditeur CréaStreet : tracé d'une rue sur la vue satellite, avec le dock d'outils en bas"
            loading="lazy"
            class="size-full object-cover transition-transform duration-700 hover:scale-[1.02]"
          />
          <div
            class="pointer-events-none absolute inset-0 bg-gradient-to-b from-on-surface/5 via-transparent to-on-surface/10"
          />

          <span
            class="absolute right-4 top-4 flex items-center gap-2 rounded-full border border-outline-variant/60 bg-surface-container-lowest/90 px-3.5 py-1.5 text-xs font-semibold text-on-surface shadow-sm backdrop-blur-md"
          >
            <span class="relative flex size-2" aria-hidden="true">
              <span class="absolute inline-flex size-full animate-ping rounded-full bg-emerald-500 opacity-75" />
              <span class="relative inline-flex size-2 rounded-full bg-emerald-500" />
            </span>
            Vue satellite
          </span>
        </div>

        <figcaption class="mt-10 px-2">
          <p :class="fontDisplay" class="text-3xl font-bold text-on-surface">
            Votre rue, tracée sur l'imagerie aérienne
          </p>
          <p class="-mt-5 text-sm leading-relaxed text-on-surface-variant">
            Chaque élément se place à la souris depuis le dock du bas, puis se règle
            dans le panneau de propriétés : largeur, nombre de voies, sens de circulation,
            couleur ou ordre d'affichage.
          </p>
        </figcaption>
      </figure>
    </div>
  </section>
    </main>

    <!-- FOOTER -->
    <footer class="w-full border-t border-outline-variant bg-surface-container-high">
      <div class="mx-auto flex max-w-8xl flex-col items-center justify-between gap-6 px-6 sm:flex-row lg:px-16">
        <img :src="IMAGES.footerLogo" alt="CréaStreet" class="h-8 w-auto object-contain opacity-90" />
        <p class="text-center text-sm text-on-surface-variant sm:text-right">
          Plateforme citoyenne ouverte d'urbanisme partagé © {{ year }}
        </p>
      </div>
    </footer>
  </div>
</template>
export interface Patterns {
  asphaltPattern: CanvasPattern
  grassPattern: CanvasPattern
  bushPattern: CanvasPattern
  pavementPattern: CanvasPattern
  waterPattern: CanvasPattern
  ballastPattern: CanvasPattern
  busLanePattern: CanvasPattern
  roofPattern: CanvasPattern
}

function seededRandom (seed: number): () => number {
  let s = seed
  return function () {
    s = (s * 9301 + 49297) % 233280
    return s / 233280
  }
}

function makeTile (
  size: number,
  drawFn: (ctx: CanvasRenderingContext2D, size: number) => void
): HTMLCanvasElement {
  const c = document.createElement('canvas')
  c.width = size
  c.height = size

  const tileCtx = c.getContext('2d')
  if (tileCtx == null) {
    throw new Error('Impossible de créer le contexte 2D de la tuile')
  }

  drawFn(tileCtx, size)
  return c
}

/** createPattern() peut renvoyer null : on le transforme en erreur explicite. */
function requirePattern (
  ctx: CanvasRenderingContext2D,
  tile: HTMLCanvasElement,
  name: string
): CanvasPattern {
  const pattern = ctx.createPattern(tile, 'repeat')
  if (pattern == null) {
    throw new Error(`Échec de création de la texture : ${name}`)
  }
  return pattern
}

function buildPatterns (ctx: CanvasRenderingContext2D): Patterns {
  // CORRECTION : la condition était inversée (`!= null`) et lançait l'erreur
  // alors que le contexte était valide.
  if (ctx == null) {
    throw new Error('Contexte Canvas principal manquant')
  }

  const asphaltTile = makeTile(12, (t, s) => {
    t.fillStyle = '#2c2c2c'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(7)
    for (let i = 0; i < 20; i++) {
      const g = 55 + r() * 70
      t.fillStyle = `rgba(${g},${g},${g},0.55)`
      t.fillRect(r() * s, r() * s, 1, 1)
    }
  })

  const grassTile = makeTile(16, (t, s) => {
    t.fillStyle = '#4a7c3a'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(3)
    for (let i = 0; i < 16; i++) {
      t.strokeStyle = r() > 0.5
        ? 'rgba(110,170,80,0.6)'
        : 'rgba(45,90,40,0.6)'
      t.lineWidth = 1

      const x = r() * s
      const y = r() * s

      t.beginPath()
      t.moveTo(x, y)
      t.lineTo(x + (r() * 4 - 2), y - 4)
      t.stroke()
    }
  })

  const bushTile = makeTile(14, (t, s) => {
    t.fillStyle = '#2f5d34'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(11)
    for (let i = 0; i < 14; i++) {
      t.fillStyle =
        `rgba(${40 + r() * 40},${95 + r() * 45},${45 + r() * 25},0.65)`

      t.beginPath()
      t.arc(r() * s, r() * s, 1.2 + r() * 1.6, 0, Math.PI * 2)
      t.fill()
    }
  })

  const pavementTile = makeTile(20, (t, s) => {
    t.fillStyle = '#b9b2a3'
    t.fillRect(0, 0, s, s)

    t.strokeStyle = '#8f887a'
    t.lineWidth = 1.4
    t.strokeRect(0.5, 0.5, s - 1, s - 1)

    t.fillStyle = 'rgba(255,255,255,0.10)'
    t.fillRect(1, 1, s / 2 - 1, s / 2 - 1)

    t.fillStyle = 'rgba(0,0,0,0.06)'
    t.fillRect(s / 2, s / 2, s / 2 - 1, s / 2 - 1)
  })

  /* ---------------- Nouvelles textures ---------------- */

  // Eau : fond bleu + petits reflets horizontaux (restent dans la tuile pour éviter les coutures)
  const waterTile = makeTile(24, (t, s) => {
    t.fillStyle = '#3f86bb'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(23)
    t.lineCap = 'round'
    for (let i = 0; i < 9; i++) {
      const len = 3 + r() * 6
      const x = 2 + r() * (s - len - 4)
      const y = 2 + r() * (s - 4)
      t.strokeStyle = r() > 0.4
        ? 'rgba(190,225,250,0.40)'
        : 'rgba(20,70,120,0.30)'
      t.lineWidth = 1
      t.beginPath()
      t.moveTo(x, y)
      t.lineTo(x + len, y)
      t.stroke()
    }
  })

  // Ballast (plateforme de tramway) : gravillons gris-beige
  const ballastTile = makeTile(14, (t, s) => {
    t.fillStyle = '#7a756c'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(31)
    for (let i = 0; i < 26; i++) {
      const g = 95 + r() * 90
      t.fillStyle = `rgba(${g},${g - 4},${g - 10},0.75)`
      t.beginPath()
      t.arc(r() * s, r() * s, 0.6 + r() * 1.1, 0, Math.PI * 2)
      t.fill()
    }
    for (let i = 0; i < 10; i++) {
      t.fillStyle = 'rgba(30,28,25,0.35)'
      t.fillRect(r() * s, r() * s, 1, 1)
    }
  })

  // Voie de bus : asphalte teinté rouge
  const busLaneTile = makeTile(12, (t, s) => {
    t.fillStyle = '#a8321f'
    t.fillRect(0, 0, s, s)

    const r = seededRandom(41)
    for (let i = 0; i < 22; i++) {
      const light = r() > 0.5
      t.fillStyle = light
        ? `rgba(${200 + r() * 40},${100 + r() * 50},${80 + r() * 40},0.35)`
        : `rgba(${70 + r() * 30},${20 + r() * 15},${15 + r() * 10},0.45)`
      t.fillRect(r() * s, r() * s, 1, 1)
    }
  })

  // Toit de bâtiment : gris avec joints fins et gravillons
  const roofTile = makeTile(18, (t, s) => {
    t.fillStyle = '#8c8c8c'
    t.fillRect(0, 0, s, s)

    // joints horizontaux
    t.strokeStyle = 'rgba(0,0,0,0.12)'
    t.lineWidth = 1
    t.beginPath()
    t.moveTo(0, s / 2 + 0.5)
    t.lineTo(s, s / 2 + 0.5)
    t.stroke()

    // reflet léger
    t.fillStyle = 'rgba(255,255,255,0.07)'
    t.fillRect(0, 0, s, s / 2)

    const r = seededRandom(53)
    for (let i = 0; i < 14; i++) {
      const g = 110 + r() * 70
      t.fillStyle = `rgba(${g},${g},${g},0.45)`
      t.fillRect(r() * s, r() * s, 1, 1)
    }
  })

  return {
    asphaltPattern: requirePattern(ctx, asphaltTile, 'asphaltPattern'),
    grassPattern: requirePattern(ctx, grassTile, 'grassPattern'),
    bushPattern: requirePattern(ctx, bushTile, 'bushPattern'),
    pavementPattern: requirePattern(ctx, pavementTile, 'pavementPattern'),
    waterPattern: requirePattern(ctx, waterTile, 'waterPattern'),
    ballastPattern: requirePattern(ctx, ballastTile, 'ballastPattern'),
    busLanePattern: requirePattern(ctx, busLaneTile, 'busLanePattern'),
    roofPattern: requirePattern(ctx, roofTile, 'roofPattern')
  }
}

export { buildPatterns }

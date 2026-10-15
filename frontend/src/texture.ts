export interface Patterns {
  asphaltPattern: CanvasPattern
  grassPattern: CanvasPattern
  bushPattern: CanvasPattern
  pavementPattern: CanvasPattern
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
  if (ctx != null) {
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

  return {
    asphaltPattern: requirePattern(ctx, asphaltTile, 'asphaltPattern'),
    grassPattern: requirePattern(ctx, grassTile, 'grassPattern'),
    bushPattern: requirePattern(ctx, bushTile, 'bushPattern'),
    pavementPattern: requirePattern(ctx, pavementTile, 'pavementPattern')
  }
}

export { buildPatterns }

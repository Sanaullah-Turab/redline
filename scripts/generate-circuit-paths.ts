import { writeFileSync } from 'node:fs'
import { geoMercator } from 'd3-geo'
import { line, curveCatmullRomClosed } from 'd3-shape'
import simplify from 'simplify-js'

const SOURCE =
  'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const OUTPUT = 'lib/circuit-paths.ts'
const W = 170
const H = 100
const PAD = 6

type Pt = { x: number; y: number }

const toPath = (coords: [number, number][]) => {
  const first = coords[0]
  const last = coords[coords.length - 1]
  const closed = first[0] === last[0] && first[1] === last[1]
  const geom = { type: 'LineString' as const, coordinates: coords }
  let best = geoMercator().angle(0).fitExtent([[PAD, PAD], [W - PAD, H - PAD]], geom)
  let maxScale = best.scale()
  for (let a = 5; a <= 175; a += 5) {
    const p = geoMercator().angle(a).fitExtent([[PAD, PAD], [W - PAD, H - PAD]], geom)
    const s = p.scale()
    if (s > maxScale) {
      maxScale = s
      best = p
    }
  }
  const pts = coords.map((c) => best(c)!)
  const simple = simplify(pts.map(([x, y]) => ({ x, y })), 0.35, true)
  const ring = closed ? simple.slice(0, -1) : simple
  return line<Pt>()
    .x((p) => p.x)
    .y((p) => p.y)
    .curve(curveCatmullRomClosed.alpha(0.5))
    .digits(1)(ring)!
}

async function run() {
  const res = await fetch(SOURCE)
  const { features } = await res.json()

  const out: Record<string, string> = {}
  for (const f of features) out[f.properties.id] = toPath(f.geometry.coordinates)

  writeFileSync(
    OUTPUT,
    `export const CIRCUIT_PATHS: Record<string, string> = ${JSON.stringify(out, null, 2)}\n`
  )
}

run()

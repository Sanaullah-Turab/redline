import { writeFileSync } from 'node:fs'
import { geoMercator } from 'd3-geo'
import { line, curveCatmullRomClosed } from 'd3-shape'
import simplify from 'simplify-js'

const SOURCE =
  'https://raw.githubusercontent.com/bacinger/f1-circuits/master/f1-circuits.geojson'
const OUTPUT = 'lib/circuit-paths.ts'
const W = 170
const H = 100
const PAD = 10

type Pt = { x: number; y: number }

const toPath = (coords: [number, number][]) => {
  const first = coords[0]
  const last = coords[coords.length - 1]
  const closed = first[0] === last[0] && first[1] === last[1]
  const projection = geoMercator().fitExtent(
    [[PAD, PAD], [W - PAD, H - PAD]],
    { type: 'LineString', coordinates: coords }
  )
  const pts = coords.map((c) => projection(c)!)
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

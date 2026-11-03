import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowLeft } from 'lucide-react'
import { DriverEntries } from '@/components/admin/driver-entries'
import { ReferenceEditor } from '@/components/admin/reference-editor'
import { SiteHeader } from '@/components/site-header'
import { getAdminSession } from '@/lib/admin'
import { db } from '@/lib/db'
import { sessionClassifications } from '@/lib/db/schema'
import { getDriverCatalog, getRoundDriverRows, mergeRoundDrivers } from '@/lib/drivers/round-drivers'
import { BASE_DRIVERS, formatRaceWeekend, getSchedule, SEASON, type ReferenceKind } from '@/lib/f1'
import { allPredictionsLocked } from '@/lib/round-state'
import { getShortcut } from '@/lib/reference'
import { and, eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

const KINDS: { kind: ReferenceKind; title: string }[] = [
  { kind: 'practice-3', title: 'Free Practice 3' },
  { kind: 'grid', title: 'Starting grid' },
]

export default async function Page({ params }: { params: Promise<{ round: string }> }) {
  if (!(await getAdminSession())) notFound()
  const round = Number((await params).round)
  const race = Number.isInteger(round) ? (await getSchedule(SEASON)).find((entry) => entry.round === round) : undefined
  if (!race) notFound()

  const [rows, catalog, shortcuts] = await Promise.all([
    getRoundDriverRows(SEASON, round),
    getDriverCatalog(SEASON),
    Promise.all(KINDS.map(({ kind }) => getShortcut(SEASON, race, kind))),
  ])
  const entered = mergeRoundDrivers(rows)
  const enteredIds = new Set(entered.map((driver) => driver.id))
  const withdrawn = [...catalog.values()].filter((driver) => !enteredIds.has(driver.id) && (BASE_DRIVERS.some((base) => base.id === driver.id) || rows.some((row) => row.driverId === driver.id)))
  const manualRows = await db.select({ sessionType: sessionClassifications.sessionType }).from(sessionClassifications).where(and(eq(sessionClassifications.season, SEASON), eq(sessionClassifications.round, round), eq(sessionClassifications.source, 'manual')))
  const manual = new Set(manualRows.map((row) => row.sessionType))

  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="mx-auto max-w-7xl px-4 py-10 lg:px-8">
            <Link href="/admin" className="eyebrow inline-flex items-center gap-2"><ArrowLeft aria-hidden="true" />ALL ROUNDS</Link>
            <h1 className="mt-3 wrap-anywhere font-mono text-4xl font-black uppercase italic md:text-6xl">{race.name}</h1>
            <p className="mt-3 text-muted-foreground">Round {round} · {formatRaceWeekend(race.date, { includeYear: true })}</p>
          </div>
        </section>
        <section className="mx-auto flex max-w-7xl flex-col gap-8 px-4 py-10 lg:px-8">
          <DriverEntries round={round} entered={entered} withdrawn={withdrawn} replaceable={entered} editable={!allPredictionsLocked(race)} />
          {KINDS.map(({ kind, title }, index) => {
            const shortcut = shortcuts[index]
            if (shortcut.status === 'not-applicable') return null
            return (
              <ReferenceEditor
                key={`${kind}-${shortcut.status === 'ready' ? shortcut.positions.join() : 'none'}`}
                round={round}
                kind={kind}
                title={title}
                drivers={entered}
                catalog={[...catalog.values()]}
                initial={shortcut.status === 'ready' ? shortcut.positions.slice(0, 10) : []}
                source={shortcut.status === 'ready' ? (manual.has(kind) ? 'manual' : shortcut.source) : null}
              />
            )
          })}
        </section>
      </main>
    </>
  )
}

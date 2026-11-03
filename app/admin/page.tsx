import Link from 'next/link'
import { notFound } from 'next/navigation'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'
import { getAdminSession } from '@/lib/admin'
import { formatRaceWeekend, getSchedule, SEASON } from '@/lib/f1'

export const dynamic = 'force-dynamic'
export const metadata = { title: 'Admin' }

export default async function Page() {
  if (!(await getAdminSession())) notFound()
  const schedule = await getSchedule(SEASON)
  return (
    <>
      <SiteHeader />
      <main>
        <section className="race-hero">
          <div className="mx-auto max-w-7xl px-4 py-12 lg:px-8">
            <p className="eyebrow">CONTROL ROOM</p>
            <h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Admin</h1>
            <p className="mt-4 max-w-xl text-muted-foreground">Manage the entry list and the FP3 and starting grid references for each round.</p>
          </div>
        </section>
        <section className="mx-auto max-w-5xl px-4 py-10 lg:px-8">
          {schedule.length ? (
            <ul className="flex flex-col">
              {schedule.map((race) => (
                <li key={race.round}>
                  <Link href={`/admin/${race.round}`} className="history-row">
                    <span className="round">R{String(race.round).padStart(2, '0')}</span>
                    <span className="min-w-0"><b>{race.name}</b><small className="text-muted-foreground">{formatRaceWeekend(race.date, { includeYear: true })}</small></span>
                    <ArrowRight aria-hidden="true" />
                  </Link>
                </li>
              ))}
            </ul>
          ) : <div className="empty-grid"><p>The schedule is not available yet.</p></div>}
        </section>
      </main>
    </>
  )
}

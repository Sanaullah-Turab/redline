import { SiteHeader } from '@/components/site-header'
import { db } from '@/lib/db'
import { predictions, user } from '@/lib/db/schema'
import { SEASON } from '@/lib/f1'
import { desc, eq, sql } from 'drizzle-orm'
import { Medal, Trophy } from 'lucide-react'

export const dynamic = 'force-dynamic'

export default async function Page() {
  const rows = await db.select({ id: user.id, name: user.name, points: sql<number>`coalesce(sum(${predictions.points}), 0)::int` }).from(user).leftJoin(predictions, eq(user.id, predictions.userId)).groupBy(user.id, user.name).orderBy(desc(sql`coalesce(sum(${predictions.points}), 0)`))
  return <><SiteHeader /><main><section className="race-hero"><div className="mx-auto max-w-7xl px-4 py-12 lg:px-8"><p className="eyebrow">REDLINE WORLD CHAMPIONSHIP</p><h1 className="mt-3 font-mono text-5xl font-black uppercase italic md:text-7xl">Leaderboard</h1><p className="mt-4 max-w-xl text-muted-foreground">One exact position equals one point. The highest total after the final race takes the title.</p></div></section><section className="mx-auto max-w-5xl px-4 py-10 lg:px-8"><div className="leaderboard"><div className="leaderboard-head"><span>POS</span><span>PLAYER</span><span>POINTS</span></div>{rows.length ? rows.map((row, index) => <div className="leaderboard-row" key={row.id}><span className="rank">{index < 3 ? <Medal aria-hidden="true" /> : String(index + 1).padStart(2, '0')}</span><span><b>{row.name}</b><small>{SEASON} contender</small></span><strong>{row.points}</strong></div>) : <div className="empty-grid"><Trophy /><p>No contenders yet. Create an account to take the first grid slot.</p></div>}</div></section></main></>
}

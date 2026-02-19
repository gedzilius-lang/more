import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/session'
import { requireAdminAuth } from '@/lib/admin-session'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import type { CardConfig } from '@/lib/schema'
import AdminDashboard from './AdminDashboard'

interface Props { params: { username: string } }

export const dynamic = 'force-dynamic'

export default async function AdminPage({ params }: Props) {
  const session = await requireAuth(params.username)
  if (!session) redirect(`/more/${params.username}/login`)

  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) redirect('/')

  const adminSession = await requireAdminAuth()

  const now = new Date()

  const allEvents = await db.select({
    type: schema.events.type,
    linkKey: schema.events.linkKey,
    ts: schema.events.ts,
  }).from(schema.events).where(eq(schema.events.cardId, card.id))

  const clicksTotal = allEvents.filter(e => e.type === 'link_click').length
  const viewsTotal = allEvents.filter(e => e.type === 'page_view').length

  const linkCounts: Record<string, number> = {}
  for (const e of allEvents.filter(e => e.type === 'link_click' && e.linkKey)) {
    linkCounts[e.linkKey!] = (linkCounts[e.linkKey!] ?? 0) + 1
  }
  const topLinks = Object.entries(linkCounts)
    .sort((a, b) => b[1] - a[1]).slice(0, 10)
    .map(([key, count]) => ({ key, count }))

  const dailyMap: Record<string, number> = {}
  for (let i = 6; i >= 0; i--) {
    const d = new Date(now.getTime() - i * 24 * 60 * 60 * 1000)
    dailyMap[d.toISOString().slice(0, 10)] = 0
  }
  for (const e of allEvents.filter(e => e.type === 'link_click')) {
    const day = e.ts.toISOString().slice(0, 10)
    if (day in dailyMap) dailyMap[day]++
  }
  const dailyTrend = Object.entries(dailyMap).map(([date, count]) => ({ date, count }))

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'

  return (
    <AdminDashboard
      username={params.username}
      cardId={card.id}
      config={card.configJson as CardConfig}
      analytics={{ clicksTotal, viewsTotal, topLinks, dailyTrend }}
      base={base}
      isAdmin={!!adminSession}
    />
  )
}

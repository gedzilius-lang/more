import { redirect } from 'next/navigation'
import { requireAdminAuth } from '@/lib/admin-session'
import { db, schema } from '@/lib/db'
import AdminDashboard from './AdminDashboard'

export const dynamic = 'force-dynamic'

export default async function AdminPage() {
  const admin = await requireAdminAuth()
  if (!admin) redirect('/admin/login')

  const cards = await db.select({
    id: schema.cards.id,
    username: schema.cards.username,
    email: schema.cards.email,
    displayName: schema.cards.displayName,
    published: schema.cards.published,
    createdAt: schema.cards.createdAt,
  }).from(schema.cards).orderBy(schema.cards.createdAt)

  const inviteRows = await db.select().from(schema.invites).orderBy(schema.invites.createdAt)

  return (
    <AdminDashboard
      adminEmail={admin.email}
      initialCards={cards.map(c => ({ ...c, createdAt: c.createdAt.toISOString() }))}
      initialInvites={inviteRows.map(i => ({
        id: i.id, email: i.email,
        expiresAt: i.expiresAt.toISOString(),
        used: i.used,
        createdAt: i.createdAt.toISOString(),
      }))}
    />
  )
}

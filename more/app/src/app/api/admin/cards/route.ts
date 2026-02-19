import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-session'
import { ilike, or } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest) {
  if (!await requireAdminAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const q = req.nextUrl.searchParams.get('q') ?? ''
  const cards = await db.select({
    id: schema.cards.id,
    username: schema.cards.username,
    email: schema.cards.email,
    displayName: schema.cards.displayName,
    published: schema.cards.published,
    createdAt: schema.cards.createdAt,
  }).from(schema.cards)
    .where(q ? or(
      ilike(schema.cards.username, `%${q}%`),
      ilike(schema.cards.email, `%${q}%`),
    ) : undefined)
    .orderBy(schema.cards.createdAt)
  return NextResponse.json(cards)
}

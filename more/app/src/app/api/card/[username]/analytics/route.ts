import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await requireAuth(params.username)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const events = await db.select({
    type: schema.events.type,
    linkKey: schema.events.linkKey,
    ts: schema.events.ts,
  }).from(schema.events).where(eq(schema.events.cardId, session.cardId))
  return NextResponse.json(events)
}

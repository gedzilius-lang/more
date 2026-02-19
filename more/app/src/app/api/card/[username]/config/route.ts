import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await requireAuth(params.username)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const config = await req.json().catch(() => null)
  if (!config?.blocks) return NextResponse.json({ error: 'Invalid config' }, { status: 400 })
  await db.update(schema.cards)
    .set({ configJson: config, updatedAt: new Date() })
    .where(eq(schema.cards.username, params.username))
  return NextResponse.json({ ok: true })
}

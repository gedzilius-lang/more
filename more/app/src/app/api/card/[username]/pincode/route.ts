import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { requireAuth } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await requireAuth(params.username)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })

  const body = await req.json().catch(() => null)
  if (!body?.newPincode) return NextResponse.json({ error: 'Missing newPincode' }, { status: 400 })
  if (String(body.newPincode).length < 4) {
    return NextResponse.json({ error: 'Pincode must be at least 4 characters' }, { status: 400 })
  }

  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.currentPincode) {
    const valid = await bcrypt.compare(String(body.currentPincode), card.pincodeHash)
    if (!valid) return NextResponse.json({ error: 'Current pincode incorrect' }, { status: 401 })
  }

  const newHash = await bcrypt.hash(String(body.newPincode), 12)
  await db.update(schema.cards).set({ pincodeHash: newHash, updatedAt: new Date() })
    .where(eq(schema.cards.id, card.id))

  return NextResponse.json({ ok: true })
}

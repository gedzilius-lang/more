import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq, and, gt } from 'drizzle-orm'
import { createHash } from 'crypto'
import bcrypt from 'bcryptjs'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string; token: string } }) {
  const body = await req.json().catch(() => null)
  if (!body?.pincode) return NextResponse.json({ error: 'Missing pincode' }, { status: 400 })

  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) return NextResponse.json({ error: 'Invalid' }, { status: 400 })

  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const [rt] = await db.select().from(schema.resetTokens).where(
    and(
      eq(schema.resetTokens.cardId, card.id),
      eq(schema.resetTokens.tokenHash, tokenHash),
      eq(schema.resetTokens.used, false),
      gt(schema.resetTokens.expiresAt, new Date()),
    )
  ).limit(1)

  if (!rt) return NextResponse.json({ error: 'Invalid or expired token' }, { status: 400 })

  const pincodeHash = await bcrypt.hash(String(body.pincode), 12)
  await db.update(schema.cards).set({ pincodeHash, updatedAt: new Date() })
    .where(eq(schema.cards.id, card.id))
  await db.update(schema.resetTokens).set({ used: true })
    .where(eq(schema.resetTokens.id, rt.id))

  return NextResponse.json({ ok: true })
}

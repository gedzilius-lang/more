import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.pincode) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)

  const fakeHash = '$2a$12$fakehashfakehashfakehashfakehashfakehashfake'
  const hash = card?.pincodeHash ?? fakeHash
  const valid = await bcrypt.compare(String(body.pincode), hash)

  if (!card || card.email !== body.email || !valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getSession()
  session.username = card.username
  session.cardId = card.id
  await session.save()

  return NextResponse.json({ ok: true })
}

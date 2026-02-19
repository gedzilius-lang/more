import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { createHash } from 'crypto'
import { eq } from 'drizzle-orm'
import bcrypt from 'bcryptjs'
import { v4 as uuidv4 } from 'uuid'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function GET(_req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const [invite] = await db.select().from(schema.invites)
    .where(eq(schema.invites.tokenHash, tokenHash)).limit(1)
  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 404 })
  }
  return NextResponse.json({ email: invite.email })
}

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  const tokenHash = createHash('sha256').update(params.token).digest('hex')
  const [invite] = await db.select().from(schema.invites)
    .where(eq(schema.invites.tokenHash, tokenHash)).limit(1)
  if (!invite || invite.used || invite.expiresAt < new Date()) {
    return NextResponse.json({ error: 'Invalid or expired invite' }, { status: 400 })
  }

  const body = await req.json().catch(() => null)
  if (!body?.username || !body?.pincode) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const slug = String(body.username).toLowerCase().trim()
  if (!/^[a-z0-9_-]{3,30}$/.test(slug)) {
    return NextResponse.json({ error: 'Username: 3-30 chars, letters/numbers/_ or -' }, { status: 400 })
  }
  if (String(body.pincode).length < 4) {
    return NextResponse.json({ error: 'Pincode must be at least 4 characters' }, { status: 400 })
  }

  const [existing] = await db.select({ id: schema.cards.id })
    .from(schema.cards).where(eq(schema.cards.username, slug)).limit(1)
  if (existing) {
    return NextResponse.json({ error: 'Username taken' }, { status: 409 })
  }

  const pincodeHash = await bcrypt.hash(String(body.pincode), 12)
  const displayName = String(body.displayName || slug)
  const defaultConfig = {
    theme: 'dark',
    blocks: [{ id: uuidv4(), type: 'profile', name: displayName, bio: '' }],
  }

  const [card] = await db.insert(schema.cards).values({
    username: slug, email: invite.email,
    pincodeHash, displayName, published: true,
    configJson: defaultConfig as any,
  }).returning()

  await db.update(schema.invites)
    .set({ used: true, usedAt: new Date(), cardId: card.id })
    .where(eq(schema.invites.id, invite.id))

  const session = await getSession()
  session.username = card.username
  session.cardId = card.id
  await session.save()

  return NextResponse.json({ ok: true, username: card.username })
}

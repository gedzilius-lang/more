import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { randomBytes, createHash } from 'crypto'
import { sendResetEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const body = await req.json().catch(() => null)
  const card = body?.email
    ? (await db.select().from(schema.cards)
        .where(eq(schema.cards.username, params.username)).limit(1))[0]
    : null

  if (card && card.email === body.email) {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 30 * 60 * 1000)
    await db.insert(schema.resetTokens).values({ cardId: card.id, tokenHash, expiresAt })
    await sendResetEmail({ to: card.email, username: params.username, token }).catch(() => {})
  }
  return NextResponse.json({ ok: true })
}

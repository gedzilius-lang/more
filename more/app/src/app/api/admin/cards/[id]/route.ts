import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-session'
import { eq } from 'drizzle-orm'
import { createHash, randomBytes } from 'crypto'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function PATCH(req: NextRequest, { params }: { params: { id: string } }) {
  if (!await requireAdminAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body) return NextResponse.json({ error: 'Bad request' }, { status: 400 })

  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.id, params.id)).limit(1)
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })

  if (body.action === 'update') {
    const updates: Partial<typeof schema.cards.$inferInsert> = {}
    if (body.email) updates.email = body.email
    if (typeof body.published === 'boolean') updates.published = body.published
    await db.update(schema.cards).set(updates).where(eq(schema.cards.id, params.id))
    return NextResponse.json({ ok: true })
  }

  if (body.action === 'reset') {
    const token = randomBytes(32).toString('hex')
    const tokenHash = createHash('sha256').update(token).digest('hex')
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000)
    await db.insert(schema.resetTokens).values({ cardId: card.id, tokenHash, expiresAt })
    const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'
    const resetUrl = `${base}/more/${card.username}/reset/${token}`
    await sendEmail({
      to: card.email,
      subject: 'Reset your PeopleWeLike pincode',
      html: `<p>Click to reset your pincode: <a href="${resetUrl}">${resetUrl}</a></p><p>This link expires in 1 hour.</p>`,
    })
    return NextResponse.json({ ok: true, resetUrl })
  }

  return NextResponse.json({ error: 'Unknown action' }, { status: 400 })
}

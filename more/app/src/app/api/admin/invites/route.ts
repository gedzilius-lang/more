import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { requireAdminAuth } from '@/lib/admin-session'
import { randomBytes, createHash } from 'crypto'
import { sendEmail } from '@/lib/email'

export const dynamic = 'force-dynamic'

export async function GET() {
  if (!await requireAdminAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const invites = await db.select().from(schema.invites).orderBy(schema.invites.createdAt)
  return NextResponse.json(invites.map(i => ({
    id: i.id, email: i.email,
    expiresAt: i.expiresAt, used: i.used, createdAt: i.createdAt,
  })))
}

export async function POST(req: NextRequest) {
  if (!await requireAdminAuth()) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  }
  const body = await req.json().catch(() => null)
  if (!body?.email) return NextResponse.json({ error: 'Email required' }, { status: 400 })

  const token = randomBytes(32).toString('hex')
  const tokenHash = createHash('sha256').update(token).digest('hex')
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000)
  await db.insert(schema.invites).values({ email: body.email, tokenHash, expiresAt })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'
  const inviteUrl = `${base}/invite/${token}`

  if (body.sendEmail) {
    await sendEmail({
      to: body.email,
      subject: "You're invited to PeopleWeLike",
      html: `<p>You've been invited to create your digital business card!</p><p><a href="${inviteUrl}">${inviteUrl}</a></p><p>This link expires in 7 days.</p>`,
    }).catch(() => {})
  }

  return NextResponse.json({ ok: true, inviteUrl })
}

import { NextResponse, NextRequest } from 'next/server'
import { timingSafeEqual } from 'crypto'
import { getAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  const adminPassword = process.env.ADMIN_PASSWORD ?? ''
  if (!adminEmail || !adminPassword) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  const emailBuf = Buffer.from(body.email)
  const adminEmailBuf = Buffer.from(adminEmail)
  const pwdBuf = Buffer.from(String(body.password))
  const adminPwdBuf = Buffer.from(adminPassword)

  const emailMatch = emailBuf.length === adminEmailBuf.length &&
    timingSafeEqual(emailBuf, adminEmailBuf)
  const pwdMatch = pwdBuf.length === adminPwdBuf.length &&
    timingSafeEqual(pwdBuf, adminPwdBuf)

  if (!emailMatch || !pwdMatch) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getAdminSession()
  session.isAdmin = true
  session.email = adminEmail
  await session.save()
  return NextResponse.json({ ok: true })
}

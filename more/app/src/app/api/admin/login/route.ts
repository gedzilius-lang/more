import { NextResponse, NextRequest } from 'next/server'
import bcrypt from 'bcryptjs'
import { getAdminSession } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null)
  if (!body?.email || !body?.password) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const adminEmail = process.env.ADMIN_EMAIL ?? ''
  const adminHash  = process.env.ADMIN_PASSWORD_HASH ?? ''
  if (!adminEmail || !adminHash) {
    return NextResponse.json({ error: 'Admin not configured' }, { status: 503 })
  }

  const emailMatch = body.email === adminEmail
  const fakeHash = '$2a$12$fakehashfakehashfakehashfakehashfakehashfake'
  const valid = await bcrypt.compare(String(body.password), emailMatch ? adminHash : fakeHash)
  if (!emailMatch || !valid) {
    return NextResponse.json({ error: 'Invalid credentials' }, { status: 401 })
  }

  const session = await getAdminSession()
  session.isAdmin = true
  session.email = adminEmail
  await session.save()
  return NextResponse.json({ ok: true })
}

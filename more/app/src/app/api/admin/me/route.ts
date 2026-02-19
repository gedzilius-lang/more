import { NextResponse } from 'next/server'
import { requireAdminAuth } from '@/lib/admin-session'

export const dynamic = 'force-dynamic'

export async function GET() {
  const admin = await requireAdminAuth()
  if (!admin) return NextResponse.json({ isAdmin: false })
  return NextResponse.json({ isAdmin: true, email: admin.email })
}

import { NextResponse } from 'next/server'
import { getSession } from '@/lib/session'

export const dynamic = 'force-dynamic'

export async function POST(_req: Request, { params }: { params: { username: string } }) {
  const session = await getSession()
  session.destroy()
  return NextResponse.redirect(new URL(`/more/${params.username}`, process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'))
}

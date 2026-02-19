import { NextResponse } from 'next/server'
import { generateQRSvg } from '@/lib/qr'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'

export const dynamic = 'force-dynamic'

export async function GET(_req: Request, { params }: { params: { username: string } }) {
  const [card] = await db.select({ id: schema.cards.id })
    .from(schema.cards).where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) return new NextResponse('Not found', { status: 404 })

  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'
  const url = `${base}/more/${params.username}`
  const svg = await generateQRSvg(url)

  return new NextResponse(svg, {
    headers: { 'Content-Type': 'image/svg+xml', 'Cache-Control': 'public, max-age=86400' },
  })
}

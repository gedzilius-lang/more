import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { createHash } from 'crypto'
import type { CardConfig } from '@/lib/schema'

export const dynamic = 'force-dynamic'

export async function GET(req: NextRequest, { params }: { params: { username: string; linkKey: string } }) {
  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) return new NextResponse('Not found', { status: 404 })

  const config = card.configJson as CardConfig
  let targetUrl: string | null = null

  for (const block of config.blocks) {
    if (block.type === 'link' && block.key === params.linkKey) {
      targetUrl = block.url
      break
    }
    if (block.type === 'contact') {
      if (params.linkKey === 'contact-email' && block.email) {
        targetUrl = `mailto:${block.email}`
        break
      }
      if (params.linkKey === 'contact-phone' && block.phone) {
        targetUrl = `tel:${block.phone}`
        break
      }
    }
  }

  const ip = req.headers.get('x-forwarded-for')?.split(',')[0] ?? ''
  const ipHash = ip ? createHash('sha256').update(ip).digest('hex').slice(0, 16) : null
  await db.insert(schema.events).values({
    cardId: card.id,
    type: 'link_click',
    linkKey: params.linkKey,
    ua: (req.headers.get('user-agent') ?? '').slice(0, 200),
    ref: (req.headers.get('referer') ?? '').slice(0, 200),
    ipHash,
  })

  if (!targetUrl) return new NextResponse('Link not found', { status: 404 })
  return NextResponse.redirect(targetUrl, { status: 302 })
}

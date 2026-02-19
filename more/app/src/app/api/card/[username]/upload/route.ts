import { NextResponse, NextRequest } from 'next/server'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import { requireAuth } from '@/lib/session'
import { processUpload } from '@/lib/image'

export const dynamic = 'force-dynamic'

export async function POST(req: NextRequest, { params }: { params: { username: string } }) {
  const session = await requireAuth(params.username)
  if (!session) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
  const [card] = await db.select({ id: schema.cards.id }).from(schema.cards)
    .where(eq(schema.cards.username, params.username)).limit(1)
  if (!card) return NextResponse.json({ error: 'Not found' }, { status: 404 })
  const formData = await req.formData()
  const file = formData.get('file') as File | null
  if (!file) return NextResponse.json({ error: 'No file' }, { status: 400 })
  const buffer = Buffer.from(await file.arrayBuffer())
  const result = await processUpload(card.id, buffer, file.type)
  if (result.error) return NextResponse.json({ error: result.error }, { status: 400 })
  return NextResponse.json({ ok: true, variants: result.variants })
}

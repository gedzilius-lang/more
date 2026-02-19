import { notFound } from 'next/navigation'
import { db, schema } from '@/lib/db'
import { eq } from 'drizzle-orm'
import type { Block, CardConfig } from '@/lib/schema'
import type { Metadata } from 'next'

interface Props { params: { username: string } }

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const card = await getCard(params.username)
  if (!card) return { title: 'Not Found' }
  const name = card.displayName ?? card.username
  return {
    title: name + ' | PeopleWeLike',
    openGraph: { title: name, siteName: 'PeopleWeLike', type: 'profile' },
  }
}

async function getCard(username: string) {
  const [card] = await db.select().from(schema.cards)
    .where(eq(schema.cards.username, username)).limit(1)
  return card ?? null
}

export default async function CardPage({ params }: Props) {
  const card = await getCard(params.username)
  if (!card || !card.published) notFound()

  const config = card.configJson as CardConfig
  const blocks = config.blocks.filter(b => !b.hidden)
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'

  return (
    <div className="page">
      {blocks.map(block => (
        <BlockRenderer key={block.id} block={block} username={params.username} base={base} />
      ))}
      <div className="card-footer">
        <a href={`/more/${params.username}/login`}>login</a>
      </div>
    </div>
  )
}

function BlockRenderer({ block, username, base }: { block: Block; username: string; base: string }) {
  switch (block.type) {
    case 'profile': return <ProfileBlock block={block} />
    case 'link':    return <LinkBlock block={block} username={username} base={base} />
    case 'text':    return <TextBlock block={block} />
    case 'image':   return <ImageBlock block={block} />
    case 'contact': return <ContactBlock block={block} />
    case 'qr':      return <QRBlock username={username} />
    default:        return null
  }
}

function ProfileBlock({ block }: { block: Extract<Block, { type: 'profile' }> }) {
  return (
    <div className="card card-glow">
      <div className="profile-header">
        {block.avatar && <img src={block.avatar} alt={block.name} className="avatar" />}
        {block.name && <div className="name">{block.name}</div>}
        {block.bio && <div className="bio">{block.bio}</div>}
      </div>
    </div>
  )
}

function LinkBlock({ block, username, base }: { block: Extract<Block, { type: 'link' }>; username: string; base: string }) {
  if (!block.url) return null
  return (
    <a href={`${base}/more/${username}/l/${block.key}`} className="link-item" rel="noopener noreferrer">
      {block.icon && <span>{block.icon}</span>}
      {block.label}
    </a>
  )
}

function TextBlock({ block }: { block: Extract<Block, { type: 'text' }> }) {
  if (!block.markdown) return null
  return (
    <div className="card">
      <p style={{ color: 'var(--text2)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{block.markdown}</p>
    </div>
  )
}

function ImageBlock({ block }: { block: Extract<Block, { type: 'image' }> }) {
  if (!block.src) return null
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      <img src={block.src} alt={block.alt ?? ''} style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)' }} />
    </div>
  )
}

function ContactBlock({ block }: { block: Extract<Block, { type: 'contact' }> }) {
  const items: Array<{ label: string; href: string }> = []
  if (block.email) items.push({ label: block.email, href: `mailto:${block.email}` })
  if (block.phone) items.push({ label: block.phone, href: `tel:${block.phone}` })
  if (!items.length) return null
  return (
    <div className="card">
      <div className="block-list">
        {items.map((item, i) => (
          <a key={i} href={item.href} className="link-item">{item.label}</a>
        ))}
      </div>
    </div>
  )
}

function QRBlock({ username }: { username: string }) {
  return (
    <div className="card qr-box">
      <div className="section-heading">QR Code</div>
      <img src={`/more/${username}/qr`} alt="QR code"
        style={{ maxWidth: 160, display: 'block', margin: '0 auto' }} />
    </div>
  )
}

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
  const blocks = config.blocks.filter(b => !b.is_hidden)
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
    case 'links': return <LinksBlock block={block} username={username} base={base} />
    case 'text': return <TextBlock block={block} />
    case 'image': return <ImageBlock block={block} />
    case 'contact': return <ContactBlock block={block} username={username} base={base} />
    case 'qr': return <QRBlock username={username} base={base} />
    default: return null
  }
}

function ProfileBlock({ block }: { block: Block }) {
  const d = block.data as { display_name?: string; title?: string; bio?: string; avatar_url?: string }
  return (
    <div className="card card-glow">
      <div className="profile-header">
        {d.avatar_url && <img src={d.avatar_url} alt={d.display_name ?? 'avatar'} className="avatar" />}
        {d.display_name && <div className="name">{d.display_name}</div>}
        {d.title && <div className="title">{d.title}</div>}
        {d.bio && <div className="bio">{d.bio}</div>}
      </div>
    </div>
  )
}

function LinksBlock({ block, username, base }: { block: Block; username: string; base: string }) {
  const d = block.data as { links?: Array<{ key: string; label: string; icon?: string }> }
  if (!d.links?.length) return null
  return (
    <div className="card">
      {block.title && <div className="section-heading">{block.title}</div>}
      <div className="block-list">
        {d.links.map(link => (
          <a key={link.key} href={`${base}/more/${username}/l/${link.key}`}
            className="link-item" rel="noopener noreferrer">
            {link.icon && <span>{link.icon}</span>}
            {link.label}
          </a>
        ))}
      </div>
    </div>
  )
}

function TextBlock({ block }: { block: Block }) {
  const d = block.data as { content?: string }
  if (!d.content) return null
  return (
    <div className="card">
      {block.title && <div className="section-heading">{block.title}</div>}
      <p style={{ color: 'var(--text2)', fontSize: '14px', whiteSpace: 'pre-wrap' }}>{d.content}</p>
    </div>
  )
}

function ImageBlock({ block }: { block: Block }) {
  const d = block.data as { url?: string; alt?: string }
  if (!d.url) return null
  return (
    <div className="card" style={{ textAlign: 'center' }}>
      {block.title && <div className="section-heading">{block.title}</div>}
      <img src={d.url} alt={d.alt ?? ''} style={{ maxWidth: '100%', borderRadius: 'var(--radius-sm)' }} />
    </div>
  )
}

function ContactBlock({ block, username, base }: { block: Block; username: string; base: string }) {
  const d = block.data as { items?: Array<{ type: string; label: string; value: string }> }
  if (!d.items?.length) return null
  return (
    <div className="card">
      {block.title && <div className="section-heading">{block.title}</div>}
      <div className="block-list">
        {d.items.map((item, i) => (
          <a key={i} href={`${base}/more/${username}/l/contact-${item.type}`} className="link-item">{item.label}</a>
        ))}
      </div>
    </div>
  )
}

function QRBlock({ username, base }: { username: string; base: string }) {
  return (
    <div className="card qr-box">
      <div className="section-heading">QR Code</div>
      <img src={`/more/${username}/qr`} alt="QR code"
        style={{ maxWidth: 160, display: 'block', margin: '0 auto' }} />
    </div>
  )
}

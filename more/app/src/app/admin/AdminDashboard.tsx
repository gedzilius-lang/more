'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

interface CardRow {
  id: string; username: string; email: string; displayName: string | null
  published: boolean; createdAt: string
}
interface InviteRow {
  id: string; email: string; expiresAt: string; used: boolean; createdAt: string
}
interface Props {
  adminEmail: string
  initialCards: CardRow[]
  initialInvites: InviteRow[]
}

export default function AdminDashboard({ adminEmail, initialCards, initialInvites }: Props) {
  const [tab, setTab] = useState<'cards' | 'invites'>('cards')
  const [cards, setCards] = useState(initialCards)
  const [invites, setInvites] = useState(initialInvites)
  const [search, setSearch] = useState('')
  const [inviteEmail, setInviteEmail] = useState('')
  const [inviteUrl, setInviteUrl] = useState('')
  const [sendInvEmail, setSendInvEmail] = useState(true)
  const [msg, setMsg] = useState('')
  const [msgOk, setMsgOk] = useState(true)
  const [pending, start] = useTransition()
  const router = useRouter()

  const filtered = cards.filter(c =>
    !search || c.username.includes(search.toLowerCase()) || c.email.includes(search.toLowerCase())
  )

  function flash(text: string, ok = true) {
    setMsg(text); setMsgOk(ok); setTimeout(() => setMsg(''), 4000)
  }

  async function togglePublished(id: string, current: boolean) {
    start(async () => {
      const r = await fetch(`/api/admin/cards/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'update', published: !current }),
      })
      if (r.ok) {
        setCards(prev => prev.map(c => c.id === id ? { ...c, published: !current } : c))
      } else flash('Failed to update', false)
    })
  }

  async function sendReset(id: string) {
    start(async () => {
      const r = await fetch(`/api/admin/cards/${id}`, {
        method: 'PATCH', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reset' }),
      })
      const d = await r.json()
      flash(r.ok ? 'Reset email sent' : (d.error ?? 'Failed'), r.ok)
    })
  }

  async function createInvite(e: React.FormEvent) {
    e.preventDefault()
    start(async () => {
      const r = await fetch('/api/admin/invites', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: inviteEmail, sendEmail: sendInvEmail }),
      })
      const d = await r.json()
      if (r.ok) {
        setInviteUrl(d.inviteUrl)
        setInviteEmail('')
        const ir = await fetch('/api/admin/invites')
        if (ir.ok) setInvites(await ir.json())
        flash(sendInvEmail ? 'Invite created and emailed' : 'Invite created — copy URL below')
      } else flash(d.error ?? 'Failed', false)
    })
  }

  async function logout() {
    await fetch('/api/admin/logout', { method: 'POST' })
    router.push('/admin/login')
    router.refresh()
  }

  const thStyle: React.CSSProperties = {
    textAlign: 'left', padding: '8px 12px', color: 'var(--muted)', fontWeight: 600, fontSize: 12,
    borderBottom: '1px solid var(--border)',
  }
  const tdStyle: React.CSSProperties = { padding: '10px 12px', fontSize: 13 }

  return (
    <div style={{ minHeight: '100vh', padding: '20px 16px', maxWidth: 960, margin: '0 auto' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, fontWeight: 700, color: 'var(--accent)' }}>PWL Admin</h1>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16 }}>
          <span style={{ color: 'var(--muted)', fontSize: 13 }}>{adminEmail}</span>
          <button className="btn" onClick={logout} style={{ padding: '6px 14px', fontSize: 13 }}>Logout</button>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24 }}>
        {(['cards', 'invites'] as const).map(t => (
          <button key={t} onClick={() => setTab(t)}
            style={{
              padding: '8px 20px', cursor: 'pointer', border: 'none', borderRadius: 6,
              background: tab === t ? 'var(--accent)' : 'transparent',
              color: tab === t ? '#000' : 'var(--muted)', fontWeight: tab === t ? 700 : 400,
              textTransform: 'capitalize', fontSize: 14,
            }}>
            {t === 'cards' ? `Cards (${cards.length})` : `Invites (${invites.length})`}
          </button>
        ))}
      </div>

      {msg && (
        <div style={{
          padding: '10px 16px', marginBottom: 16, borderRadius: 8, fontSize: 14,
          background: msgOk ? '#00ff9922' : '#ff003322',
          color: msgOk ? 'var(--accent)' : '#ff6666',
          border: '1px solid currentColor',
        }}>{msg}</div>
      )}

      {tab === 'cards' && (
        <>
          <input className="input" placeholder="Search username or email…"
            value={search} onChange={e => setSearch(e.target.value)}
            style={{ marginBottom: 16, maxWidth: 400 }} />
          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Username', 'Email', 'Name', 'Status', 'Created', 'Actions'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(card => (
                  <tr key={card.id}>
                    <td style={tdStyle}>
                      <a href={`/more/${card.username}`} target="_blank" rel="noopener"
                        style={{ color: 'var(--accent)', textDecoration: 'none', fontWeight: 600 }}>
                        {card.username}
                      </a>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>{card.email}</td>
                    <td style={tdStyle}>{card.displayName ?? '—'}</td>
                    <td style={tdStyle}>
                      <button onClick={() => togglePublished(card.id, card.published)} disabled={pending}
                        style={{
                          background: card.published ? '#00ff9933' : 'var(--border)',
                          color: card.published ? 'var(--accent)' : 'var(--muted)',
                          border: `1px solid ${card.published ? 'var(--accent)' : 'var(--border)'}`,
                          borderRadius: 4, padding: '3px 10px', cursor: 'pointer', fontSize: 12,
                        }}>
                        {card.published ? 'Live' : 'Hidden'}
                      </button>
                    </td>
                    <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                      {new Date(card.createdAt).toLocaleDateString()}
                    </td>
                    <td style={tdStyle}>
                      <div style={{ display: 'flex', gap: 6 }}>
                        <a href={`/more/${card.username}/admin`} className="btn"
                          style={{ padding: '4px 10px', fontSize: 11 }}>Edit</a>
                        <button onClick={() => sendReset(card.id)} className="btn" disabled={pending}
                          style={{ padding: '4px 10px', fontSize: 11 }}>Reset</button>
                      </div>
                    </td>
                  </tr>
                ))}
                {filtered.length === 0 && (
                  <tr>
                    <td colSpan={6} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No cards found
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}

      {tab === 'invites' && (
        <>
          <div className="card" style={{ marginBottom: 24 }}>
            <h3 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700 }}>Create Invite Link</h3>
            <form onSubmit={createInvite} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label className="label">Friend's email address</label>
                <input className="input" type="email" value={inviteEmail}
                  onChange={e => setInviteEmail(e.target.value)} required
                  placeholder="friend@example.com" />
              </div>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, cursor: 'pointer', fontSize: 13 }}>
                <input type="checkbox" checked={sendInvEmail}
                  onChange={e => setSendInvEmail(e.target.checked)} />
                <span style={{ color: 'var(--muted)' }}>Email the invite link to them</span>
              </label>
              <button className="btn btn-primary" type="submit" disabled={pending}
                style={{ alignSelf: 'flex-start' }}>
                {pending ? 'Creating…' : 'Generate Invite'}
              </button>
            </form>
            {inviteUrl && (
              <div style={{ marginTop: 16, padding: 14, background: 'var(--surface2)', borderRadius: 8 }}>
                <p style={{ margin: '0 0 8px', fontSize: 13, color: 'var(--muted)' }}>
                  Copy and share this invite link:
                </p>
                <code style={{ fontSize: 12, color: 'var(--accent)', wordBreak: 'break-all', display: 'block', marginBottom: 8 }}>
                  {inviteUrl}
                </code>
                <button onClick={() => { navigator.clipboard.writeText(inviteUrl); flash('Copied!') }}
                  className="btn" style={{ padding: '4px 12px', fontSize: 12 }}>
                  Copy URL
                </button>
              </div>
            )}
          </div>

          <div style={{ overflowX: 'auto', borderRadius: 8, border: '1px solid var(--border)' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr>
                  {['Email', 'Expires', 'Status', 'Created'].map(h => (
                    <th key={h} style={thStyle}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {invites.map(inv => {
                  const expired = new Date(inv.expiresAt) < new Date()
                  const status = inv.used ? 'Used' : expired ? 'Expired' : 'Pending'
                  const statusColor = inv.used ? 'var(--muted)' : expired ? '#f87171' : 'var(--accent)'
                  return (
                    <tr key={inv.id}>
                      <td style={tdStyle}>{inv.email}</td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                        {new Date(inv.expiresAt).toLocaleDateString()}
                      </td>
                      <td style={{ ...tdStyle, color: statusColor, fontWeight: 600, fontSize: 12 }}>
                        {status}
                      </td>
                      <td style={{ ...tdStyle, color: 'var(--muted)' }}>
                        {new Date(inv.createdAt).toLocaleDateString()}
                      </td>
                    </tr>
                  )
                })}
                {invites.length === 0 && (
                  <tr>
                    <td colSpan={4} style={{ padding: 24, textAlign: 'center', color: 'var(--muted)' }}>
                      No invites yet
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}

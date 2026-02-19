'use client'

import { useState, useRef, useTransition } from "react"
import { v4 as uuidv4 } from "uuid"
import type { CardConfig, Block } from "@/lib/schema"

interface Analytics {
  clicksTotal: number; viewsTotal: number
  topLinks: Array<{ key: string; count: number }>
  dailyTrend: Array<{ date: string; count: number }>
}
interface Props {
  username: string; cardId: string; config: CardConfig
  analytics: Analytics; base: string; isAdmin?: boolean
}

export default function AdminDashboard({ username, config: initialConfig, analytics, base, isAdmin }: Props) {
  const [config, setConfig] = useState<CardConfig>(initialConfig)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [tab, setTab] = useState<'editor' | 'analytics' | 'qr' | 'security'>('editor')
  const fileRef = useRef<HTMLInputElement>(null)
  const [uploadingIdx, setUploadingIdx] = useState<number | null>(null)

  // security tab state
  const [curPin, setCurPin] = useState('')
  const [newPin, setNewPin] = useState('')
  const [confirmPin, setConfirmPin] = useState('')
  const [pinMsg, setPinMsg] = useState('')
  const [pinOk, setPinOk] = useState(true)
  const [pinPending, startPin] = useTransition()

  async function saveConfig(next: CardConfig) {
    setSaving(true); setMsg('')
    try {
      const r = await fetch(`/api/card/${username}/config`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(next),
      })
      if (!r.ok) { const e = await r.json(); setMsg('Error: ' + (e.error || r.status)) }
      else { setMsg('Saved!'); setTimeout(() => setMsg(''), 2000) }
    } catch { setMsg('Network error') }
    setSaving(false)
  }

  function updateBlock(idx: number, patch: Partial<Block>) {
    const blocks = config.blocks.map((b, i) => i === idx ? { ...b, ...patch } as Block : b)
    setConfig({ ...config, blocks })
  }

  function moveBlock(idx: number, dir: -1 | 1) {
    const blocks = [...config.blocks]
    const j = idx + dir
    if (j < 0 || j >= blocks.length) return
    ;[blocks[idx], blocks[j]] = [blocks[j], blocks[idx]]
    const next = { ...config, blocks }
    setConfig(next); saveConfig(next)
  }

  function deleteBlock(idx: number) {
    if (!confirm('Delete this block?')) return
    const blocks = config.blocks.filter((_, i) => i !== idx)
    const next = { ...config, blocks }
    setConfig(next); saveConfig(next)
  }

  function addBlock(type: Block['type']) {
    let b: Block
    if (type === 'profile') b = { id: uuidv4(), type: 'profile', name: '', bio: '', avatar: '' }
    else if (type === 'link') b = { id: uuidv4(), type: 'link', key: uuidv4().slice(0, 8), label: 'New Link', url: '', icon: '' }
    else if (type === 'text') b = { id: uuidv4(), type: 'text', markdown: '' }
    else if (type === 'image') b = { id: uuidv4(), type: 'image', src: '', alt: '' }
    else if (type === 'contact') b = { id: uuidv4(), type: 'contact', email: '', phone: '' }
    else b = { id: uuidv4(), type: 'qr' } as Block
    const blocks = [...config.blocks, b]
    const next = { ...config, blocks }
    setConfig(next); saveConfig(next)
  }

  async function handleUpload(idx: number, file: File) {
    setUploadingIdx(idx); setMsg('')
    const fd = new FormData(); fd.append('file', file)
    try {
      const r = await fetch(`/api/card/${username}/upload`, { method: 'POST', body: fd })
      if (!r.ok) { const e = await r.json(); setMsg('Upload error: ' + (e.error || r.status)); setUploadingIdx(null); return }
      const { variants } = await r.json()
      const src = variants['512'] || variants['256'] || Object.values(variants)[0] as string
      const blocks = config.blocks.map((b, i) => {
        if (i !== idx) return b
        if (b.type === 'profile') return { ...b, avatar: src }
        if (b.type === 'image') return { ...b, src }
        return b
      })
      const next = { ...config, blocks }
      setConfig(next); saveConfig(next)
    } catch { setMsg('Upload failed') }
    setUploadingIdx(null)
  }

  async function changePincode(e: React.FormEvent) {
    e.preventDefault()
    if (newPin !== confirmPin) { setPinOk(false); setPinMsg('Pincodes do not match'); return }
    if (newPin.length < 4) { setPinOk(false); setPinMsg('Pincode must be at least 4 characters'); return }
    setPinMsg('')
    startPin(async () => {
      const r = await fetch(`/api/card/${username}/pincode`, {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ currentPincode: curPin, newPincode: newPin }),
      })
      const d = await r.json()
      if (r.ok) {
        setPinOk(true); setPinMsg('Pincode changed successfully!')
        setCurPin(''); setNewPin(''); setConfirmPin('')
        setTimeout(() => setPinMsg(''), 3000)
      } else {
        setPinOk(false); setPinMsg(d.error ?? 'Failed to change pincode')
      }
    })
  }

  const tabStyle = (active: boolean): React.CSSProperties => ({
    padding: '8px 20px', cursor: 'pointer', border: 'none',
    background: active ? 'var(--accent)' : 'transparent',
    color: active ? '#000' : 'var(--muted)', borderRadius: 6, fontWeight: active ? 700 : 400,
  })

  return (
    <div style={{ maxWidth: 'var(--max-w)', margin: '0 auto', padding: '24px 16px' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 22, color: 'var(--accent)' }}>/{username} Admin</h1>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          {isAdmin && (
            <a href="/admin" style={{ color: 'var(--accent)', fontSize: 13, fontWeight: 700 }}>
              Admin Panel
            </a>
          )}
          <a href={`/more/${username}`} style={{ color: 'var(--accent)', fontSize: 14 }}>View card</a>
        </div>
      </div>

      <div style={{ display: 'flex', gap: 8, marginBottom: 24, flexWrap: 'wrap' }}>
        <button style={tabStyle(tab === 'editor')} onClick={() => setTab('editor')}>Editor</button>
        <button style={tabStyle(tab === 'analytics')} onClick={() => setTab('analytics')}>Analytics</button>
        <button style={tabStyle(tab === 'qr')} onClick={() => setTab('qr')}>QR Code</button>
        <button style={tabStyle(tab === 'security')} onClick={() => setTab('security')}>Security</button>
      </div>

      {msg && (
        <div style={{ padding: '10px 16px', marginBottom: 16, borderRadius: 8,
          background: msg.startsWith('Error') ? '#ff003322' : '#00ff9922',
          color: msg.startsWith('Error') ? '#ff4444' : 'var(--accent)', border: '1px solid currentColor' }}>
          {msg}
        </div>
      )}

      {tab === 'editor' && (
        <div>
          <div style={{ marginBottom: 20 }}>
            <label style={{ display: 'block', marginBottom: 6, color: 'var(--muted)', fontSize: 13 }}>Theme</label>
            <select
              value={config.theme || 'dark'}
              onChange={e => setConfig({ ...config, theme: e.target.value as CardConfig['theme'] })}
              className="input"
              style={{ width: 'auto', minWidth: 140 }}
            >
              <option value="dark">Dark</option>
              <option value="light">Light</option>
              <option value="neon">Neon</option>
            </select>
          </div>

          {config.blocks.map((block, idx) => (
            <div key={block.id} className="card" style={{ marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
                <span style={{ fontSize: 12, color: 'var(--muted)', textTransform: 'uppercase', letterSpacing: 1 }}>
                  {block.type}
                </span>
                <div style={{ display: 'flex', gap: 6 }}>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => moveBlock(idx, -1)}>up</button>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }} onClick={() => moveBlock(idx, 1)}>dn</button>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12 }}
                    onClick={() => {
                      const blocks = config.blocks.map((b, i) =>
                        i === idx ? { ...b, hidden: !('hidden' in b && (b as any).hidden) } as Block : b
                      )
                      const next = { ...config, blocks }
                      setConfig(next); saveConfig(next)
                    }}>
                    {'hidden' in block && (block as any).hidden ? 'show' : 'hide'}
                  </button>
                  <button className="btn" style={{ padding: '2px 8px', fontSize: 12, color: '#ff4444' }} onClick={() => deleteBlock(idx)}>del</button>
                </div>
              </div>

              {block.type === 'profile' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <input className="input" placeholder="Display name" value={block.name}
                    onChange={e => updateBlock(idx, { name: e.target.value })} />
                  <textarea className="input" placeholder="Bio" rows={3} value={block.bio || ''}
                    onChange={e => updateBlock(idx, { bio: e.target.value })}
                    style={{ resize: 'vertical', fontFamily: 'inherit' }} />
                  <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                    {block.avatar && <img src={block.avatar} alt="" style={{ width: 48, height: 48, borderRadius: '50%', objectFit: 'cover' }} />}
                    <button className="btn" style={{ fontSize: 13 }}
                      onClick={() => { setUploadingIdx(idx); fileRef.current?.click() }}
                      disabled={uploadingIdx === idx}>{uploadingIdx === idx ? 'Uploading...' : 'Upload avatar'}</button>
                  </div>
                </div>
              )}

              {block.type === 'link' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="input" placeholder="Label" value={block.label}
                    onChange={e => updateBlock(idx, { label: e.target.value })} />
                  <input className="input" placeholder="URL (https://...)" value={block.url}
                    onChange={e => updateBlock(idx, { url: e.target.value })} />
                  <input className="input" placeholder="Icon emoji (optional)" value={block.icon || ''}
                    onChange={e => updateBlock(idx, { icon: e.target.value })} />
                </div>
              )}

              {block.type === 'text' && (
                <textarea className="input" placeholder="Markdown text..." rows={4} value={block.markdown}
                  onChange={e => updateBlock(idx, { markdown: e.target.value })}
                  style={{ resize: 'vertical', fontFamily: 'monospace', fontSize: 13 }} />
              )}

              {block.type === 'image' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  {block.src && <img src={block.src} alt={block.alt || ''} style={{ maxWidth: '100%', borderRadius: 8, maxHeight: 200, objectFit: 'cover' }} />}
                  <button className="btn" style={{ fontSize: 13 }}
                    onClick={() => { setUploadingIdx(idx); fileRef.current?.click() }}
                    disabled={uploadingIdx === idx}>{uploadingIdx === idx ? 'Uploading...' : 'Upload image'}</button>
                  <input className="input" placeholder="Alt text" value={block.alt || ''}
                    onChange={e => updateBlock(idx, { alt: e.target.value })} />
                </div>
              )}

              {block.type === 'contact' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                  <input className="input" placeholder="Email" value={block.email || ''}
                    onChange={e => updateBlock(idx, { email: e.target.value })} />
                  <input className="input" placeholder="Phone" value={block.phone || ''}
                    onChange={e => updateBlock(idx, { phone: e.target.value })} />
                </div>
              )}

              {block.type === 'qr' && (
                <p style={{ margin: 0, color: 'var(--muted)', fontSize: 13 }}>QR code block auto-generated from your card URL.</p>
              )}

              <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 12 }}>
                <button className="btn" onClick={() => saveConfig(config)} disabled={saving} style={{ fontSize: 13 }}>
                  {saving ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          ))}

          <div style={{ marginTop: 20 }}>
            <p style={{ color: 'var(--muted)', fontSize: 13, marginBottom: 10 }}>Add block:</p>
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
              {(['profile', 'link', 'text', 'image', 'contact', 'qr'] as Block['type'][]).map(t => (
                <button key={t} className="btn" style={{ fontSize: 13 }} onClick={() => addBlock(t)}>{t}</button>
              ))}
            </div>
          </div>

          <input ref={fileRef} type="file" accept="image/*" style={{ display: 'none' }}
            onChange={e => {
              const file = e.target.files?.[0]
              if (file && uploadingIdx !== null) handleUpload(uploadingIdx, file)
              e.target.value = ''
            }} />
        </div>
      )}

      {tab === 'analytics' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginBottom: 24 }}>
            <div className="stat-box">
              <div className="stat-value">{analytics.viewsTotal}</div>
              <div className="stat-label">Total Views</div>
            </div>
            <div className="stat-box">
              <div className="stat-value">{analytics.clicksTotal}</div>
              <div className="stat-label">Total Clicks</div>
            </div>
          </div>

          {analytics.dailyTrend.length > 0 && (
            <div className="card" style={{ marginBottom: 20 }}>
              <h3 style={{ margin: '0 0 16px', fontSize: 14, color: 'var(--muted)' }}>Last 7 days</h3>
              <div style={{ display: 'flex', alignItems: 'flex-end', gap: 8, height: 80 }}>
                {analytics.dailyTrend.map(({ date, count }) => {
                  const max = Math.max(...analytics.dailyTrend.map(d => d.count), 1)
                  const h = Math.round((count / max) * 70)
                  return (
                    <div key={date} style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
                      <div style={{ width: '100%', height: h, background: 'var(--accent)', borderRadius: 3, minHeight: 2 }} />
                      <span style={{ fontSize: 10, color: 'var(--muted)' }}>{date.slice(5)}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {analytics.topLinks.length > 0 && (
            <div className="card">
              <h3 style={{ margin: '0 0 12px', fontSize: 14, color: 'var(--muted)' }}>Top Links</h3>
              {analytics.topLinks.map(({ key, count }) => (
                <div key={key} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                  <span style={{ fontSize: 13 }}>{key}</span>
                  <span style={{ color: 'var(--accent)', fontWeight: 700 }}>{count}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {tab === 'qr' && (
        <div className="card" style={{ textAlign: 'center' }}>
          <p style={{ color: 'var(--muted)', marginBottom: 20 }}>Your NFC card QR code</p>
          <img src={`/more/${username}/qr`} alt="QR code" style={{ width: 256, height: 256, display: 'block', margin: '0 auto 20px' }} />
          <div style={{ display: 'flex', gap: 12, justifyContent: 'center' }}>
            <a href={`/more/${username}/qr`} download={`${username}-qr.svg`} className="btn">Download SVG</a>
            <a href={`/more/${username}`} target="_blank" rel="noopener" className="btn">View Card</a>
          </div>
          <p style={{ marginTop: 20, color: 'var(--muted)', fontSize: 13 }}>
            Card URL: <code style={{ color: 'var(--accent)' }}>{base}/more/{username}</code>
          </p>
        </div>
      )}

      {tab === 'security' && (
        <div>
          <div className="card" style={{ marginBottom: 20 }}>
            <h3 style={{ margin: '0 0 16px', fontWeight: 700, fontSize: 16 }}>Change Pincode</h3>
            <form onSubmit={changePincode} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div className="field">
                <label className="label">Current pincode</label>
                <input className="input" type="password" value={curPin}
                  onChange={e => setCurPin(e.target.value)} placeholder="Enter current pincode" />
              </div>
              <div className="field">
                <label className="label">New pincode</label>
                <input className="input" type="password" value={newPin}
                  onChange={e => setNewPin(e.target.value)} minLength={4} required
                  placeholder="Min 4 characters" />
              </div>
              <div className="field">
                <label className="label">Confirm new pincode</label>
                <input className="input" type="password" value={confirmPin}
                  onChange={e => setConfirmPin(e.target.value)} minLength={4} required
                  placeholder="Repeat new pincode" />
              </div>
              {pinMsg && (
                <div style={{
                  padding: '10px 14px', borderRadius: 8,
                  background: pinOk ? '#00ff9922' : '#ff003322',
                  color: pinOk ? 'var(--accent)' : '#ff6666',
                  border: '1px solid currentColor', fontSize: 14,
                }}>{pinMsg}</div>
              )}
              <button className="btn btn-primary" type="submit" disabled={pinPending}
                style={{ alignSelf: 'flex-start' }}>
                {pinPending ? 'Saving...' : 'Change Pincode'}
              </button>
            </form>
          </div>

          <div className="card">
            <h3 style={{ margin: '0 0 12px', fontWeight: 700, fontSize: 16 }}>Forgot your pincode?</h3>
            <p style={{ color: 'var(--muted)', fontSize: 14, marginBottom: 16 }}>
              Request a reset link to be sent to your registered email address.
            </p>
            <a href={`/more/${username}/reset`} className="btn">
              Send reset email
            </a>
          </div>
        </div>
      )}
    </div>
  )
}

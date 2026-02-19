'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function RegisterForm({ token }: { token: string }) {
  const [username, setUsername] = useState('')
  const [displayName, setDisplayName] = useState('')
  const [pincode, setPincode] = useState('')
  const [confirm, setConfirm] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    if (pincode !== confirm) { setError('Pincodes do not match'); return }
    setError('')
    start(async () => {
      const res = await fetch(`/api/invite/${token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username, displayName, pincode }),
      })
      const d = await res.json()
      if (res.ok) {
        router.push(`/more/${d.username}/admin`)
      } else {
        setError(d.error ?? 'Registration failed')
      }
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="label">Choose your username</label>
        <input className="input" value={username}
          onChange={e => setUsername(e.target.value.toLowerCase())}
          pattern="[a-z0-9_-]{3,30}" placeholder="e.g. janedoe" required
          title="3-30 chars: letters, numbers, _ or -" />
        {username && (
          <p style={{ fontSize: 11, color: 'var(--muted)', margin: '4px 0 0' }}>
            Your card: more.peoplewelike.club/more/{username}
          </p>
        )}
      </div>
      <div className="field">
        <label className="label">Display name (optional)</label>
        <input className="input" value={displayName} onChange={e => setDisplayName(e.target.value)}
          placeholder="Jane Doe" />
      </div>
      <div className="field">
        <label className="label">Set pincode</label>
        <input className="input" type="password" value={pincode}
          onChange={e => setPincode(e.target.value)} minLength={4} required
          placeholder="min 4 characters" />
      </div>
      <div className="field">
        <label className="label">Confirm pincode</label>
        <input className="input" type="password" value={confirm}
          onChange={e => setConfirm(e.target.value)} minLength={4} required
          placeholder="repeat pincode" />
      </div>
      {error && <div className="msg-error">{error}</div>}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={pending}>
        {pending ? 'Creating card...' : 'Create My Card'}
      </button>
    </form>
  )
}

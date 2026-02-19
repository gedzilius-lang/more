'use client'

import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function LoginForm({ username }: { username: string }) {
  const [email, setEmail] = useState('')
  const [pin, setPin] = useState('')
  const [error, setError] = useState('')
  const [pending, startTransition] = useTransition()
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    startTransition(async () => {
      const res = await fetch(`/more/${username}/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, pincode: pin }),
      })
      if (res.ok) {
        router.push(`/more/${username}/admin`)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Invalid credentials')
      }
    })
  }

  return (
    <form onSubmit={submit}>
      <div className="field">
        <label className="label">Email</label>
        <input className="input" type="email" autoComplete="email"
          value={email} onChange={e => setEmail(e.target.value)} required />
      </div>
      <div className="field">
        <label className="label">Pincode</label>
        <input className="input" type="password" autoComplete="current-password"
          value={pin} onChange={e => setPin(e.target.value)} required />
      </div>
      {error && <div className="msg-error">{error}</div>}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={pending}>
        {pending ? 'Logging in…' : 'Login'}
      </button>
    </form>
  )
}

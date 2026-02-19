'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function AdminLoginForm() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  async function submit(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    start(async () => {
      const res = await fetch('/api/admin/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      })
      if (res.ok) {
        router.push('/admin')
        router.refresh()
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Login failed')
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
        <label className="label">Password</label>
        <input className="input" type="password" autoComplete="current-password"
          value={password} onChange={e => setPassword(e.target.value)} required />
      </div>
      {error && <div className="msg-error">{error}</div>}
      <button className="btn btn-primary" style={{ width: '100%', marginTop: 16 }} disabled={pending}>
        {pending ? 'Logging in...' : 'Login'}
      </button>
    </form>
  )
}

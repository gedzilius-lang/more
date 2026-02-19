'use client'
import { useState, useTransition } from 'react'
import { useRouter } from 'next/navigation'

export default function ResetTokenPage({ params }: { params: { username: string; token: string } }) {
  const [done, setDone] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()
  const router = useRouter()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const pin = (e.currentTarget.elements.namedItem('pincode') as HTMLInputElement).value
    start(async () => {
      const res = await fetch(`/api/card/${params.username}/reset/${params.token}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pincode: pin }),
      })
      if (res.ok) {
        setDone(true)
        setTimeout(() => router.push(`/more/${params.username}/login`), 2000)
      } else {
        const d = await res.json().catch(() => ({}))
        setError(d.error ?? 'Invalid or expired token')
      }
    })
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div className="card">
        <h2 style={{ marginBottom: 16, fontWeight: 700 }}>Set New Pincode</h2>
        {done ? (
          <p className="msg-ok">Pincode updated! Redirecting...</p>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label className="label">New Pincode</label>
              <input name="pincode" className="input" type="password" minLength={4} required />
            </div>
            {error && <div className="msg-error">{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={pending}>
              {pending ? 'Saving...' : 'Set Pincode'}
            </button>
          </form>
        )}
      </div>
    </div>
  )
}

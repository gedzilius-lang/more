'use client'
import { useState, useTransition } from 'react'

export default function ResetPage({ params }: { params: { username: string } }) {
  const [sent, setSent] = useState(false)
  const [error, setError] = useState('')
  const [pending, start] = useTransition()

  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault()
    setError('')
    const email = (e.currentTarget.elements.namedItem('email') as HTMLInputElement).value
    start(async () => {
      const res = await fetch(`/more/${params.username}/reset`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email }),
      })
      if (res.ok) setSent(true)
      else setError('Could not send reset email')
    })
  }

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div className="card">
        <h2 style={{ marginBottom: 16, fontWeight: 700 }}>Reset Pincode</h2>
        {sent ? (
          <p className="msg-ok">Reset email sent — check your inbox.</p>
        ) : (
          <form onSubmit={submit}>
            <div className="field">
              <label className="label">Your email</label>
              <input name="email" className="input" type="email" required />
            </div>
            {error && <div className="msg-error">{error}</div>}
            <button className="btn btn-primary" style={{ width: '100%', marginTop: 12 }} disabled={pending}>
              {pending ? 'Sending…' : 'Send reset link'}
            </button>
          </form>
        )}
      </div>
      <div className="card-footer">
        <a href={`/more/${params.username}/login`}>← back to login</a>
      </div>
    </div>
  )
}

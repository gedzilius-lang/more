import { redirect } from 'next/navigation'
import { requireAuth } from '@/lib/session'
import LoginForm from './LoginForm'

interface Props { params: { username: string } }

export default async function LoginPage({ params }: Props) {
  const session = await requireAuth(params.username)
  if (session) redirect(`/more/${params.username}/admin`)

  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div style={{ marginBottom: 24, textAlign: 'center' }}>
        <div style={{ fontSize: 13, color: 'var(--text3)', marginBottom: 4 }}>peoplewelike</div>
        <h1 style={{ fontSize: 22, fontWeight: 700 }}>
          <span style={{ color: 'var(--accent)' }}>@{params.username}</span>
        </h1>
      </div>
      <div className="card">
        <LoginForm username={params.username} />
      </div>
      <div className="card-footer">
        <a href={`/more/${params.username}`}>← back to card</a>
        {' · '}
        <a href={`/more/${params.username}/reset`}>forgot pincode?</a>
      </div>
    </div>
  )
}

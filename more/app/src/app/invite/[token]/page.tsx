import { notFound } from 'next/navigation'
import RegisterForm from './RegisterForm'

export const dynamic = 'force-dynamic'

interface Props { params: { token: string } }

export default async function InvitePage({ params }: Props) {
  const base = process.env.NEXT_PUBLIC_BASE_URL ?? 'https://more.peoplewelike.club'
  const res = await fetch(`${base}/api/invite/${params.token}`, { cache: 'no-store' })
  if (!res.ok) notFound()
  const { email } = await res.json()

  return (
    <div className="page" style={{ maxWidth: 440 }}>
      <div className="card card-glow">
        <h2 style={{ marginBottom: 8, fontWeight: 700 }}>Welcome to PeopleWeLike</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>
          Create your digital business card.
        </p>
        <p style={{ fontSize: 13, marginBottom: 20 }}>
          Registering for: <strong style={{ color: 'var(--accent)' }}>{email}</strong>
        </p>
        <RegisterForm token={params.token} />
      </div>
    </div>
  )
}

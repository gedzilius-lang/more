import AdminLoginForm from './AdminLoginForm'

export const dynamic = 'force-dynamic'

export default function AdminLoginPage() {
  return (
    <div className="page" style={{ maxWidth: 400 }}>
      <div className="card">
        <h2 style={{ marginBottom: 4, fontWeight: 700 }}>Admin Login</h2>
        <p style={{ color: 'var(--muted)', marginBottom: 20, fontSize: 14 }}>PeopleWeLike admin panel</p>
        <AdminLoginForm />
      </div>
    </div>
  )
}

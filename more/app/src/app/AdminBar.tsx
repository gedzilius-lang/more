'use client'
import { useEffect, useState } from 'react'

export default function AdminBar() {
  const [isAdmin, setIsAdmin] = useState(false)

  useEffect(() => {
    fetch('/api/admin/me').then(r => r.json()).then(d => {
      if (d.isAdmin) setIsAdmin(true)
    }).catch(() => {})
  }, [])

  if (!isAdmin) return null

  return (
    <div style={{
      position: 'fixed', top: 0, left: 0, right: 0, zIndex: 9999,
      background: 'var(--accent)', color: '#000',
      padding: '6px 16px', fontSize: 13, fontWeight: 700,
      display: 'flex', justifyContent: 'space-between', alignItems: 'center',
    }}>
      <span>Admin mode</span>
      <a href="/admin" style={{ color: '#000', textDecoration: 'none', fontWeight: 700 }}>
        Admin Panel →
      </a>
    </div>
  )
}

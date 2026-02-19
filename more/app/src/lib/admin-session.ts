import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface AdminSessionData {
  isAdmin: boolean
  email: string
}

const adminSessionOptions = {
  cookieName: 'pwl-admin-session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 8, // 8 hours
  },
}

export async function getAdminSession(): Promise<IronSession<AdminSessionData>> {
  return getIronSession<AdminSessionData>(await cookies(), adminSessionOptions)
}

export async function requireAdminAuth(): Promise<AdminSessionData | null> {
  const session = await getAdminSession()
  if (!session.isAdmin) return null
  return { isAdmin: true, email: session.email }
}

import { getIronSession, IronSession } from 'iron-session'
import { cookies } from 'next/headers'

export interface SessionData {
  username: string
  cardId: string
}

const sessionOptions = {
  cookieName: 'pwl-more-session',
  password: process.env.SESSION_SECRET!,
  cookieOptions: {
    secure: process.env.NODE_ENV === 'production',
    httpOnly: true,
    sameSite: 'lax' as const,
    maxAge: 60 * 60 * 24 * 7,
  },
}

export async function getSession(): Promise<IronSession<SessionData>> {
  return getIronSession<SessionData>(await cookies(), sessionOptions)
}

export async function requireAuth(username: string): Promise<SessionData | null> {
  const session = await getSession()
  if (!session.username || session.username !== username) return null
  return { username: session.username, cardId: session.cardId }
}

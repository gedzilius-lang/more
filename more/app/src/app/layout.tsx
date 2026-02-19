import type { Metadata } from 'next'
import '../styles/tokens.css'
import '../styles/ui.css'

export const metadata: Metadata = {
  title: 'PeopleWeLike',
  description: 'Digital business cards by PeopleWeLike',
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
        <meta name="theme-color" content="#0a0a0a" />
      </head>
      <body>{children}</body>
    </html>
  )
}

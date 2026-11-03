import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Geist } from 'next/font/google'
import { StartLightsIntro } from '@/components/start-lights-intro'
import './globals.css'
import './styles/effects.css'
import './styles/header.css'
import './styles/home.css'
import './styles/stats.css'
import './styles/leaderboard.css'
import './styles/prediction.css'
import './styles/picks.css'
import './styles/calendar.css'
import './styles/admin.css'
import './styles/mobile-menu.css'

const body = Geist({ subsets: ['latin'], variable: '--font-body' })
const display = Barlow_Condensed({
  subsets: ['latin'],
  variable: '--font-display',
  weight: ['600', '700', '800', '900'],
})

export const metadata: Metadata = {
  title: { default: 'Redline', template: '%s | Redline' },
  description:
    'Predict every qualifying and race top 10, score exact-position points, and compete for the Redline championship.',
  icons: {
    icon: [
      { url: '/icon.svg', type: 'image/svg+xml' },
      { url: '/images/brand/redline-logo-icon.svg', type: 'image/svg+xml' },
    ],
    apple: '/apple-icon.png',
  },
}

export const viewport: Viewport = {
  themeColor: '#0b0b0d',
  colorScheme: 'dark',
  userScalable: true,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en" data-scroll-behavior="smooth" className="bg-background">
      <body className={`${body.variable} ${display.variable} font-sans antialiased`}>
        <StartLightsIntro />
        {children}
        {process.env.NODE_ENV === 'production' && <Analytics />}
      </body>
    </html>
  )
}

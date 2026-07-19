import { Analytics } from '@vercel/analytics/next'
import type { Metadata, Viewport } from 'next'
import { Barlow_Condensed, Geist } from 'next/font/google'
import './globals.css'
const body = Geist({ subsets: ['latin'], variable: '--font-body' })
const display = Barlow_Condensed({ subsets: ['latin'], variable: '--font-display', weight: ['600','700','800','900'] })
export const metadata: Metadata = { title: { default: 'Redline — F1 Prediction Championship', template: '%s | Redline' }, description: 'Predict every qualifying and race top 10, score exact-position points, and compete for the Redline championship.' }
export const viewport: Viewport = { themeColor: '#0b0b0d', colorScheme: 'dark', userScalable: true }
export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) { return <html lang="en" className="bg-background"><body className={`${body.variable} ${display.variable} font-sans antialiased`}>{children}{process.env.NODE_ENV === 'production' && <Analytics />}</body></html> }

import Link from 'next/link'
import { ArrowRight } from 'lucide-react'
import { SiteHeader } from '@/components/site-header'

export default function NotFound() {
  return (
    <>
      <SiteHeader />
      <main className="mx-auto flex min-h-[60vh] max-w-3xl flex-col items-start justify-center gap-5 px-4">
        <p className="eyebrow">ERROR 404 · OFF TRACK</p>
        <h1 className="font-mono text-6xl font-black uppercase italic md:text-8xl">Red flag.</h1>
        <p className="text-muted-foreground">That page does not exist or has been moved. Head back to the pit lane.</p>
        <Link href="/" className="button-primary h-12">Back to home <ArrowRight /></Link>
      </main>
    </>
  )
}

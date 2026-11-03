'use client'
import { useEffect, useRef } from 'react'
import { usePathname } from 'next/navigation'
import Lenis from 'lenis'

export function SmoothScroll() {
  const lenisRef = useRef<Lenis | null>(null)
  const pathname = usePathname()

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      return
    }

    const lenis = new Lenis({
      autoRaf: true,
      autoToggle: true,
      anchors: true,
      lerp: 0.1,
      duration: 1.1,
      smoothWheel: true,
      syncTouch: false,
      prevent: (node) =>
        node.classList.contains('driver-pool') ||
        node.classList.contains('mobile-drawer') ||
        node.classList.contains('picks-round-strip') ||
        node.hasAttribute('data-lenis-prevent'),
    })

    lenisRef.current = lenis

    return () => {
      lenis.destroy()
      lenisRef.current = null
    }
  }, [])

  useEffect(() => {
    lenisRef.current?.scrollTo(0, { immediate: true })
  }, [pathname])

  return null
}


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
      anchors: true,
      lerp: 0.12,
      smoothWheel: true,
      syncTouch: false,
      wheelMultiplier: 1,
      prevent: (node) =>
        node.classList.contains('mobile-drawer') ||
        node.hasAttribute('data-lenis-prevent'),
      virtualScroll: ({ deltaX, deltaY, event }) => {
        if (lenis.isScrolling === 'smooth') return true
        if (Math.abs(deltaY) <= Math.abs(deltaX)) return true
        const target = event.target
        if (!(target instanceof HTMLElement)) return true
        const pool = target.closest('.driver-pool')
        if (!(pool instanceof HTMLElement)) return true
        const canScrollUp = deltaY < 0 && pool.scrollTop > 0
        const canScrollDown =
          deltaY > 0 && pool.scrollTop + pool.clientHeight < pool.scrollHeight - 1
        return !(canScrollUp || canScrollDown)
      },
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

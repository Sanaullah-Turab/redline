'use client'
import { usePathname } from 'next/navigation'
import { useCallback, useEffect, useRef, useState } from 'react'

function isInternalNavigation(event: MouseEvent) {
  if (event.defaultPrevented || event.button !== 0) return false
  if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return false
  const anchor = (event.target as Element | null)?.closest?.('a')
  if (!anchor || (anchor.target && anchor.target !== '_self') || anchor.hasAttribute('download')) return false
  const url = new URL(anchor.href, window.location.href)
  return (
    url.origin === window.location.origin &&
    url.pathname + url.search !== window.location.pathname + window.location.search
  )
}

export function StartLightsIntro() {
  const pathname = usePathname()
  const [visible, setVisible] = useState(true)
  const [run, setRun] = useState(0)
  const pending = useRef(false)
  const lastPath = useRef(pathname)

  const play = useCallback(() => {
    pending.current = true
    setRun((value) => value + 1)
    setVisible(true)
  }, [])

  const finish = useCallback(() => {
    pending.current = false
    setVisible(false)
  }, [])

  useEffect(() => {
    const onClick = (event: MouseEvent) => {
      if (isInternalNavigation(event)) play()
    }
    document.addEventListener('click', onClick)
    window.addEventListener('popstate', play)
    return () => {
      document.removeEventListener('click', onClick)
      window.removeEventListener('popstate', play)
    }
  }, [play])

  useEffect(() => {
    if (lastPath.current === pathname) return
    lastPath.current = pathname
    if (!pending.current) play()
  }, [pathname, play])

  if (!visible) return null

  return (
    <div
      key={run}
      className="start-lights-overlay"
      aria-hidden="true"
      onClick={() => finish()}
      onAnimationEnd={(event) => {
        if (event.target === event.currentTarget) finish()
      }}
    >
      <div className="start-lights-gantry">
        <div className="start-lights-pods">
          {[0, 1, 2, 3, 4].map((pod) => (
            <span
              key={pod}
              className="start-light-pod"
              style={{ '--pod': pod } as React.CSSProperties}
            >
              <i />
              <i />
            </span>
          ))}
        </div>
        <p className="start-lights-caption">REDLINE TELEMETRY · LIGHTS OUT</p>
      </div>
    </div>
  )
}

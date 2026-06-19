'use client'

import { useRef, useCallback } from 'react'

const SLOT_HEIGHT = 56

export function useScrollToCurrentTime<T extends HTMLElement>() {
  const hasScrolled = useRef(false)

  const refCallback = useCallback((node: T | null) => {
    if (!node || hasScrolled.current) return

    const now = new Date()
    const minutes = now.getHours() * 60 + now.getMinutes()
    const top = (minutes / 60) * SLOT_HEIGHT

    const targetScroll = top - node.clientHeight / 2
    node.scrollTo({ top: Math.max(0, targetScroll), behavior: 'auto' })
    hasScrolled.current = true
  }, [])

  return refCallback
}

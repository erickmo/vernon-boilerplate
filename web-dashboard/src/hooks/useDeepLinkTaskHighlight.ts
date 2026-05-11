import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useSearchParams } from 'react-router-dom'

const HIGHLIGHT_DURATION_MS = 3000

export interface UseDeepLinkTaskHighlightOptions {
  availableTaskNames: readonly string[]
  onMissing?: (taskName: string) => void
}

export interface UseDeepLinkTaskHighlightResult {
  highlightedTask: string | null
  registerRef: (name: string) => (el: HTMLElement | null) => void
}

export function useDeepLinkTaskHighlight({
  availableTaskNames,
  onMissing,
}: UseDeepLinkTaskHighlightOptions): UseDeepLinkTaskHighlightResult {
  const [searchParams] = useSearchParams()
  const requestedTask = searchParams.get('task')
  const [highlightedTask, setHighlightedTask] = useState<string | null>(null)
  const missingFiredFor = useRef<string | null>(null)
  const scrolledFor = useRef<string | null>(null)

  const isAvailable = requestedTask
    ? availableTaskNames.includes(requestedTask)
    : false
  const isLoading = availableTaskNames.length === 0

  useEffect(() => {
    if (!requestedTask) {
      setHighlightedTask(null)
      return
    }
    if (isLoading) {
      return
    }
    if (isAvailable) {
      setHighlightedTask(requestedTask)
      missingFiredFor.current = null
      const timer = window.setTimeout(() => {
        setHighlightedTask(null)
      }, HIGHLIGHT_DURATION_MS)
      return () => window.clearTimeout(timer)
    }
    if (missingFiredFor.current !== requestedTask) {
      missingFiredFor.current = requestedTask
      onMissing?.(requestedTask)
    }
    setHighlightedTask(null)
  }, [requestedTask, isAvailable, isLoading, onMissing])

  const registerRef = useCallback(
    (name: string) =>
      (el: HTMLElement | null) => {
        if (!el) return
        if (name !== requestedTask) return
        if (scrolledFor.current === name) return
        scrolledFor.current = name
        el.scrollIntoView({ behavior: 'smooth', block: 'center' })
      },
    [requestedTask],
  )

  return useMemo(
    () => ({ highlightedTask, registerRef }),
    [highlightedTask, registerRef],
  )
}

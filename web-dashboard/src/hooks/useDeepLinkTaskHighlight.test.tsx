import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import type { ReactNode } from 'react'
import { useDeepLinkTaskHighlight } from './useDeepLinkTaskHighlight'

function wrap(initial: string) {
  return function Wrapper({ children }: { children: ReactNode }) {
    return <MemoryRouter initialEntries={[initial]}>{children}</MemoryRouter>
  }
}

beforeEach(() => {
  vi.useFakeTimers()
})

afterEach(() => {
  vi.useRealTimers()
})

describe('useDeepLinkTaskHighlight', () => {
  it('returns null when no task param', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['A', 'B'] }),
      { wrapper: wrap('/my-work') },
    )
    expect(result.current.highlightedTask).toBeNull()
  })

  it('returns task name when present and in available list', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1', 'VT-2'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(result.current.highlightedTask).toBe('VT-1')
  })

  it('clears highlight after 3000ms', () => {
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(result.current.highlightedTask).toBe('VT-1')
    act(() => {
      vi.advanceTimersByTime(3000)
    })
    expect(result.current.highlightedTask).toBeNull()
  })

  it('calls onMissing when task not in available list', () => {
    const onMissing = vi.fn()
    renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'], onMissing }),
      { wrapper: wrap('/my-work?task=VT-999') },
    )
    expect(onMissing).toHaveBeenCalledWith('VT-999')
  })

  it('does not call onMissing when availableTaskNames empty (still loading)', () => {
    const onMissing = vi.fn()
    renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: [], onMissing }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    expect(onMissing).not.toHaveBeenCalled()
  })

  it('registerRef returns callback that scrolls when matched', () => {
    const scrollMock = vi.fn()
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    const fakeEl = { scrollIntoView: scrollMock } as unknown as HTMLElement
    act(() => {
      result.current.registerRef('VT-1')(fakeEl)
    })
    expect(scrollMock).toHaveBeenCalledWith({ behavior: 'smooth', block: 'center' })
  })

  it('registerRef does not scroll non-matching task', () => {
    const scrollMock = vi.fn()
    const { result } = renderHook(
      () => useDeepLinkTaskHighlight({ availableTaskNames: ['VT-1', 'VT-2'] }),
      { wrapper: wrap('/my-work?task=VT-1') },
    )
    const fakeEl = { scrollIntoView: scrollMock } as unknown as HTMLElement
    act(() => {
      result.current.registerRef('VT-2')(fakeEl)
    })
    expect(scrollMock).not.toHaveBeenCalled()
  })
})

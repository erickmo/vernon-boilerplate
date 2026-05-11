import { describe, it, expect, beforeEach } from 'vitest'
import { render } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { PerspectiveSync } from './PerspectiveSync'
import { useUiStore } from '@/stores/ui.store'

beforeEach(() => {
  useUiStore.setState({ perspective: 'saya' })
})

describe('PerspectiveSync', () => {
  it('flips perspective to tim when route is /leader-review', () => {
    render(
      <MemoryRouter initialEntries={['/leader-review']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('leaves perspective alone when route already matches', () => {
    useUiStore.setState({ perspective: 'tim' })
    render(
      <MemoryRouter initialEntries={['/leader-review']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })

  it('does nothing for unregistered routes (e.g. /profile)', () => {
    useUiStore.setState({ perspective: 'tim' })
    render(
      <MemoryRouter initialEntries={['/profile']}>
        <PerspectiveSync />
      </MemoryRouter>,
    )
    expect(useUiStore.getState().perspective).toBe('tim')
  })
})

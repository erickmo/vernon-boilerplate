import { fireEvent, screen } from '@testing-library/react'
import { describe, expect, it, vi } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import { DatePicker } from '@/widgets/DatePicker/DatePicker'

describe('DatePicker', () => {
  it('renders the calendar popover outside the card flow', () => {
    const onChange = vi.fn()
    const { container } = render(
      <div style={{ overflow: 'hidden', maxWidth: 220 }}>
        <DatePicker value="2026-05-05" onChange={onChange} />
      </div>,
    )

    fireEvent.click(screen.getByRole('button', { name: /5 mei 2026/i }))

    const monthLabel = screen.getByText('Mei 2026')
    expect(monthLabel).toBeInTheDocument()
    expect(container.contains(monthLabel)).toBe(false)
    expect(screen.getAllByRole('button', { name: /^5$/ }).length).toBeGreaterThan(0)
  })
})

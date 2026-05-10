import { screen } from '@testing-library/react'
import { Route, Routes } from 'react-router-dom'
import { describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import WidgetGalleryPage from '@/pages/Examples/WidgetGalleryPage'

describe('WidgetGalleryPage', () => {
  it('renders a single-page gallery of widget demos', () => {
    render(
      <Routes>
        <Route path="/examples/widgets" element={<WidgetGalleryPage />} />
      </Routes>,
      { initialEntries: ['/examples/widgets'] },
    )

    expect(screen.getByRole('heading', { name: /widget gallery/i })).toBeInTheDocument()
    expect(screen.getByRole('link', { name: /navigation/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /inputs/i })).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /charts/i })).toBeInTheDocument()
    expect(screen.getByText(/example projects/i)).toBeInTheDocument()
  })
})

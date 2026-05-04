import { Route, Routes } from 'react-router-dom'
import { screen, within } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'
import { render } from '@/__ui_tests__/test-utils'
import ExamplesListPage from '@/pages/Examples/ExamplesListPage'
import ExampleFormPage from '@/pages/Examples/ExampleFormPage'
import ExampleDetailPage from '@/pages/Examples/ExampleDetailPage'

describe('example template pages', () => {
  it('renders the ListPageTemplate example', async () => {
    render(<ExamplesListPage />)

    expect(screen.getByRole('heading', { name: /example projects/i })).toBeInTheDocument()
    expect(await screen.findByText('Customer onboarding refresh')).toBeInTheDocument()
  })

  it('renders the FormPageTemplate example', () => {
    render(<ExampleFormPage />)

    expect(screen.getByRole('heading', { name: /new example project/i })).toBeInTheDocument()
    expect(screen.getByText(/basic info/i)).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /save example/i })).toBeInTheDocument()
  })

  it('renders the DetailPageTemplate example route', async () => {
    const user = userEvent.setup()

    render(
      <Routes>
        <Route path="/examples/:id" element={<ExampleDetailPage />} />
      </Routes>,
      { initialEntries: ['/examples/ex-001'] },
    )

    expect(screen.getByRole('heading', { name: /customer onboarding refresh/i })).toBeInTheDocument()
    expect(screen.getByText('EX-001')).toBeInTheDocument()
    const menu = screen.getByRole('complementary', { name: /detail menu/i })
    expect(within(menu).getByRole('button', { name: /overview/i })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /notes/i })).toBeInTheDocument()
    expect(within(menu).getByRole('button', { name: /koneksi/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /summary/i })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: /activity/i })).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /bantuan/i }))
    expect(screen.getByRole('dialog')).toBeInTheDocument()
    expect(screen.getByRole('heading', { name: /detailpagetemplate example/i })).toBeInTheDocument()

    await user.click(within(menu).getByRole('button', { name: /notes/i }))
    expect(screen.getByRole('button', { name: /checklist/i })).toBeInTheDocument()

    await user.click(within(menu).getByRole('button', { name: /koneksi/i }))
    expect(screen.getByRole('heading', { name: /koneksi terkait/i })).toBeInTheDocument()
    expect(screen.getByText(/audit log/i)).toBeInTheDocument()

    await user.click(screen.getByRole('button', { name: /tutup bantuan/i }))
    await user.click(screen.getByRole('button', { name: /aksi lainnya/i }))
    expect(screen.getByRole('menuitem', { name: /^edit$/i })).toBeInTheDocument()
    expect(screen.queryByRole('menuitem', { name: /edit example/i })).not.toBeInTheDocument()
  })
})

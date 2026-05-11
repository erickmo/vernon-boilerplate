import { describe, it, expect, vi } from 'vitest'
import { render, screen, fireEvent } from '@testing-library/react'
import { DenominasiGrid } from '@/widgets/DenominasiGrid/DenominasiGrid'
import type { DenominasiUang } from '@/types/koperasi/kas-teller.types'

const DENOMINASI: DenominasiUang[] = [
  { name: 'Rp 100.000', nama: 'Rp 100.000', nilai: 100000, jenis: 'Kertas', urutan: 1, aktif: 1 },
  { name: 'Rp 50.000', nama: 'Rp 50.000', nilai: 50000, jenis: 'Kertas', urutan: 2, aktif: 1 },
  { name: 'Rp 500', nama: 'Rp 500', nilai: 500, jenis: 'Koin', urutan: 3, aktif: 1 },
]

describe('DenominasiGrid', () => {
  it('renders one row per denominasi sorted by urutan', () => {
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={() => {}} />,
    )
    expect(screen.getByLabelText(/Jumlah Rp 100\.000/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Jumlah Rp 50\.000/i)).toBeInTheDocument()
    expect(screen.getByLabelText(/Jumlah Rp 500$/i)).toBeInTheDocument()
  })

  it('computes subtotal per row and grand total', () => {
    render(
      <DenominasiGrid
        denominasi={DENOMINASI}
        value={{ 'Rp 100.000': 3, 'Rp 50.000': 2 }}
        onChange={() => {}}
      />,
    )
    expect(screen.getByTestId('subtotal-Rp 100.000')).toHaveTextContent('300.000')
    expect(screen.getByTestId('subtotal-Rp 50.000')).toHaveTextContent('100.000')
    expect(screen.getByTestId('denominasi-grand-total')).toHaveTextContent('400.000')
  })

  it('calls onChange with new value object when input changes', () => {
    const handleChange = vi.fn()
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={handleChange} />,
    )
    const input = screen.getByLabelText(/Jumlah Rp 100\.000/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '5' } })
    expect(handleChange).toHaveBeenCalledWith({ 'Rp 100.000': 5 })
  })

  it('removes key from value when input cleared', () => {
    const handleChange = vi.fn()
    render(
      <DenominasiGrid
        denominasi={DENOMINASI}
        value={{ 'Rp 100.000': 5 }}
        onChange={handleChange}
      />,
    )
    const input = screen.getByLabelText(/Jumlah Rp 100\.000/i) as HTMLInputElement
    fireEvent.change(input, { target: { value: '' } })
    expect(handleChange).toHaveBeenCalledWith({})
  })

  it('respects disabled prop', () => {
    render(
      <DenominasiGrid denominasi={DENOMINASI} value={{}} onChange={() => {}} disabled />,
    )
    expect(screen.getByLabelText(/Jumlah Rp 100\.000/i)).toBeDisabled()
  })
})

import { render, screen } from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'
import { describe, it, expect } from 'vitest'
import { AppSubNav } from './AppSubNav'

describe('AppSubNav', () => {
  it('renders nothing when pathname has no nav1 segment', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/sekolah/dashboard']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })

  it('renders subnav items for sekolah/siswa', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Daftar Siswa')).toBeInTheDocument()
    expect(screen.getByText('Pendaftaran Siswa')).toBeInTheDocument()
    expect(screen.getByText('Rombongan Belajar')).toBeInTheDocument()
    expect(screen.getByText('Mutasi Siswa')).toBeInTheDocument()
    expect(screen.getByText('Kelulusan Siswa')).toBeInTheDocument()
  })

  it('renders subnav items for koperasi/anggota', () => {
    render(
      <MemoryRouter initialEntries={['/koperasi/anggota']}>
        <AppSubNav context="koperasi" />
      </MemoryRouter>,
    )
    expect(screen.getByText('Nasabah')).toBeInTheDocument()
    expect(screen.getByText('Anggota Koperasi')).toBeInTheDocument()
    expect(screen.getByText('Simpanan Pokok')).toBeInTheDocument()
  })

  it('marks the current path item as active', () => {
    render(
      <MemoryRouter initialEntries={['/sekolah/siswa']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    const link = screen.getByText('Daftar Siswa').closest('a')
    expect(link?.className).toMatch(/active/i)
  })

  it('renders nothing when context mismatches pathname', () => {
    const { container } = render(
      <MemoryRouter initialEntries={['/koperasi/anggota']}>
        <AppSubNav context="sekolah" />
      </MemoryRouter>,
    )
    expect(container.firstChild).toBeNull()
  })
})

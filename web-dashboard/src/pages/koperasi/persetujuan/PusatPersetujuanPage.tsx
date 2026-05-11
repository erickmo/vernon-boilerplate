import { useMemo, useState } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { Drawer } from '@/widgets/Drawer/Drawer'
import { toast } from '@/widgets/Toast/Toast'
import { permohonanSimpananService } from '@/services/koperasi/simpanan.service'
import { akadPembiayaanService } from '@/services/koperasi/pembiayaan.service'
import { sesiKasTellerService } from '@/services/koperasi/kas-teller.service'
import type { PermohonanSimpanan } from '@/types/koperasi/simpanan.types'
import type { AkadPembiayaan } from '@/types/koperasi/pembiayaan.types'
import type { SesiKasTeller } from '@/types/koperasi/kas-teller.types'
import { formatCurrency } from '@/utils/format'
import styles from './PusatPersetujuanPage.module.css'

type TabKey = 'semua' | 'simpanan' | 'pembiayaan' | 'penutupan-kas'

interface ApprovalRow {
  id: string
  jenis: 'Simpanan' | 'Pembiayaan'
  subtipe: string
  nasabah: string
  nominal: number | null
  tanggal: string
  status: string
  ageDays: number
  raw: PermohonanSimpanan | AkadPembiayaan
}

const PERMOHONAN_PENDING_STATUS = 'Diajukan'
const AKAD_PENDING_STATUS = 'Pengajuan'
const SESI_PENDING_STATUS = 'Pending Approval'
const URGENT_AGE_DAYS = 2

function ageInDays(iso: string): number {
  const t = new Date(iso).getTime()
  if (Number.isNaN(t)) return 0
  const diff = Date.now() - t
  return Math.max(0, Math.floor(diff / (1000 * 60 * 60 * 24)))
}

function formatRupiah(n: number | null): string {
  if (n === null) return '-'
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatDate(iso: string): string {
  if (!iso) return '-'
  try {
    return new Date(iso).toLocaleDateString('id-ID', { day: '2-digit', month: 'short', year: 'numeric' })
  } catch {
    return iso
  }
}

function formatDateTime(iso?: string): string {
  if (!iso) return '—'
  try {
    return new Date(iso).toLocaleString('id-ID')
  } catch {
    return iso
  }
}

export function PusatPersetujuanPage() {
  const [tab, setTab] = useState<TabKey>('semua')
  const [search, setSearch] = useState('')
  const [selected, setSelected] = useState<ApprovalRow | null>(null)
  const [selectedSesi, setSelectedSesi] = useState<SesiKasTeller | null>(null)
  const [rejectAlasan, setRejectAlasan] = useState('')
  const [catatanSupervisor, setCatatanSupervisor] = useState('')
  const queryClient = useQueryClient()

  const permohonanQ = useQuery({
    queryKey: ['persetujuan', 'permohonan-simpanan'],
    queryFn: () =>
      permohonanSimpananService.list({
        limit: 100,
        filters: [['status', '=', PERMOHONAN_PENDING_STATUS]],
        sort: [['tanggal', 1]],
      }),
  })

  const akadQ = useQuery({
    queryKey: ['persetujuan', 'akad-pembiayaan'],
    queryFn: () =>
      akadPembiayaanService.list({
        limit: 100,
        filters: [['status', '=', AKAD_PENDING_STATUS]],
        sort: [['tanggal_akad', 1]],
      }),
  })

  const sesiPendingQ = useQuery({
    queryKey: ['sesi-kas', 'pending-approval'],
    queryFn: () =>
      sesiKasTellerService.list({
        limit: 50,
        filters: [['status', '=', SESI_PENDING_STATUS]],
        sort: [['waktu_tutup', -1]],
      }),
  })

  const rows: ApprovalRow[] = useMemo(() => {
    const list: ApprovalRow[] = []
    permohonanQ.data?.items.forEach((p) => {
      list.push({
        id: `permohonan-${p.id}`,
        jenis: 'Simpanan',
        subtipe: p.tipe,
        nasabah: p.nasabah_nama,
        nominal: null,
        tanggal: p.tanggal,
        status: p.status,
        ageDays: ageInDays(p.tanggal),
        raw: p,
      })
    })
    akadQ.data?.items.forEach((a) => {
      list.push({
        id: `akad-${a.id}`,
        jenis: 'Pembiayaan',
        subtipe: a.akad,
        nasabah: a.nasabah_nama,
        nominal: a.nominal_pokok,
        tanggal: a.tanggal_akad,
        status: a.status,
        ageDays: ageInDays(a.tanggal_akad),
        raw: a,
      })
    })
    return list.sort((a, b) => b.ageDays - a.ageDays)
  }, [permohonanQ.data, akadQ.data])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return rows.filter((r) => {
      if (tab === 'simpanan' && r.jenis !== 'Simpanan') return false
      if (tab === 'pembiayaan' && r.jenis !== 'Pembiayaan') return false
      if (q && !r.nasabah.toLowerCase().includes(q) && !r.subtipe.toLowerCase().includes(q)) return false
      return true
    })
  }, [rows, tab, search])

  const sesiFiltered = useMemo(() => {
    const q = search.trim().toLowerCase()
    const items = sesiPendingQ.data?.items ?? []
    if (!q) return items
    return items.filter(
      (s) =>
        s.name.toLowerCase().includes(q) ||
        s.teller.toLowerCase().includes(q) ||
        s.shift.toLowerCase().includes(q),
    )
  }, [sesiPendingQ.data, search])

  const counts = useMemo(
    () => ({
      semua: rows.length,
      simpanan: rows.filter((r) => r.jenis === 'Simpanan').length,
      pembiayaan: rows.filter((r) => r.jenis === 'Pembiayaan').length,
      penutupanKas: sesiPendingQ.data?.total ?? sesiPendingQ.data?.items.length ?? 0,
    }),
    [rows, sesiPendingQ.data],
  )

  const approveMutation = useMutation({
    mutationFn: async (row: ApprovalRow) => {
      const rawId = (row.raw as { id: string }).id
      if (row.jenis === 'Simpanan') {
        return permohonanSimpananService.approve(rawId)
      }
      return akadPembiayaanService.approve(rawId)
    },
    onSuccess: (_, row) => {
      toast.success(`${row.jenis} disetujui`)
      setSelected(null)
      queryClient.invalidateQueries({ queryKey: ['persetujuan'] })
    },
    onError: () => toast.error('Gagal menyetujui'),
  })

  const rejectMutation = useMutation({
    mutationFn: async ({ row, alasan }: { row: ApprovalRow; alasan: string }) => {
      const rawId = (row.raw as { id: string }).id
      if (row.jenis === 'Simpanan') {
        return permohonanSimpananService.reject(rawId, alasan)
      }
      return akadPembiayaanService.reject(rawId, alasan)
    },
    onSuccess: (_, { row }) => {
      toast.success(`${row.jenis} ditolak`)
      setSelected(null)
      setRejectAlasan('')
      queryClient.invalidateQueries({ queryKey: ['persetujuan'] })
    },
    onError: () => toast.error('Gagal menolak'),
  })

  const approveSesiMutation = useMutation({
    mutationFn: async () => {
      if (!selectedSesi) throw new Error('No sesi selected')
      return sesiKasTellerService.approveTutup(
        selectedSesi.name,
        catatanSupervisor.trim() || undefined,
      )
    },
    onSuccess: () => {
      toast.success('Sesi diapprove')
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'pending-approval'] })
      queryClient.invalidateQueries({ queryKey: ['sesi-kas', 'active'] })
      setSelectedSesi(null)
      setCatatanSupervisor('')
    },
    onError: (err) => {
      const message = err instanceof Error ? err.message : 'Gagal approve'
      toast.error(message)
    },
  })

  const loading =
    tab === 'penutupan-kas'
      ? sesiPendingQ.isLoading
      : permohonanQ.isLoading || akadQ.isLoading
  const error =
    tab === 'penutupan-kas' ? sesiPendingQ.error : permohonanQ.error || akadQ.error

  const isSesiTab = tab === 'penutupan-kas'

  return (
    <div className="animate-page-in">
      <PageHeader
        title="Pusat Persetujuan"
        subtitle="Semua permohonan menunggu keputusan dalam satu tempat"
      />

      <div className={styles.toolbar}>
        <div className={styles.tabs}>
          <button
            className={tab === 'semua' ? styles.tabActive : styles.tab}
            onClick={() => setTab('semua')}
          >
            Semua <span className={styles.tabCount}>{counts.semua}</span>
          </button>
          <button
            className={tab === 'simpanan' ? styles.tabActive : styles.tab}
            onClick={() => setTab('simpanan')}
          >
            Simpanan <span className={styles.tabCount}>{counts.simpanan}</span>
          </button>
          <button
            className={tab === 'pembiayaan' ? styles.tabActive : styles.tab}
            onClick={() => setTab('pembiayaan')}
          >
            Pembiayaan <span className={styles.tabCount}>{counts.pembiayaan}</span>
          </button>
          <button
            className={tab === 'penutupan-kas' ? styles.tabActive : styles.tab}
            onClick={() => setTab('penutupan-kas')}
          >
            Penutupan Kas <span className={styles.tabCount}>{counts.penutupanKas}</span>
          </button>
        </div>

        <input
          type="search"
          placeholder={
            isSesiTab ? 'Cari sesi, teller, atau shift…' : 'Cari nama anggota atau tipe…'
          }
          className={styles.search}
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
      </div>

      {loading && <p className={styles.muted}>Memuat…</p>}
      {error && <p className={styles.error}>Gagal memuat data persetujuan</p>}

      {!loading && !error && !isSesiTab && filtered.length === 0 && (
        <p className={styles.muted}>Tidak ada permohonan menunggu persetujuan</p>
      )}
      {!loading && !error && isSesiTab && sesiFiltered.length === 0 && (
        <p className={styles.muted}>Tidak ada sesi kas menunggu persetujuan</p>
      )}

      {!loading && !error && !isSesiTab && filtered.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Jenis</th>
                <th>Tipe</th>
                <th>Anggota</th>
                <th className={styles.alignRight}>Nominal</th>
                <th>Tanggal</th>
                <th>Umur</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr key={r.id} onClick={() => setSelected(r)} className={styles.row}>
                  <td>
                    <span className={r.jenis === 'Simpanan' ? styles.badgeSimpanan : styles.badgePembiayaan}>
                      {r.jenis}
                    </span>
                  </td>
                  <td>{r.subtipe}</td>
                  <td>{r.nasabah}</td>
                  <td className={styles.alignRight}>{formatRupiah(r.nominal)}</td>
                  <td>{formatDate(r.tanggal)}</td>
                  <td>
                    <span className={r.ageDays > URGENT_AGE_DAYS ? styles.ageBadgeUrgent : styles.ageBadge}>
                      {r.ageDays}h
                    </span>
                  </td>
                  <td>
                    <button className={styles.openBtn} onClick={(e) => { e.stopPropagation(); setSelected(r) }}>
                      Tinjau
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {!loading && !error && isSesiTab && sesiFiltered.length > 0 && (
        <div className={styles.tableWrap}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Sesi</th>
                <th>Tanggal</th>
                <th>Teller</th>
                <th>Shift</th>
                <th className={styles.alignRight}>Modal</th>
                <th className={styles.alignRight}>Selisih</th>
                <th>Waktu Tutup</th>
                <th aria-label="Aksi" />
              </tr>
            </thead>
            <tbody>
              {sesiFiltered.map((s) => {
                const selisih = s.selisih ?? 0
                return (
                  <tr key={s.name} onClick={() => setSelectedSesi(s)} className={styles.row}>
                    <td>{s.name}</td>
                    <td>{formatDate(s.tanggal)}</td>
                    <td>{s.teller}</td>
                    <td>{s.shift}</td>
                    <td className={styles.alignRight}>{formatCurrency(s.modal_kas)}</td>
                    <td
                      className={styles.alignRight}
                      style={{ color: selisih !== 0 ? 'var(--color-danger)' : undefined }}
                    >
                      {formatCurrency(selisih)}
                    </td>
                    <td>{formatDateTime(s.waktu_tutup)}</td>
                    <td>
                      <button
                        className={styles.openBtn}
                        onClick={(e) => { e.stopPropagation(); setSelectedSesi(s) }}
                      >
                        Tinjau
                      </button>
                    </td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </div>
      )}

      <Drawer
        isOpen={selected !== null}
        onClose={() => { setSelected(null); setRejectAlasan('') }}
        title={selected ? `Detail ${selected.jenis}` : ''}
        width={460}
      >
        {selected && (
          <div className={styles.detail}>
            <DetailRow label="Anggota" value={selected.nasabah} />
            <DetailRow label="Jenis" value={selected.jenis} />
            <DetailRow label="Tipe / Akad" value={selected.subtipe} />
            <DetailRow label="Tanggal Diajukan" value={formatDate(selected.tanggal)} />
            <DetailRow label="Umur Permohonan" value={`${selected.ageDays} hari`} />
            {selected.nominal !== null && (
              <DetailRow label="Nominal Pokok" value={formatRupiah(selected.nominal)} />
            )}
            {selected.jenis === 'Simpanan' && (
              <DetailRow label="Alasan" value={(selected.raw as PermohonanSimpanan).alasan || '-'} />
            )}
            {selected.jenis === 'Pembiayaan' && (
              <>
                <DetailRow label="Tenor" value={`${(selected.raw as AkadPembiayaan).tenor} bulan`} />
                <DetailRow label="Tujuan" value={(selected.raw as AkadPembiayaan).tujuan_pembiayaan || '-'} />
                <DetailRow label="Agunan" value={(selected.raw as AkadPembiayaan).agunan || '-'} />
              </>
            )}

            <div className={styles.alasanGroup}>
              <label htmlFor="rejectAlasan" className={styles.alasanLabel}>
                Catatan Penolakan (opsional)
              </label>
              <textarea
                id="rejectAlasan"
                className={styles.alasanInput}
                rows={3}
                value={rejectAlasan}
                onChange={(e) => setRejectAlasan(e.target.value)}
                placeholder="Tuliskan alasan jika menolak…"
              />
            </div>

            <div className={styles.actions}>
              <button
                className={styles.rejectBtn}
                disabled={rejectMutation.isPending || approveMutation.isPending}
                onClick={() => rejectMutation.mutate({ row: selected, alasan: rejectAlasan })}
              >
                {rejectMutation.isPending ? 'Menolak…' : 'Tolak'}
              </button>
              <button
                className={styles.approveBtn}
                disabled={approveMutation.isPending || rejectMutation.isPending}
                onClick={() => approveMutation.mutate(selected)}
              >
                {approveMutation.isPending ? 'Menyetujui…' : 'Setujui'}
              </button>
            </div>
          </div>
        )}
      </Drawer>

      <Drawer
        isOpen={selectedSesi !== null}
        onClose={() => { setSelectedSesi(null); setCatatanSupervisor('') }}
        title={selectedSesi ? `Rekonsiliasi ${selectedSesi.name}` : ''}
        width={520}
      >
        {selectedSesi && (
          <div className={styles.detail}>
            <DetailRow label="Teller" value={selectedSesi.teller} />
            <DetailRow label="Tanggal" value={formatDate(selectedSesi.tanggal)} />
            <DetailRow label="Shift" value={selectedSesi.shift} />
            <DetailRow label="Modal Kas" value={formatCurrency(selectedSesi.modal_kas)} />
            <DetailRow
              label="Total Setoran"
              value={formatCurrency(selectedSesi.total_setoran ?? 0)}
            />
            <DetailRow
              label="Total Penarikan"
              value={formatCurrency(selectedSesi.total_penarikan ?? 0)}
            />
            <DetailRow
              label="Saldo Seharusnya"
              value={formatCurrency(selectedSesi.saldo_seharusnya ?? 0)}
            />
            <DetailRow
              label="Total Denominasi Tutup"
              value={formatCurrency(selectedSesi.total_denominasi_tutup ?? 0)}
            />
            <div className={styles.detailRow}>
              <span className={styles.detailLabel}>Selisih</span>
              <span
                className={styles.detailValue}
                style={{
                  color:
                    (selectedSesi.selisih ?? 0) !== 0
                      ? 'var(--color-danger)'
                      : 'var(--color-success)',
                  fontWeight: 600,
                }}
              >
                {formatCurrency(selectedSesi.selisih ?? 0)}
              </span>
            </div>
            <DetailRow label="Catatan Selisih" value={selectedSesi.catatan_selisih || '—'} />
            <DetailRow label="Supervisor Buka" value={selectedSesi.supervisor_buka} />
            <DetailRow label="Waktu Tutup" value={formatDateTime(selectedSesi.waktu_tutup)} />

            <div className={styles.alasanGroup}>
              <label htmlFor="catatan_supervisor" className={styles.alasanLabel}>
                Catatan Supervisor (opsional)
              </label>
              <textarea
                id="catatan_supervisor"
                className={styles.alasanInput}
                rows={3}
                value={catatanSupervisor}
                onChange={(e) => setCatatanSupervisor(e.target.value)}
                placeholder="Tambahkan catatan jika perlu"
              />
            </div>

            <div className={styles.actions}>
              <button
                className={styles.rejectBtn}
                disabled={approveSesiMutation.isPending}
                onClick={() => { setSelectedSesi(null); setCatatanSupervisor('') }}
              >
                Batal
              </button>
              <button
                className={styles.approveBtn}
                disabled={approveSesiMutation.isPending}
                onClick={() => approveSesiMutation.mutate()}
              >
                {approveSesiMutation.isPending ? 'Approving…' : 'Approve'}
              </button>
            </div>
          </div>
        )}
      </Drawer>
    </div>
  )
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className={styles.detailRow}>
      <span className={styles.detailLabel}>{label}</span>
      <span className={styles.detailValue}>{value}</span>
    </div>
  )
}

export default PusatPersetujuanPage

import { useState, useMemo } from 'react'
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import { PageHeader } from '@/layouts/PageHeader/PageHeader'
import { toast } from '@/widgets/Toast/Toast'
import { nasabahService } from '@/services/koperasi/nasabah.service'
import { transaksiSimpananService } from '@/services/koperasi/simpanan.service'
import { pembayaranAngsuranService } from '@/services/koperasi/pembiayaan.service'
import type { Nasabah, NasabahSummary, RekeningSlim, AkadSlim } from '@/types/koperasi/anggota.types'
import styles from './TellerWorkstationPage.module.css'

type ActionTab = 'setor' | 'tarik' | 'angsuran'

interface TapeEntry {
  id: string
  jenis: string
  nasabah: string
  nominal: number
  waktu: string
}

const MIN_SEARCH_CHARS = 2

function formatRupiah(n: number): string {
  return new Intl.NumberFormat('id-ID', {
    style: 'currency',
    currency: 'IDR',
    maximumFractionDigits: 0,
  }).format(n)
}

function formatTime(iso: string): string {
  try {
    return new Date(iso).toLocaleTimeString('id-ID', { hour: '2-digit', minute: '2-digit' })
  } catch {
    return iso
  }
}

export function TellerWorkstationPage() {
  const [search, setSearch] = useState('')
  const [selectedNasabah, setSelectedNasabah] = useState<Nasabah | null>(null)
  const [tab, setTab] = useState<ActionTab>('setor')
  const [tape, setTape] = useState<TapeEntry[]>([])
  const queryClient = useQueryClient()

  const searchQ = useQuery({
    queryKey: ['teller-search', search],
    queryFn: () => nasabahService.list({ limit: 8, search }),
    enabled: search.trim().length >= MIN_SEARCH_CHARS,
  })

  const summaryQ = useQuery<NasabahSummary>({
    queryKey: ['teller-summary', selectedNasabah?.id],
    queryFn: () => nasabahService.getNasabahSummary(selectedNasabah!.id),
    enabled: !!selectedNasabah,
  })

  function pushTape(entry: TapeEntry) {
    setTape((prev) => [entry, ...prev].slice(0, 50))
  }

  function resetAfterSubmit() {
    queryClient.invalidateQueries({ queryKey: ['teller-summary', selectedNasabah?.id] })
  }

  return (
    <div className={`animate-page-in ${styles.layout}`}>
      <PageHeader
        title="Workstation Teller"
        subtitle="Layani transaksi anggota dalam satu layar"
      />

      <div className={styles.grid}>
        {/* Left: Member panel */}
        <aside className={styles.memberPanel}>
          <h2 className={styles.sectionTitle}>Anggota</h2>
          <input
            type="search"
            placeholder="Cari nama / NIK / no HP…"
            className={styles.searchInput}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />

          {search.trim().length >= MIN_SEARCH_CHARS && (
            <div className={styles.searchResults}>
              {searchQ.isLoading && <p className={styles.muted}>Mencari…</p>}
              {searchQ.data?.items.length === 0 && <p className={styles.muted}>Tidak ditemukan</p>}
              {searchQ.data?.items.map((n) => (
                <button
                  key={n.id}
                  className={selectedNasabah?.id === n.id ? styles.searchItemActive : styles.searchItem}
                  onClick={() => { setSelectedNasabah(n); setSearch('') }}
                >
                  <p className={styles.searchItemName}>{n.nama}</p>
                  <p className={styles.searchItemMeta}>{n.nik} · {n.no_hp}</p>
                </button>
              ))}
            </div>
          )}

          {selectedNasabah && (
            <div className={styles.memberCard}>
              <p className={styles.memberName}>{selectedNasabah.nama}</p>
              <p className={styles.memberMeta}>NIK: {selectedNasabah.nik}</p>
              <p className={styles.memberMeta}>HP: {selectedNasabah.no_hp}</p>

              {summaryQ.isLoading && <p className={styles.muted}>Memuat ringkasan…</p>}
              {summaryQ.data && (
                <>
                  <p className={styles.subSectionTitle}>Rekening Simpanan</p>
                  {summaryQ.data.rekening.length === 0 && <p className={styles.muted}>Belum ada rekening</p>}
                  {summaryQ.data.rekening.map((r) => (
                    <div key={r.id} className={styles.holding}>
                      <span>{r.nomor_rekening} · {r.produk_simpanan}</span>
                      <strong>{formatRupiah(r.saldo)}</strong>
                    </div>
                  ))}

                  <p className={styles.subSectionTitle}>Akad Pembiayaan</p>
                  {summaryQ.data.pembiayaan.length === 0 && <p className={styles.muted}>Belum ada akad</p>}
                  {summaryQ.data.pembiayaan.map((a) => (
                    <div key={a.id} className={styles.holding}>
                      <span>{a.nomor_akad} · {a.produk_pembiayaan}</span>
                      <strong>{formatRupiah(a.sisa_pokok)}</strong>
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </aside>

        {/* Center: Action tabs */}
        <main className={styles.actionPanel}>
          {!selectedNasabah && (
            <div className={styles.emptyState}>
              <p>Pilih anggota dari panel kiri untuk memulai transaksi.</p>
            </div>
          )}

          {selectedNasabah && summaryQ.data && (
            <>
              <div className={styles.actionTabs}>
                <button
                  className={tab === 'setor' ? styles.actionTabActive : styles.actionTab}
                  onClick={() => setTab('setor')}
                >Setor Simpanan</button>
                <button
                  className={tab === 'tarik' ? styles.actionTabActive : styles.actionTab}
                  onClick={() => setTab('tarik')}
                >Tarik Simpanan</button>
                <button
                  className={tab === 'angsuran' ? styles.actionTabActive : styles.actionTab}
                  onClick={() => setTab('angsuran')}
                >Bayar Angsuran</button>
              </div>

              <div className={styles.actionBody}>
                {tab === 'setor' && (
                  <SimpananForm
                    tipe="Setoran"
                    nasabah={selectedNasabah}
                    rekening={summaryQ.data.rekening}
                    onSuccess={(entry) => { pushTape(entry); resetAfterSubmit() }}
                  />
                )}
                {tab === 'tarik' && (
                  <SimpananForm
                    tipe="Penarikan"
                    nasabah={selectedNasabah}
                    rekening={summaryQ.data.rekening}
                    onSuccess={(entry) => { pushTape(entry); resetAfterSubmit() }}
                  />
                )}
                {tab === 'angsuran' && (
                  <AngsuranForm
                    nasabah={selectedNasabah}
                    akad={summaryQ.data.pembiayaan}
                    onSuccess={(entry) => { pushTape(entry); resetAfterSubmit() }}
                  />
                )}
              </div>
            </>
          )}
        </main>

        {/* Right: Transaction tape */}
        <aside className={styles.tapePanel}>
          <h2 className={styles.sectionTitle}>Riwayat Sesi</h2>
          {tape.length === 0 && <p className={styles.muted}>Belum ada transaksi sesi ini.</p>}
          <ul className={styles.tapeList}>
            {tape.map((t) => (
              <li key={t.id} className={styles.tapeItem}>
                <div>
                  <p className={styles.tapeJenis}>{t.jenis}</p>
                  <p className={styles.tapeMeta}>{t.nasabah} · {formatTime(t.waktu)}</p>
                </div>
                <strong>{formatRupiah(t.nominal)}</strong>
              </li>
            ))}
          </ul>
          {tape.length > 0 && (
            <p className={styles.tapeTotal}>
              Total: <strong>{formatRupiah(tape.reduce((s, t) => s + t.nominal, 0))}</strong>
            </p>
          )}
        </aside>
      </div>
    </div>
  )
}

// ─── Setor / Tarik form ───────────────────────────────────────────────────────

interface SimpananFormProps {
  tipe: 'Setoran' | 'Penarikan'
  nasabah: Nasabah
  rekening: RekeningSlim[]
  onSuccess: (entry: TapeEntry) => void
}

function SimpananForm({ tipe, nasabah, rekening, onSuccess }: SimpananFormProps) {
  const [rekeningId, setRekeningId] = useState(rekening[0]?.id ?? '')
  const [nominal, setNominal] = useState('')
  const [keterangan, setKeterangan] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      transaksiSimpananService.create({
        rekening_id: rekeningId,
        tipe,
        nominal: Number(nominal),
        keterangan,
        tanggal: new Date().toISOString(),
        nasabah_id: nasabah.id,
        nasabah_nama: nasabah.nama,
      } as never),
    onSuccess: () => {
      toast.success(`${tipe} berhasil`)
      onSuccess({
        id: `${Date.now()}-${Math.random()}`,
        jenis: tipe,
        nasabah: nasabah.nama,
        nominal: Number(nominal),
        waktu: new Date().toISOString(),
      })
      setNominal('')
      setKeterangan('')
    },
    onError: () => toast.error(`Gagal ${tipe.toLowerCase()}`),
  })

  const valid = rekeningId && Number(nominal) > 0

  if (rekening.length === 0) {
    return <p className={styles.muted}>Anggota belum punya rekening simpanan.</p>
  }

  return (
    <form
      className={styles.form}
      onSubmit={(e) => { e.preventDefault(); if (valid) mutation.mutate() }}
    >
      <label className={styles.field}>
        <span>Rekening</span>
        <select value={rekeningId} onChange={(e) => setRekeningId(e.target.value)}>
          {rekening.map((r) => (
            <option key={r.id} value={r.id}>
              {r.nomor_rekening} — {r.produk_simpanan} ({formatRupiah(r.saldo)})
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Nominal</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          placeholder="0"
        />
      </label>

      <label className={styles.field}>
        <span>Keterangan (opsional)</span>
        <input
          type="text"
          value={keterangan}
          onChange={(e) => setKeterangan(e.target.value)}
        />
      </label>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={!valid || mutation.isPending}
      >
        {mutation.isPending ? 'Memproses…' : `Proses ${tipe}`}
      </button>
    </form>
  )
}

// ─── Bayar Angsuran form ──────────────────────────────────────────────────────

interface AngsuranFormProps {
  nasabah: Nasabah
  akad: AkadSlim[]
  onSuccess: (entry: TapeEntry) => void
}

function AngsuranForm({ nasabah, akad, onSuccess }: AngsuranFormProps) {
  const activeAkad = useMemo(() => akad.filter((a) => a.status === 'Aktif'), [akad])
  const [akadId, setAkadId] = useState(activeAkad[0]?.id ?? '')
  const [nominal, setNominal] = useState('')

  const mutation = useMutation({
    mutationFn: () =>
      pembayaranAngsuranService.create({
        akad_id: akadId,
        nasabah_id: nasabah.id,
        nasabah_nama: nasabah.nama,
        nominal: Number(nominal),
        tanggal_bayar: new Date().toISOString(),
      } as never),
    onSuccess: () => {
      toast.success('Pembayaran tercatat')
      onSuccess({
        id: `${Date.now()}-${Math.random()}`,
        jenis: 'Angsuran',
        nasabah: nasabah.nama,
        nominal: Number(nominal),
        waktu: new Date().toISOString(),
      })
      setNominal('')
    },
    onError: () => toast.error('Gagal mencatat pembayaran'),
  })

  if (activeAkad.length === 0) {
    return <p className={styles.muted}>Tidak ada akad pembiayaan aktif.</p>
  }

  const valid = akadId && Number(nominal) > 0

  return (
    <form
      className={styles.form}
      onSubmit={(e) => { e.preventDefault(); if (valid) mutation.mutate() }}
    >
      <label className={styles.field}>
        <span>Akad Pembiayaan</span>
        <select value={akadId} onChange={(e) => setAkadId(e.target.value)}>
          {activeAkad.map((a) => (
            <option key={a.id} value={a.id}>
              {a.nomor_akad} — sisa {formatRupiah(a.sisa_pokok)}
            </option>
          ))}
        </select>
      </label>

      <label className={styles.field}>
        <span>Nominal Bayar</span>
        <input
          type="number"
          inputMode="numeric"
          min={0}
          value={nominal}
          onChange={(e) => setNominal(e.target.value)}
          placeholder="0"
        />
      </label>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={!valid || mutation.isPending}
      >
        {mutation.isPending ? 'Memproses…' : 'Catat Pembayaran'}
      </button>
    </form>
  )
}

export default TellerWorkstationPage

import type { DenominasiUang } from '@/types/koperasi/kas-teller.types'
import { formatCurrency } from '@/utils/format'
import styles from './DenominasiGrid.module.css'

export interface DenominasiGridProps {
  denominasi: DenominasiUang[]
  value: Record<string, number>
  onChange: (next: Record<string, number>) => void
  disabled?: boolean
}

export function DenominasiGrid({
  denominasi,
  value,
  onChange,
  disabled = false,
}: DenominasiGridProps) {
  const sorted = [...denominasi].sort((a, b) => a.urutan - b.urutan)
  const grandTotal = sorted.reduce(
    (sum, d) => sum + (value[d.name] ?? 0) * d.nilai,
    0,
  )

  return (
    <div className={styles.grid}>
      <div className={styles.header}>
        <span>Pecahan</span>
        <span>Jenis</span>
        <span>Jumlah</span>
        <span>Subtotal</span>
      </div>
      {sorted.map((d) => {
        const qty = value[d.name] ?? 0
        const subtotal = qty * d.nilai
        return (
          <div key={d.name} className={styles.row}>
            <label className={styles.label} htmlFor={`denominasi-${d.name}`}>
              {d.nama}
            </label>
            <span className={styles.jenis}>{d.jenis}</span>
            <input
              id={`denominasi-${d.name}`}
              aria-label={`Jumlah ${d.nama}`}
              type="number"
              min={0}
              step={1}
              disabled={disabled}
              value={qty === 0 ? '' : qty}
              onChange={(e) => {
                const n = Number(e.target.value)
                const next = { ...value }
                if (Number.isFinite(n) && n > 0) next[d.name] = n
                else delete next[d.name]
                onChange(next)
              }}
              className={styles.input}
            />
            <span
              className={styles.subtotal}
              data-testid={`subtotal-${d.name}`}
            >
              {formatCurrency(subtotal)}
            </span>
          </div>
        )
      })}
      <div className={styles.total}>
        <span>Total</span>
        <strong data-testid="denominasi-grand-total">
          {formatCurrency(grandTotal)}
        </strong>
      </div>
    </div>
  )
}

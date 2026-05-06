import styles from './VisuallyHidden.module.css'
import type { ElementType, ReactNode } from 'react'

interface VisuallyHiddenProps {
  children: ReactNode
  /** When true, becomes visible on focus (useful for skip-nav links) */
  focusable?: boolean
  as?: ElementType
}

/**
 * Visually hides content while keeping it accessible to screen readers.
 * Equivalent to Tailwind's `sr-only` class.
 *
 * @example
 * <button>
 *   <PlusIcon />
 *   <VisuallyHidden>Tambah item baru</VisuallyHidden>
 * </button>
 */
export function VisuallyHidden({
  children,
  focusable = false,
  as: Tag = 'span',
}: VisuallyHiddenProps) {
  return (
    <Tag className={`${styles.hidden} ${focusable ? styles.focusable : ''}`}>
      {children}
    </Tag>
  )
}

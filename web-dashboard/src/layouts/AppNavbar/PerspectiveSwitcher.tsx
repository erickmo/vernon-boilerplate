import { useNavigate, useLocation } from 'react-router-dom'
import { User, Shield } from 'lucide-react'
import { useAvailablePerspectives } from '@/hooks/usePerspective'
import { useUiStore } from '@/stores/ui.store'
import { useSayaBadgeCount } from '@/hooks/usePerspectiveBadges'
import {
  DEFAULT_ROUTE_BY_PERSPECTIVE,
  type Perspective,
} from '@/types/perspective.types'
import { routeToPerspective } from './nav.registry'
import { cn } from '@/utils/cn'
import styles from './PerspectiveSwitcher.module.css'

const PERSPECTIVE_META: Record<Perspective, { label: string; icon: typeof User }> = {
  saya: { label: 'Saya', icon: User },
  admin: { label: 'Admin', icon: Shield },
}

function formatBadge(n: number): string | null {
  if (n <= 0) return null
  return n > 9 ? '9+' : String(n)
}

export function PerspectiveSwitcher() {
  const available = useAvailablePerspectives()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)
  const navigate = useNavigate()
  const location = useLocation()

  const sayaCount = useSayaBadgeCount()
  const badgeBy: Record<Perspective, number> = {
    saya: sayaCount,
    admin: 0,
  }

  if (available.length <= 1) return null

  function handleClick(target: Perspective) {
    if (target === perspective) return
    setPerspective(target)
    const routeOwner = routeToPerspective(location.pathname)
    if (routeOwner !== target) {
      navigate(DEFAULT_ROUTE_BY_PERSPECTIVE[target])
    }
  }

  function handleKeyDown(e: React.KeyboardEvent, idx: number) {
    if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
      e.preventDefault()
      const dir = e.key === 'ArrowRight' ? 1 : -1
      const next = (idx + dir + available.length) % available.length
      handleClick(available[next])
    } else if (e.key === 'Home') {
      e.preventDefault()
      handleClick(available[0])
    } else if (e.key === 'End') {
      e.preventDefault()
      handleClick(available[available.length - 1])
    }
  }

  return (
    <div className={styles.root} role="tablist" aria-label="Mode tampilan">
      {available.map((p, idx) => {
        const meta = PERSPECTIVE_META[p]
        const Icon = meta.icon
        const active = p === perspective
        const badge = active ? null : formatBadge(badgeBy[p])
        return (
          <button
            key={p}
            type="button"
            role="tab"
            aria-selected={active}
            tabIndex={active ? 0 : -1}
            className={cn(styles.tab, active && styles.tabActive)}
            onClick={() => handleClick(p)}
            onKeyDown={(e) => handleKeyDown(e, idx)}
          >
            <Icon size={14} />
            <span className={styles.label}>{meta.label}</span>
            {badge && <span className={styles.badge}>{badge}</span>}
          </button>
        )
      })}
    </div>
  )
}

import { useEffect } from 'react'
import { useLocation } from 'react-router-dom'
import { useUiStore } from '@/stores/ui.store'
import { routeToPerspective } from './nav.registry'

/**
 * Auto-aligns the active perspective to whatever the current route belongs to.
 * Mount once inside AppShell. Renders nothing.
 */
export function PerspectiveSync() {
  const location = useLocation()
  const perspective = useUiStore((s) => s.perspective)
  const setPerspective = useUiStore((s) => s.setPerspective)

  useEffect(() => {
    const owner = routeToPerspective(location.pathname)
    if (owner && owner !== perspective) {
      setPerspective(owner)
    }
  }, [location.pathname, perspective, setPerspective])

  return null
}

import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { ArrowLeft, HelpCircle, ChevronRight, Home, Link2, MoreVertical, X } from 'lucide-react'
import { StatusPills } from '@/widgets/StatusPills/StatusPills'
import { ProgressWidget, type ProgressStep, type TerminalStatus } from '@/widgets/ProgressWidget/ProgressWidget'
import { DataConnectionWidget, type DataConnectionItem, type FilterTuple } from '@/widgets/DataConnectionWidget/DataConnectionWidget'
import { useAutoBreadcrumbs } from '@/hooks/useAutoBreadcrumbs'
import { useDashboardContext, type DashboardContext } from '@/hooks/useDashboardContext'
import { useModuleAccess } from '@/hooks/useModuleAccess'
import styles from './DetailPageTemplate.module.css'

export type { DataConnectionItem, FilterTuple }

// ─── Types ────────────────────────────────────────────────────────────────────

export interface DetailPageTab {
  id: string
  label: string
  icon?: React.ReactNode
  content: React.ReactNode
}

export interface DetailPageSection {
  id: string
  label: string
  icon?: React.ReactNode
  tabs: DetailPageTab[]
}

export interface DetailPageAction {
  label: string
  icon?: React.ReactNode
  onClick: () => void
  variant?: 'default' | 'primary' | 'warning' | 'success' | 'danger'
  disabled?: boolean
  overflowOnly?: boolean // Force this action to appear in dropdown only
}

export interface HelpModalContent {
  title: string
  text: string
}

interface DetailPageTemplateProps {
  /** Back button label and callback */
  onBack?: () => void
  backLabel?: string

  /** Header card */
  icon?: React.ReactNode
  code?: string
  title: string
  badges?: React.ReactNode

  /** Tabs. Single tab = no tab bar chrome, just content. */
  tabs: DetailPageTab[]

  /** Optional sidebar sections. When set, the sidebar menu controls which submenu tabs show. */
  sections?: DetailPageSection[]

  /** Action buttons (Edit, Hapus, etc.) */
  actions?: DetailPageAction[]

  /** Help modal content and callback — help modal is managed at page scope */
  helpTitle?: string
  helpText?: string
  onShowHelp?: (content: HelpModalContent) => void

  /** When true: hides action buttons, shows "Hanya Baca" pill in header card */
  readonly?: boolean
  /** When true: shows "Dikelola HQ" pill in header card */
  managedByHQ?: boolean

  /** Optional progress stepper shown below the title card */
  progress?: {
    steps: ProgressStep[]
    currentStatus: string
    terminalStatus?: TerminalStatus
  }

  /** When provided, appends a built-in "Koneksi" tab using DataConnectionWidget */
  connections?: {
    title?: string
    items: DataConnectionItem[]
  }

  /** Explicit dashboard context for DataConnectionWidget. If not provided, auto-detects from URL. */
  dashboardContext?: DashboardContext
}

// ─── Component ────────────────────────────────────────────────────────────────

export function DetailPageTemplate({
  onBack,
  backLabel = 'Kembali',
  icon,
  code,
  title,
  badges,
  tabs,
  sections,
  actions = [],
  helpTitle,
  helpText,
  onShowHelp,
  readonly: isReadonly = false,
  managedByHQ = false,
  progress,
  connections,
  dashboardContext: explicitContext,
}: DetailPageTemplateProps) {
  const moduleAccess = useModuleAccess()
  const effectiveReadonly = isReadonly || moduleAccess.readonly
  const effectiveManagedByHQ = managedByHQ || moduleAccess.managedByHQ

  const detectedContext = useDashboardContext()
  const context = explicitContext ?? detectedContext

  const koneksiTab: DetailPageTab = {
    id: '__koneksi__',
    label: 'Koneksi',
    icon: <Link2 size={14} />,
    content: (
      <DataConnectionWidget
        title={connections?.title}
        items={connections?.items ?? []}
        dashboardContext={context}
      />
    ),
  }

  const sectionItems = sections?.length
    ? sections
    : [{ id: '__default__', label: 'Menu', tabs }]

  const [activeSectionId, setActiveSectionId] = useState(sectionItems[0]?.id ?? '__default__')
  const activeSection = sectionItems.find((section) => section.id === activeSectionId) ?? sectionItems[0]
  const activeSectionTabs = activeSection ? [...activeSection.tabs, koneksiTab] : [koneksiTab]

  const [activeTab, setActiveTab] = useState(activeSectionTabs[0]?.id ?? '__log__')
  const [overflowOpen, setOverflowOpen] = useState(false)
  const [showHelpModal, setShowHelpModal] = useState(false)
  const overflowRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (overflowRef.current && !overflowRef.current.contains(e.target as Node)) {
        setOverflowOpen(false)
      }
    }
    if (overflowOpen) document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [overflowOpen])

  const currentTabId = activeSectionTabs.some((tab) => tab.id === activeTab)
    ? activeTab
    : (activeSectionTabs[0]?.id ?? '__log__')
  const activeContent = activeSectionTabs.find((t) => t.id === currentTabId)?.content
  const hasMultipleTabs = activeSectionTabs.length > 1
  const hasHelp = !!(helpTitle || helpText)
  const autoBreadcrumbs = useAutoBreadcrumbs(title)
  const handleBack = onBack ?? (() => window.history.back())
  const helpContent = { title: helpTitle ?? title, text: helpText ?? '' }

  const menuActions = [
    ...actions.filter((action) => action.variant !== 'danger'),
    ...actions.filter((action) => action.variant === 'danger'),
  ]

  return (
    <div className={styles.page}>
      {/* Header card — breadcrumbs + identity + actions (mirrors PageHeader style) */}
      <div className={styles.header}>
        <div className={styles.breadcrumbRow}>
          <button className={styles.backBtn} onClick={handleBack}>
            <ArrowLeft size={14} />
            {backLabel}
          </button>
          <nav className={styles.breadcrumbs} aria-label="Breadcrumb">
            {autoBreadcrumbs.map((crumb, i) => (
              <span key={i} className={styles.crumbItem}>
                {i === 0 && <Home size={12} />}
                {crumb.href ? (
                  <Link to={crumb.href} className={styles.crumbLink}>{crumb.label}</Link>
                ) : (
                  <span className={styles.crumbCurrent}>{crumb.label}</span>
                )}
                {i < autoBreadcrumbs.length - 1 && (
                  <ChevronRight size={12} className={styles.separator} />
                )}
              </span>
            ))}
          </nav>
        </div>

        <div className={styles.headerContent}>
          <div className={styles.headerLeft}>
            {icon && <div className={styles.itemIcon}>{icon}</div>}
            <div className={styles.itemMeta}>
              {code && <span className={styles.itemCode}>{code}</span>}
              <h1 className={styles.itemTitle}>{title}</h1>
              {(badges || effectiveReadonly || effectiveManagedByHQ) && (
                <div className={styles.badges}>
                  {badges}
                  <StatusPills readonly={effectiveReadonly} managedByHQ={effectiveManagedByHQ} />
                </div>
              )}
            </div>
          </div>

          <div className={styles.headerRight}>
            {hasHelp && (
              <button
                className={styles.helpBtn}
                type="button"
                onClick={() => {
                  if (onShowHelp) onShowHelp(helpContent)
                  else setShowHelpModal(true)
                }}
                title="Bantuan"
                aria-label="Bantuan"
              >
                <HelpCircle size={16} />
              </button>
            )}
            {actions.length > 0 && !effectiveReadonly && !effectiveManagedByHQ && (
              <div className={styles.actions}>
                <div className={styles.overflowWrap} ref={overflowRef}>
                  <button
                    className={styles.overflowBtn}
                    onClick={() => setOverflowOpen((v) => !v)}
                    title="Aksi lainnya"
                    aria-label="Aksi lainnya"
                    aria-haspopup="menu"
                    aria-expanded={overflowOpen}
                  >
                    <MoreVertical size={17} />
                  </button>
                  {overflowOpen && (
                    <div className={styles.dropdown} role="menu">
                      {menuActions.map((action, i) => {
                        const isDanger = action.variant === 'danger'
                        const prevIsDanger = i > 0 && menuActions[i - 1].variant === 'danger'
                        const showDivider = isDanger && !prevIsDanger && i > 0
                        return (
                          <div key={action.label}>
                            {showDivider && <div className={styles.dropdownDivider} />}
                            <button
                              className={`${styles.dropdownItem} ${isDanger ? styles.dropdownItemDanger : ''}`}
                              onClick={() => { setOverflowOpen(false); action.onClick() }}
                              disabled={action.disabled}
                              role="menuitem"
                            >
                              {action.icon}
                              {action.label}
                            </button>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Progress stepper */}
      {progress && (
        <div className={styles.progressCard}>
          <ProgressWidget
            steps={progress.steps}
            currentStatus={progress.currentStatus}
            terminalStatus={progress.terminalStatus}
          />
        </div>
      )}

      {/* Main layout */}
      <div className={styles.detailGrid}>
        <aside className={styles.menuCard} aria-label="Detail menu">
          <div className={styles.menuHeader}>
            <span className={styles.menuTitle}>Menu</span>
            <span className={styles.menuCount}>{sectionItems.length} items</span>
          </div>
          <div className={styles.menuList}>
            {sectionItems.map((section) => {
              const isActive = activeSection?.id === section.id
              return (
                <button
                  key={section.id}
                  type="button"
                  className={`${styles.menuItem} ${isActive ? styles.menuItemActive : ''}`}
                  onClick={() => {
                    setActiveSectionId(section.id)
                    setActiveTab(section.tabs[0]?.id ?? '__log__')
                  }}
                  aria-pressed={isActive}
                >
                  {section.icon && <span className={styles.menuIcon}>{section.icon}</span>}
                  <span className={styles.menuLabel}>{section.label}</span>
                </button>
              )
            })}
          </div>
        </aside>

        <div className={styles.tabsCard}>
          {hasMultipleTabs && (
            <div className={styles.tabList}>
              {activeSectionTabs.map((tab) => (
                <button
                  key={tab.id}
                  className={`${styles.tab} ${currentTabId === tab.id ? styles.tabActive : ''}`}
                  onClick={() => setActiveTab(tab.id)}
                  type="button"
                >
                  {tab.icon}
                  {tab.label}
                </button>
              ))}
            </div>
          )}
          <div className={styles.tabContentWrapper}>
            <div className={styles.tabContent}>{activeContent}</div>
          </div>
        </div>
      </div>

      {showHelpModal && hasHelp && (
        <div className={styles.overlay} onClick={() => setShowHelpModal(false)}>
          <div
            className={styles.helpModal}
            role="dialog"
            aria-modal="true"
            aria-labelledby="detail-help-title"
            onClick={(event) => event.stopPropagation()}
          >
            <div className={styles.helpModalHeader}>
              <span className={styles.helpModalIcon}>
                <HelpCircle size={18} />
              </span>
              <h2 id="detail-help-title" className={styles.helpModalTitle}>{helpContent.title}</h2>
              <button
                className={styles.helpModalClose}
                type="button"
                aria-label="Tutup bantuan"
                onClick={() => setShowHelpModal(false)}
              >
                <X size={16} />
              </button>
            </div>
            <p className={styles.helpModalBody}>{helpContent.text}</p>
          </div>
        </div>
      )}
    </div>
  )
}

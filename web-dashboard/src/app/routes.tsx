/* eslint-disable react-refresh/only-export-components */
import { createBrowserRouter } from 'react-router-dom'
import { lazy, Suspense } from 'react'
import { AppShell } from '@/layouts/AppShell/AppShell'
import { appConfig } from '@/config/app.config'
import {
  RootRedirect,
  AuthRoute,
  GuestRoute,
  SuperuserRoute,
  GroupRoute,
  CompanyRoute,
} from './ProtectedRoute'

// ─── Lazy-loaded pages ────────────────────────────────────────────────────────

const LoginPage          = lazy(() => import('@/pages/Login/LoginPage'))
const DashboardPage      = lazy(() => import('@/pages/Dashboard/DashboardPage'))
const AuditLogPage       = lazy(() => import('@/pages/AuditLog/AuditLogPage'))
const ProfilePage        = lazy(() => import('@/pages/Profile/ProfilePage'))
const ChangePasswordPage = lazy(() => import('@/pages/ChangePassword/ChangePasswordPage'))
const ExamplesListPage   = lazy(() => import('@/pages/Examples/ExamplesListPage'))
const ExampleDetailPage  = lazy(() => import('@/pages/Examples/ExampleDetailPage'))
const ExampleFormPage    = lazy(() => import('@/pages/Examples/ExampleFormPage'))
const ChooseCompanyPage  = lazy(() => import('@/pages/ChooseCompany/ChooseCompanyPage'))
const NotFoundPage       = lazy(() => import('@/pages/errors/NotFoundPage'))
const ForbiddenPage      = lazy(() => import('@/pages/errors/ForbiddenPage'))

function S({ children }: { children: React.ReactNode }) {
  return <Suspense fallback={<div />}>{children}</Suspense>
}

// ─── Single-tenant routes ─────────────────────────────────────────────────────
// Active when VITE_MULTI_TENANT=false (default)

const singleTenantRoutes = [
  {
    path: '/',
    element: <AuthRoute><AppShell /></AuthRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      { path: 'audit-log', element: <S><AuditLogPage /></S> },
      { path: 'profile', element: <S><ProfilePage /></S> },
      { path: 'change-password', element: <S><ChangePasswordPage /></S> },
      { path: 'examples', element: <S><ExamplesListPage /></S> },
      { path: 'examples/new', element: <S><ExampleFormPage /></S> },
      { path: 'examples/:id', element: <S><ExampleDetailPage /></S> },
      // Add your pages here:
      // { path: 'users',        element: <S><UsersListPage /></S> },
      // { path: 'users/:id',    element: <S><UserDetailPage /></S> },
      // { path: 'users/new',    element: <S><UserFormPage /></S> },
      // { path: 'settings',     element: <S><SettingsPage /></S> },
    ],
  },
]

// ─── Multi-tenant routes ──────────────────────────────────────────────────────
// Active when VITE_MULTI_TENANT=true

const multiTenantRoutes = [
  // Company/group selection page
  {
    path: '/choose-company',
    element: <AuthRoute><S><ChooseCompanyPage /></S></AuthRoute>,
  },

  // ── Superuser context: /su/* ─────────────────────────────────────────────────
  {
    path: '/su',
    element: <SuperuserRoute><AppShell context="superuser" /></SuperuserRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      { path: 'audit-log', element: <S><AuditLogPage /></S> },
      { path: 'profile', element: <S><ProfilePage /></S> },
      { path: 'change-password', element: <S><ChangePasswordPage /></S> },
      { path: 'examples', element: <S><ExamplesListPage /></S> },
      { path: 'examples/new', element: <S><ExampleFormPage /></S> },
      { path: 'examples/:id', element: <S><ExampleDetailPage /></S> },
      // { path: 'tenants',   element: <S><TenantsListPage /></S> },
      // { path: 'companies', element: <S><CompaniesListPage /></S> },
    ],
  },

  // ── HQ / Group context: /g/* ─────────────────────────────────────────────────
  {
    path: '/g',
    element: <GroupRoute><AppShell context="hq" /></GroupRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      { path: 'audit-log', element: <S><AuditLogPage /></S> },
      { path: 'profile', element: <S><ProfilePage /></S> },
      { path: 'change-password', element: <S><ChangePasswordPage /></S> },
      { path: 'examples', element: <S><ExamplesListPage /></S> },
      { path: 'examples/new', element: <S><ExampleFormPage /></S> },
      { path: 'examples/:id', element: <S><ExampleDetailPage /></S> },
      // { path: 'reports',  element: <S><HQReportsPage /></S> },
    ],
  },

  // ── Company context: /c/:companyCode/* ───────────────────────────────────────
  {
    path: '/c/:companyCode',
    element: <CompanyRoute><AppShell context="company" /></CompanyRoute>,
    children: [
      { path: 'dashboard', element: <S><DashboardPage /></S> },
      { path: 'audit-log', element: <S><AuditLogPage /></S> },
      { path: 'profile', element: <S><ProfilePage /></S> },
      { path: 'change-password', element: <S><ChangePasswordPage /></S> },
      { path: 'examples', element: <S><ExamplesListPage /></S> },
      { path: 'examples/new', element: <S><ExampleFormPage /></S> },
      { path: 'examples/:id', element: <S><ExampleDetailPage /></S> },
      // { path: 'users',     element: <S><UsersListPage /></S> },
      // { path: 'settings',  element: <S><SettingsPage /></S> },
    ],
  },
]

// ─── Router ───────────────────────────────────────────────────────────────────

export const router = createBrowserRouter([
  // Root — redirect based on auth state + tenant mode
  { path: '/', element: <RootRedirect /> },

  // Login (guest only)
  { path: '/login', element: <GuestRoute><S><LoginPage /></S></GuestRoute> },

  // Active route set based on tenant mode
  ...(appConfig.isMultiTenant ? multiTenantRoutes : singleTenantRoutes),

  // Error pages
  { path: '/403', element: <S><ForbiddenPage /></S> },
  { path: '*',    element: <S><NotFoundPage /></S> },
])

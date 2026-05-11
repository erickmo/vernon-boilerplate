import type {
  Tenant,
  TenantDetail,
  CreateTenantPayload,
  UpdateTenantPayload,
  CreateOrgUserPayload,
} from '@/types/tenant.types'

const BASE_URL = import.meta.env.VITE_API_BASE_URL ?? ''

function getCsrfToken(): string {
  return (
    document.cookie
      .split('; ')
      .find((c) => c.startsWith('csrf_token='))
      ?.split('=')[1]
  ) ?? 'fetch'
}

async function callMethod<T>(method: string, params: Record<string, unknown> = {}): Promise<T> {
  const res = await fetch(`${BASE_URL}/api/method/${method}`, {
    method: 'POST',
    credentials: 'include',
    headers: {
      'Content-Type': 'application/json',
      'X-Frappe-CSRF-Token': getCsrfToken(),
    },
    body: JSON.stringify(params),
  })
  if (!res.ok) {
    const json = await res.json().catch(() => ({})) as Record<string, unknown>
    const msg = (json['exception'] as string) ?? `${res.status} ${method}`
    throw new Error(msg)
  }
  const json = await res.json() as Record<string, unknown>
  return (json['message'] ?? json) as T
}

export const tenantService = {
  getTenantList: () =>
    callMethod<Tenant[]>('vernon_saas.api.tenant.get_tenant_list'),

  getTenantDetail: (org: string) =>
    callMethod<TenantDetail>('vernon_saas.api.tenant.get_tenant_detail', { org }),

  createTenant: (data: CreateTenantPayload) =>
    callMethod<Tenant>('vernon_saas.api.tenant.create_tenant', { data }),

  updateTenant: (org: string, data: UpdateTenantPayload) =>
    callMethod<Tenant>('vernon_saas.api.tenant.update_tenant', { org, data }),

  toggleInstitutionStatus: (name: string, doctype: 'Sekolah' | 'Koperasi', status: 'Aktif' | 'Non-Aktif') =>
    callMethod<{ name: string; status: string }>(
      'vernon_saas.api.tenant.toggle_institution_status',
      { name, doctype, status }
    ),

  createOrgUser: (payload: CreateOrgUserPayload) =>
    callMethod<{ name: string; email: string; full_name: string }>(
      'vernon_saas.api.tenant.create_org_user',
      payload as unknown as Record<string, unknown>
    ),

  toggleModule: (institution: string, institution_doctype: 'Sekolah' | 'Koperasi', module_name: string, aktif: boolean) =>
    callMethod<{ institution: string; module: string; aktif: boolean }>(
      'vernon_saas.api.tenant.toggle_module',
      { institution, institution_doctype, module_name, aktif }
    ),
}

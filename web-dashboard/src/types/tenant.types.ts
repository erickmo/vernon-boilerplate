export interface Tenant {
  name: string
  nama: string
  logo?: string
  status: 'Aktif' | 'Non-Aktif'
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  institution_count: number
  user_count: number
}

export interface TenantModul {
  nama_modul: string
  aktif: boolean
}

export interface TenantLembaga {
  name: string
  nama: string
  jenjang: string
}

export interface TenantInstitution {
  name: string
  nama: string
  type: 'sekolah' | 'koperasi'
  status: 'Aktif' | 'Non-Aktif'
  logo?: string
  lembaga: TenantLembaga[]
  modul_aktif: TenantModul[]
}

export interface OrgUser {
  name: string
  full_name: string
  email: string
  enabled: boolean
  roles: string[]
  institution: string
  institution_doctype: string
}

export interface TenantDetail {
  info: Tenant
  institutions: TenantInstitution[]
  users: OrgUser[]
}

export interface CreateTenantPayload {
  nama: string
  jenis_organisasi: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
}

export interface UpdateTenantPayload {
  nama?: string
  jenis_organisasi?: string
  email?: string
  telepon?: string
  npwp?: string
  alamat?: string
  logo?: string
  status?: 'Aktif' | 'Non-Aktif'
}

export interface CreateOrgUserPayload {
  org: string
  email: string
  full_name: string
  password: string
  role: string
  institution: string
  institution_doctype: 'Sekolah' | 'Koperasi'
}

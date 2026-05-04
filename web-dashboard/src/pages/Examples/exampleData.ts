import type { PaginatedResponse } from '@/types/api.types'
import type { ListParams } from '@/services/createEntityService'

export interface ExampleProject extends Record<string, unknown> {
  id: string
  code: string
  name: string
  owner: string
  status: 'Draft' | 'Active' | 'Review'
  priority: 'Low' | 'Medium' | 'High'
  updatedAt: string
}

export const exampleProjects: ExampleProject[] = [
  {
    id: 'ex-001',
    code: 'EX-001',
    name: 'Customer onboarding refresh',
    owner: 'Maya Santoso',
    status: 'Active',
    priority: 'High',
    updatedAt: '2026-05-01',
  },
  {
    id: 'ex-002',
    code: 'EX-002',
    name: 'Audit trail cleanup',
    owner: 'Rafi Pradana',
    status: 'Review',
    priority: 'Medium',
    updatedAt: '2026-04-28',
  },
  {
    id: 'ex-003',
    code: 'EX-003',
    name: 'Inventory sync pilot',
    owner: 'Nadia Putri',
    status: 'Draft',
    priority: 'Low',
    updatedAt: '2026-04-20',
  },
]

export async function fetchExampleProjects(params: ListParams): Promise<PaginatedResponse<ExampleProject>> {
  const search = String(params.search ?? '').toLowerCase()
  const filtered = search
    ? exampleProjects.filter((project) =>
        [project.code, project.name, project.owner, project.status, project.priority]
          .some((value) => value.toLowerCase().includes(search)),
      )
    : exampleProjects

  return {
    items: filtered,
    total: filtered.length,
    limit: Number(params.limit ?? 100),
    offset: Number(params.offset ?? 0),
  }
}

export function getExampleProject(id: string | undefined) {
  return exampleProjects.find((project) => project.id === id) ?? exampleProjects[0]
}

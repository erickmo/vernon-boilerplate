import { createEntityService } from './createEntityService'
import type { BaseEntity } from '@/types/entity.types'

export const superuserCompanyGroupService = createEntityService<BaseEntity>(
  '/api/v1/superuser/company-groups',
)

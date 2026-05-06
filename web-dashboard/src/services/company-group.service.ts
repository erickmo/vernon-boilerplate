import { createEntityService } from './createEntityService'
import type { BaseEntity } from '@/types/entity.types'

export const companyGroupService = createEntityService<BaseEntity>(
  '/api/v1/company-groups',
)

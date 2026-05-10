import { createEntityService } from './createEntityService'
import type { BaseEntity } from '@/types/entity.types'

export const tenantOwnerService = createEntityService<BaseEntity>(
  '/api/v1/superuser/tenant-owners',
)

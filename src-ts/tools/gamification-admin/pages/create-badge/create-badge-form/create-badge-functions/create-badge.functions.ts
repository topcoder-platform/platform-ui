import { CreateBadgeRequest, createBadgeSubmitRequestAsync } from './create-badge-store'

export async function submitRequestAsync(request: CreateBadgeRequest): Promise<void> {
    return createBadgeSubmitRequestAsync(request)
}

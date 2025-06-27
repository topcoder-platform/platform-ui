import { GameBadge } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'

import { CreateBadgeRequest, createBadgeSubmitRequestAsync } from './create-badge-store'

export async function submitRequestAsync(request: CreateBadgeRequest): Promise<GameBadge> {
    return createBadgeSubmitRequestAsync(request)
}

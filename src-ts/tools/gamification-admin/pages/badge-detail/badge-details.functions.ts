import { GameBadge } from '../../game-lib'

import { submitRequestAsync as submitBadgeUpdateRequestAsync } from './update-badge.store'
import { UpdateBadgeRequest } from './updated-badge-request.model'

export async function submitRequestAsync(request: UpdateBadgeRequest): Promise<GameBadge> {
    return submitBadgeUpdateRequestAsync(request)
}

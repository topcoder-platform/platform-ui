import { CSV_HEADER } from '../../config'
import { GameBadge } from '../../game-lib'

import { submitRequestAsync as submitBatchAssignRequestAsync } from './batch-assign-badge.store'
import { submitRequestAsync as submitBadgeAssingRequestAsync } from './manual-assign-badge.store'
import { submitRequestAsync as submitBadgeUpdateRequestAsync } from './update-badge.store'
import { UpdateBadgeRequest } from './updated-badge-request.model'

export async function submitRequestAsync(request: UpdateBadgeRequest): Promise<GameBadge> {
    return submitBadgeUpdateRequestAsync(request)
}

export function generateCSV(input: Array<Array<string | number>>): string {
    input.unshift(CSV_HEADER)

    return input.map(row => row.join(','))
        .join('\n')
}

export async function manualAssignRequestAsync(csv: string): Promise<any> {
    return submitBadgeAssingRequestAsync(csv)
}

export async function batchAssignRequestAsync(batchFile: File): Promise<any> {
    return submitBatchAssignRequestAsync(batchFile)
}

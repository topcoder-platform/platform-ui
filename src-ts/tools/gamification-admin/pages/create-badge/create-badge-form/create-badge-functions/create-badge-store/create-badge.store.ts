import { EnvironmentConfig } from '../../../../../../../config'
import { xhrPostAsync } from '../../../../../../../lib'

import { CreateBadgeRequest } from './create-badge-request.model'

export async function submitRequestAsync(request: CreateBadgeRequest): Promise<void> {
    console.log('submitRequestAsync', request)
    const url: string = `${EnvironmentConfig.API.V5}/gamification/badges`
    await xhrPostAsync(url, request)
}

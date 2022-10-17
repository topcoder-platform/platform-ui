import { EnvironmentConfig } from '../../../../../../../config'
import { xhrPostAsync } from '../../../../../../../lib'
import { GameBadge } from '../../../../../game-lib'

import { CreateBadgeRequest } from './create-badge-request.model'

export async function submitRequestAsync(request: CreateBadgeRequest): Promise<GameBadge> {
    const url: string = `${EnvironmentConfig.API.V5}/gamification/badges`

    const form: any = new FormData()

    // fill the form
    form.append('file', request.files[0])
    form.append('organization_id', request.orgID)
    form.append('badge_status', request.badgeStatus)
    form.append('badge_name', request.badgeName)
    form.append('badge_description', request.badgeDesc)
    form.append('active', request.badgeActive ? 'true' : 'false')

    return xhrPostAsync(url, form, {
        headers: {
            'Content-Type': 'multipart/form-data',
        },
    })
}

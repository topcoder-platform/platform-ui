import { EnvironmentConfig } from '../../../../config'
import { xhrPostAsync } from '../../../../lib'
import { GameBadge } from '../../game-lib'

import { UpdateBadgeRequest } from './updated-badge-request.model'

export async function submitRequestAsync(request: UpdateBadgeRequest): Promise<GameBadge> {
    const url: string = `${EnvironmentConfig.API.V5}/gamification/badges/${request.id}`

    const form: any = new FormData()

    // fill the form, all fields optional
    if (request.files) {
        form.append('file', request.files[0])
    }
    if (request.badgeActive !== undefined) {
        form.append('active', request.badgeActive)
    }
    if (request.badgeName) { (
        form.append('badge_name', request.badgeName)
    )
    }
    if (request.badgeDesc) {
        form.append('badge_description', request.badgeDesc)
    }

    return xhrPostAsync(url, form, {
        headers: {
            'Content-Type': 'multipart/form-data',
        }
    })
}

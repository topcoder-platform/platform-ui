import { EnvironmentConfig } from '../../../../config'
import { xhrGetAsync } from '../../xhr-functions'

import { GetUnreadMessageCountResponse } from './get-unread-message-count-response.model'

export async function getUnreadCountAsync(workId: string, handle: string): Promise<GetUnreadMessageCountResponse> {

    const url: string = `${EnvironmentConfig.API.FORUM_V2}/groups/${workId}/member/${handle}?access_token=${EnvironmentConfig.API.FORUM_ACCESS_TOKEN}`

    const response: { unreadNotifications: number } = await xhrGetAsync(url)

    return {
        messageCount: response.unreadNotifications,
        workId,
    }
}

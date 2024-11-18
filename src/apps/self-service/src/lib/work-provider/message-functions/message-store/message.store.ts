import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { GetUnreadMessageCountResponse } from './get-unread-message-count-response.model'

export async function getUnreadCountAsync(workId: string, handle: string): Promise<GetUnreadMessageCountResponse> {

    // Removing this because it's no longer needed and showed up in a pen test failure (PM-324)
    // const url: string = [
    //     `${EnvironmentConfig.VANILLA_FORUM.V2_URL}/groups/${workId}/member/${handle}`,
    //     `access_token=${EnvironmentConfig.VANILLA_FORUM.ACCESS_TOKEN}`,
    // ].join('?')

    // const response: { unreadNotifications: number } = await xhrGetAsync(url)

    // return {
    //     messageCount: response.unreadNotifications,
    //     workId,
    // }
    return {
        messageCount: 0,
        workId,
    }
}

/**
 * Bus event service
 */
import { EnvironmentConfig } from '~/config'
import { xhrPostAsync } from '~/libs/core'

import { CommonRequestBusAPI } from '../models'

/**
 * Send post event to bus api
 * @param data bus event data
 * @returns resolve to empty string if success
 */
export const reqToBusAPI = async (data: CommonRequestBusAPI): Promise<string> => {
    const resultData = await xhrPostAsync<CommonRequestBusAPI, string>(
        `${EnvironmentConfig.API.V5}/bus/events`,
        data,
    )
    return resultData
}

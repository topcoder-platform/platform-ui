import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { TimelineTemplate } from '../models'

export const getTimelineTemplates = async (): Promise<TimelineTemplate[]> => {
    const result = await xhrGetAsync<TimelineTemplate[]>(
        `${EnvironmentConfig.API.V6}/timeline-templates`,
    )
    return result
}

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'

import { Phase } from '../models'

export const getPhases = async (): Promise<Phase[]> => {
    const result = await xhrGetAsync<Phase[]>(
        `${EnvironmentConfig.API.V6}/challenge-phases`,
    )
    return result
}

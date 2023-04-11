import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigDev: LearnConfigModel = {
    ...LearnConfigDefault,
    API: 'https://api.topcoder-dev.com/v5/learning-paths',
    CLIENT: 'https://fcc.topcoder-dev.com:4431',
}

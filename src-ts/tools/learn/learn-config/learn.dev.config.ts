import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigDev: LearnConfigModel = {
    ...LearnConfigDefault,
    CLIENT: 'https://freecodecamp.topcoder-dev.com',
}

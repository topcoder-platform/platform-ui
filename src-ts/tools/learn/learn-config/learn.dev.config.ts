import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigDev: LearnConfigModel = {
    ...LearnConfigDefault,
    API: 'https://49f0-37-143-193-1.ngrok.io/v5/learning-paths',
    CLIENT: 'https://freecodecamp.topcoder-dev.com',
}

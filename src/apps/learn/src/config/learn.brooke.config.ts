import { LearnConfigModel } from './learn-config.model'
// eslint-disable-next-line @typescript-eslint/no-unused-vars
import { LearnConfigDefault } from './learn.default.config'
import { LearnConfigDev } from './learn.dev.config'

export const LearnConfigBrooke: LearnConfigModel = {
    ...LearnConfigDev,
    // API: LearnConfigDefault.API,
    // CLIENT: LearnConfigDefault.CLIENT,
}

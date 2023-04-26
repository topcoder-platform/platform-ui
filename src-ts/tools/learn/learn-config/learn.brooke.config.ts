import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDev } from './learn.dev.config'

export const LearnConfigBrooke: LearnConfigModel = {
    ...LearnConfigDev,
    // API: LearnConfigDefault.API,
    // CLIENT: LearnConfigDefault.CLIENT,
}

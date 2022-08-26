import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'
import { LearnConfigDev } from './learn.dev.config'

export const LearnConfigBsouza: LearnConfigModel = {
    ...LearnConfigDev,
    CLIENT: LearnConfigDefault.CLIENT,
}

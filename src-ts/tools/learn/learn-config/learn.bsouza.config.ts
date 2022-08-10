import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigBsouza: LearnConfigModel = {
    ...LearnConfigDefault,
    API: 'http://localhost:3001/v5/learning-paths',
}

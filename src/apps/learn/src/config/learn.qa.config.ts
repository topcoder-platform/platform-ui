import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigQA: LearnConfigModel = {
    ...LearnConfigDefault,
    CLIENT: 'https://freecodecamp.topcoder-qa.com',
}

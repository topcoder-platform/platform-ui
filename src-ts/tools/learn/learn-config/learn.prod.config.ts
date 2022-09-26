import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigProd: LearnConfigModel = {
    ...LearnConfigDefault,
    API: 'https://api.topcoder.com/v5/learning-paths',
    CERT_DOMAIN: 'https://certificate.topcoder.com',
    CLIENT: 'https://freecodecamp.topcoder.com',
}

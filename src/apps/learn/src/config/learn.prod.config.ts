import { LearnConfigModel } from './learn-config.model'
import { LearnConfigDefault } from './learn.default.config'

export const LearnConfigProd: LearnConfigModel = {
    ...LearnConfigDefault,
    CERT_DOMAIN: 'https://certificate.topcoder.com',
    CERT_IMAGE_ORIGIN: 'https://tca.topcoder.com',
    CLIENT: 'https://freecodecamp.topcoder.com',
}

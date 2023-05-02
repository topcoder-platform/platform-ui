import { EnvironmentConfig } from '~/config'
import { getReactEnv } from '~/config/environments/react-env'

import { LearnConfigModel } from './learn-config.model'

export const LearnConfigDefault: LearnConfigModel = {
    API: `${EnvironmentConfig.API.V5}/learning-paths`,
    CERT_ALT_PARAMS: {
        'view-style': 'large-container',
    },
    CERT_DOMAIN: 'https://certificate.topcoder-dev.com',
    CERT_ELEMENT_SELECTOR: {
        attribute: 'data-id',
        value: 'certificate-container',
    },
    CLIENT: 'https://fcc.topcoder-dev.com:4431',
    REQUIRE_DICE_ID: `${getReactEnv<string>('REQUIRE_DICE_ID', '')}` === 'true',
}

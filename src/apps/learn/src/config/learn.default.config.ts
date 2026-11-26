import { EnvironmentConfig } from '~/config'

import { LearnConfigModel } from './learn-config.model'

export const LearnConfigDefault: LearnConfigModel = {
    API: `${EnvironmentConfig.API.V5}/learning-paths`,
    CERT_ALT_PARAMS: {
        'view-style': 'large-container',
    },
    CERT_DOMAIN: `https://certificate.${EnvironmentConfig.TC_DOMAIN}`,
    CERT_ELEMENT_SELECTOR: {
        attribute: 'data-id',
        value: 'certificate-container',
    },
    CERT_IMAGE_ORIGIN: 'https://tca-dev.topcoder-dev.com',
    CLIENT: 'https://fcc.topcoder-dev.com:4431',
}

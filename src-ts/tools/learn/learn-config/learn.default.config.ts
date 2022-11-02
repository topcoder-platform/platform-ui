import { LearnConfigModel } from './learn-config.model'

export const LearnConfigDefault: LearnConfigModel = {
    API: 'http://localhost:3001/v5/learning-paths',
    CERT_ALT_PARAMS: {
        'view-style': 'large-container',
    },
    CERT_DOMAIN: 'https://certificate.topcoder-dev.com',
    CERT_ELEMENT_SELECTOR: {
        attribute: 'data-id',
        value: 'certificate-container',
    },
    CLIENT: 'https://fcc.topcoder-dev.com:4431',
}

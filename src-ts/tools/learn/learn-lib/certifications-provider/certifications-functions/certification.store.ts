import { xhrGetAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'

import { LearnCertification } from './learn-certification.model'

export function getCertificationsAsync(providerName: string = 'freeCodeCamp'): Promise<Array<LearnCertification>> {
    return xhrGetAsync<Array<LearnCertification>>(getPath(
        'certifications',
        `?providerName=${providerName}`
    ))
}

import { xhrGetAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'

import { LearnCertification } from './learn-certification.model'

export function getAsync(
    providerName: string = 'freeCodeCamp',
    certificationId?: string
): Promise<Array<LearnCertification>> {
    return xhrGetAsync<Array<LearnCertification>>(getPath(
        'certifications',
        ...(certificationId ? [certificationId] : []),
        `?providerName=${providerName}`
    ))
}

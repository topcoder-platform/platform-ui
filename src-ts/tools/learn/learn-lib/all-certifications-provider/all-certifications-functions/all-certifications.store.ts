import { xhrGetAsync } from '../../../../../lib/functions'
import { learnUrlGet } from '../../functions'

import { LearnCertification } from './learn-certification.model'

export function getAsync(
    providerName: string = 'freeCodeCamp',
    certificationId?: string
): Promise<Array<LearnCertification>> {

    const url: string = learnUrlGet(
        'certifications',
        ...(certificationId ? [certificationId] : []),
        `?providerName=${providerName}`
    )
    return xhrGetAsync<Array<LearnCertification>>(url)
}

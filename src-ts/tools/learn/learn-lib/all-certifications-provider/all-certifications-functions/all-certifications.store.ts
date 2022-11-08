import { learnUrlGet, learnXhrGetAsync } from '../../functions'

import { LearnCertification } from './learn-certification.model'

export function getAsync(
    providerName: string = 'freeCodeCamp',
    certificationId?: string,
): Promise<Array<LearnCertification>> {

    const url: string = learnUrlGet(
        'certifications',
        ...(certificationId ? [certificationId] : []),
        `?providerName=${providerName}`,
    )
    return learnXhrGetAsync<Array<LearnCertification>>(url)
}

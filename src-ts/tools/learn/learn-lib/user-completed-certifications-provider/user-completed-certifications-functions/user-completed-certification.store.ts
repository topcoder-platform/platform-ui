import { xhrGetAsync } from '../../../../../lib/functions'
import { learnUrlGet } from '../../functions'

import { LearnUserCompletedCertification } from './user-completed-certification.model'

export function getAsync(userId: number): Promise<Array<LearnUserCompletedCertification>> {

    const url: string = learnUrlGet('completed-certifications', `${userId}`)
    return xhrGetAsync<Array<LearnUserCompletedCertification>>(url)
}

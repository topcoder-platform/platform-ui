import { learnUrlGet, learnXhrGetAsync } from '../../functions'

import { LearnUserCompletedCertification } from './user-completed-certification.model'

export function getAsync(userId: number): Promise<Array<LearnUserCompletedCertification>> {

    const url: string = learnUrlGet('completed-certifications', `${userId}`)
    return learnXhrGetAsync<Array<LearnUserCompletedCertification>>(url)
}

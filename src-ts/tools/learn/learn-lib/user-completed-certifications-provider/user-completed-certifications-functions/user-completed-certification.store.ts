import { xhrGetAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'

import { LearnUserCompletedCertification } from './user-completed-certification.model'

export function getAsync(userId: number): Promise<Array<LearnUserCompletedCertification>> {
    return xhrGetAsync<Array<LearnUserCompletedCertification>>(getPath(
        'completed-certifications',
        `${userId}`,
    ))
}

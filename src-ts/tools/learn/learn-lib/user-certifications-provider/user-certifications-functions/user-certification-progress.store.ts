import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '../../../../../lib/functions'
import { learnUrlGet } from '../../functions'

import { LearnUserCertificationProgress } from './learn-user-certification-progress.model'
import { UserCertificationUpdateProgressActions } from './user-certification-update-progress-actions.enum'

const certProgressPath: string = 'certification-progresses'

export function getAsync(userId: number, provider?: string, certification?: string): Promise<Array<LearnUserCertificationProgress>> {

    const params: string = [
        `?userId=${userId}`,
        provider && `provider=${provider}`,
        certification && `certification=${certification}`,
    ]
        .filter(Boolean)
        .join('&')

    const url: string = learnUrlGet(certProgressPath, params)

    return xhrGetAsync<Array<LearnUserCertificationProgress>>(url)
}

export function startAsync(userId: number, certificationId: string, courseId: string, data: any): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, `${userId}`, certificationId, courseId)
    return xhrPostAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

export function updateAsync(
    certificationProgressId: string,
    action: UserCertificationUpdateProgressActions,
    data: any
): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, certificationProgressId, action)

    return xhrPutAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

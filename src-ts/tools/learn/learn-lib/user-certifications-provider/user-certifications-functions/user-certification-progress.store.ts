import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'

import { LearnUserCertificationProgress } from './learn-user-certification-progress.model'
import { UserCertificationUpdateProgressActions } from './user-certification-update-progress-actions.enum'

export function getAsync(userId: number, provider?: string, certification?: string): Promise<Array<LearnUserCertificationProgress>> {
    return xhrGetAsync<Array<LearnUserCertificationProgress>>(getPath(
        'certification-progresses',
        [
            `?userId=${userId}`,
            provider && `provider=${provider}`,
            certification && `certification=${certification}`,
        ].filter(Boolean).join('&'),
    )).then(d => d.map(r => ({
        ...r,
        status: 'completed',
        courseProgressPercentage: 100,
        completedDate: '2022-07-24'
    } as any)))
}

export function startAsync(userId: number, certificationId: string, courseId: string, data: any): Promise<LearnUserCertificationProgress> {
    return xhrPostAsync<{}, LearnUserCertificationProgress>(getPath(
        'certification-progresses',
        `${userId}`,
        certificationId,
        courseId,
    ), data)
}

export function updateAsync(certificationProgressId: string, action: UserCertificationUpdateProgressActions, data: any): Promise<LearnUserCertificationProgress> {
    return xhrPutAsync<{}, LearnUserCertificationProgress>(getPath(
        'certification-progresses',
        certificationProgressId,
        action
    ), data)
}

import { xhrGetAsync, xhrPostAsync, xhrPutAsync } from '../../../../../lib/functions'
import { getPath } from '../../learn-url.config'

import { LearnMyCertificationProgress } from './learn-my-certification-progress.model'
import { UpdateMyCertificateProgressActions } from './my-certifications-update-progress-actions.enum'

export function getProgressAsync(userId: number, provider?: string, certification?: string): Promise<Array<LearnMyCertificationProgress>> {
    return xhrGetAsync<Array<LearnMyCertificationProgress>>(getPath(
        'certification-progresses',
        [
            `?userId=${userId}`,
            provider && `provider=${provider}`,
            certification && `certification=${certification}`,
        ].filter(Boolean).join('&'),
    ))
}

export function startProgressAsync(userId: number, certificationId: string, courseId: string, data: any): Promise<LearnMyCertificationProgress> {
    return xhrPostAsync<{}, LearnMyCertificationProgress>(getPath(
        'certification-progresses',
        `${userId}`,
        certificationId,
        courseId,
    ), data)
}

export function updateProgressAsync(certificationProgressId: string, action: UpdateMyCertificateProgressActions, data: any): Promise<LearnMyCertificationProgress> {
    return xhrPutAsync<{}, LearnMyCertificationProgress>(getPath(
        'certification-progresses',
        certificationProgressId,
        action
    ), data)
}

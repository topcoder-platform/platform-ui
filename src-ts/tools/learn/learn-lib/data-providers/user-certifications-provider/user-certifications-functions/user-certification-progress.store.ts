import { LearnConfig } from '../../../../learn-config'
import { getUserCertificateUrl } from '../../../../learn.routes'
import { learnUrlGet, learnXhrPostAsync, learnXhrPutAsync } from '../../../functions'

import { LearnUserCertificationProgress } from './learn-user-certification-progress.model'
import { UserCertificationUpdateProgressActions } from './user-certification-update-progress-actions.enum'

const certProgressPath: string = 'certification-progresses'

export function completeCourse(
    certificationProgressId: string,
    certification: string,
    handle: string,
    provider: string,
): Promise<LearnUserCertificationProgress> {

    // construct the certificate params
    const certificateAlternateParams: { [key: string]: string } = LearnConfig.CERT_ALT_PARAMS
    const certificateElement: string = `[${LearnConfig.CERT_ELEMENT_SELECTOR.attribute}=${LearnConfig.CERT_ELEMENT_SELECTOR.value}]`
    const certificateUrl: string = getUserCertificateUrl(provider, certification, handle)

    return updateAsync(
        certificationProgressId,
        UserCertificationUpdateProgressActions.completeCertificate,
        {
            certificateAlternateParams,
            certificateElement,
            certificateUrl,
        },
    )
}

export function startAsync(userId: number, certificationId: string, courseId: string, data: any): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, `${userId}`, certificationId, courseId)
    return learnXhrPostAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

export function updateAsync(
    certificationProgressId: string,
    action: UserCertificationUpdateProgressActions,
    data: any,
): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, certificationProgressId, action)

    return learnXhrPutAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

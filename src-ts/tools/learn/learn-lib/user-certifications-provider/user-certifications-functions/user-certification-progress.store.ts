import { logInfo } from '../../../../../lib'
import { LearnConfig } from '../../../learn-config'
import { getUserCertificateUrl } from '../../../learn.routes'
import { learnUrlGet, learnXhrGetAsync, learnXhrPostAsync, learnXhrPutAsync } from '../../functions'

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
    const certificateElement: string = `[${LearnConfig.CERT_ELEMENT_SELECTOR.attribute}=${LearnConfig.CERT_ELEMENT_SELECTOR.value}]`
    const certificateUrl: string = getUserCertificateUrl(provider, certification, handle)

    logInfo(`Completing course w certificate URL = ${certificateUrl}`)

    return updateAsync(
        certificationProgressId,
        UserCertificationUpdateProgressActions.completeCertificate,
        {
            certificateElement,
            certificateUrl,
        }
    )
}

export function getAsync(userId: number, provider?: string, certification?: string): Promise<Array<LearnUserCertificationProgress>> {

    const params: string = [
        `?userId=${userId}`,
        provider && `provider=${provider}`,
        certification && `certification=${certification}`,
    ]
        .filter(Boolean)
        .join('&')

    const url: string = learnUrlGet(certProgressPath, params)

    return learnXhrGetAsync<Array<LearnUserCertificationProgress>>(url)
}

export function startAsync(userId: number, certificationId: string, courseId: string, data: any): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, `${userId}`, certificationId, courseId)
    return learnXhrPostAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

export function updateAsync(
    certificationProgressId: string,
    action: UserCertificationUpdateProgressActions,
    data: any
): Promise<LearnUserCertificationProgress> {

    const url: string = learnUrlGet(certProgressPath, certificationProgressId, action)

    return learnXhrPutAsync<{}, LearnUserCertificationProgress>(url, {}, { params: data })
}

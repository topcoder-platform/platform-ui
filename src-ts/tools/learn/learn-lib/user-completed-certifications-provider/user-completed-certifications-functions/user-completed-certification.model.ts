import { LearnCertificateTrackType } from '../../all-certifications-provider'
import { UserCertificationProgressStatus } from '../../user-certifications-provider'

export interface LearnUserCompletedCertification {
    certification: string,
    certificationId: string,
    certificationTitle: string,
    certificationTrackType: LearnCertificateTrackType,
    certType: 'certification'|'course-completion',
    completedDate: string,
    provider: string,
    providerUrl: string
    status: UserCertificationProgressStatus,
}

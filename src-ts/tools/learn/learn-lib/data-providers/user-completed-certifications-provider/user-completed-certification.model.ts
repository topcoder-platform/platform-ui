import { LearnCertificateTrackType } from '../all-certifications-provider'
import { LearnModelBase } from '../../functions'
import { UserCertificationProgressStatus } from '../user-certifications-provider'

export interface LearnUserCompletedCertification extends LearnModelBase {
    certification: string,
    certificationId: string,
    certificationTitle: string,
    certificationTrackType: LearnCertificateTrackType,
    certType: 'certification' | 'course-completion',
    completedDate: string,
    provider: string,
    providerUrl: string
    status: UserCertificationProgressStatus,
}

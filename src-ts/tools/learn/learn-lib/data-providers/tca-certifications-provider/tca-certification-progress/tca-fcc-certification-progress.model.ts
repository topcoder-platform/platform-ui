import { LearnCertificateTrackType } from '../../all-certifications-provider'
import { LearnUserCertificationProgress } from '../../user-certifications-provider'

export interface TCAFccCertificationProgress extends LearnUserCertificationProgress {
    certificationTitle: string
    certificationTrackType: LearnCertificateTrackType
    fccCertificationId: string
    certType: 'certification'
}

import { LearnModelBase } from '../../../functions'
import { LearnCertificateTrackType, LearnCertification } from '../../all-certifications-provider'
import { ResourceProvider } from '../../resource-provider-provider'

import { LearnModuleProgress } from './learn-module-progress.model'
import { UserCertificationProgressStatus } from './user-certification-progress-status.enum'

export interface LearnUserCertificationProgress extends LearnModelBase {
    academicHonestyPolicyAcceptedAt?: number,
    certProgressDynamoUuid: string
    certification: string
    certificationId: string
    certificationProgressPercentage: number
    certificationImageUrl: string
    certificationTrackType: LearnCertificateTrackType
    certificationTitle: string
    certType: 'certification'
    completedDate?: string
    courseId: string
    courseKey: string
    courseProgressPercentage: number
    currentLesson?: string
    id: string
    fccCertificationId: string
    fccCourseId: string
    freeCodeCampCertification: LearnCertification
    moduleProgresses: Array<LearnModuleProgress>
    resourceProvider: ResourceProvider
    startDate: string
    status: UserCertificationProgressStatus
    userId: string
}

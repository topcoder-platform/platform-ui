import { LearnModelBase } from '../../../functions'
import { UserCertificationProgressStatus } from '../../user-certifications-provider'
import { TCACertification } from '../tca-certification.model'

import { TCAFccCertificationProgress } from './tca-fcc-certification-progress.model'

export enum TCACertificationProgressStatus {
    enrolled = 'enrolled',
    completed = 'completed',
}

export interface TCACertificationProgress extends LearnModelBase {
    id: number
    completionUuid: string
    coursesCount: number
    topcoderCertification: TCACertification
    topcoderCertificationId: number
    status: TCACertificationProgressStatus
    completedAt: null | Date
    certificationProgress: number
    resourceProgresses: [{
        resourceProgressId: string
        resourceProgressType: 'FccCertificationProgress'
        fccCertificationProgress: TCAFccCertificationProgress
        status: UserCertificationProgressStatus,
    }]
    userHandle: string
    userId: number
    userName: string
}

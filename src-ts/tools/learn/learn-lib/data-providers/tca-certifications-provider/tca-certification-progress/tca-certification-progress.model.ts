import { LearnModelBase } from '../../../functions'
import { TCACertification } from '../tca-certification.model'

import { TCAFccCertificationProgress } from './tca-fcc-certification-progress.model'

export type TCACertificationProgressStatus = 'enrolled' | 'completed'

export interface TCACertificationProgress extends LearnModelBase {
    id: number
    completionUuid: string
    coursesCount: number
    topcoderCertification: TCACertification
    status: TCACertificationProgressStatus
    completedAt: null | Date
    certificationProgress: number
    resourceProgresses: [{
        fccCertificationProgress: TCAFccCertificationProgress
    }]
    userHandle: string
    userId: number
    userName: string
}

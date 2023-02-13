import { TCACertification } from '../tca-certification.model'

import { TCAFccCertificationProgress } from './tca-fcc-certification-progress.model'

export interface TCACertificationProgress {
    id: number
    topcoderCertification: TCACertification
    topcoderCertificationId: number
    status: 'enrolled'
    completedAt: null | Date
    createdAt: Date
    updatedAt: Date
    certificationProgress: 0
    resourceProgresses: [{
        fccCertificationProgress: TCAFccCertificationProgress
    }]
}

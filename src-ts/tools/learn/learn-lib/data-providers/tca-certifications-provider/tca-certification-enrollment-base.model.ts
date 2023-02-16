import { TCACertification } from './tca-certification.model'

export interface TCACertificationEnrollmentBase {
    id: number
    topcoderCertificationId: number
    topcoderCertification?: TCACertification
    userId: string
    userHandle: string
    userName: string
    status: 'enrolled'
    completedAt: null | Date
    completionUuid: undefined | null | string
    createdAt: Date
    updatedAt: Date
}

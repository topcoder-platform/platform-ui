import { TCACertificationLearnLevel } from './tca-certificate-level-type'
import { TCACertificationResourceable } from './tca-certification-resourceable.type'

export interface TCACertificationResource {
    id: number
    topcoderCertificationId: number
    resourceProviderId: number
    resourceableId: number
    resourceableType: TCACertificationResourceable
    displayOrder: number
    completionOrder: number
    resourceDescription: string
    resourceTitle: string
    createdAt: Date
    updatedAt: Date
    freeCodeCampCertification: {
        fccId: string
        learnerLevel: TCACertificationLearnLevel
    }
}

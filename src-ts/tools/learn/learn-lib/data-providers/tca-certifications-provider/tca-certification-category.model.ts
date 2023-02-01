import { TCACertificateType } from './tca-certificate-type'

export interface TCACertificationCategory {
    id: number
    category: string
    track: TCACertificateType
    createdAt: Date
    updatedAt: Date
}

import { TcaCertificateType } from './tca-certificate-type'

export interface TCACertificationCategory {
    id: number
    category: string
    track: TcaCertificateType
    createdAt: Date
    updatedAt: Date
}

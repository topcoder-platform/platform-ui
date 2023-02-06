import { TCACertification } from '../tca-certification.model'

export interface TCACertificationProviderData {
    certification: TCACertification
    error: boolean
    loading: boolean
    ready: boolean
}

import { TCACertification } from '../tca-certification.model'

export interface TCACertificationsProviderData {
    certifications: Array<TCACertification>
    error: boolean
    loading: boolean
    ready: boolean
}

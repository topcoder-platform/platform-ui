import { TCACertificationProviderBase } from './tca-certification-provider.model-base'
import { TCACertificationResource } from './tca-certification-resource.model'

export interface TCACertificationProvider extends TCACertificationProviderBase {
    attributionStatement: string
    CertificationResource: TCACertificationResource
}

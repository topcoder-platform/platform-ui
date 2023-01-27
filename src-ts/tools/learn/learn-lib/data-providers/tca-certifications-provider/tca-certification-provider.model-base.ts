import { TCAProviderType } from './tca-provider-type'

export interface TCACertificationProviderBase {
    id: number
    name: TCAProviderType
    description: string
    url: string
}

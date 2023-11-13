import { KeyedMutator } from 'swr'

import { TCACertification } from '../tca-certification.model'

export interface TCACertificationProviderData {
    certification?: TCACertification
    error: boolean
    loading: boolean
    mutate: KeyedMutator<any>
    ready: boolean
}

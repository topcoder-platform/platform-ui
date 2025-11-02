import { BackendPrize } from './BackendPrize.model'

export interface BackendPrizeSet {
    type: string
    description?: string
    prizes: BackendPrize[]
}

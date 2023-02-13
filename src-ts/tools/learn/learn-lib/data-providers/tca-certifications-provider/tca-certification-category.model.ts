import { LearnModelBase } from '../../functions'

import { TCACertificateType } from './tca-certificate-type'

export interface TCACertificationCategory extends LearnModelBase {
    id: number
    category: string
    track: TCACertificateType
}

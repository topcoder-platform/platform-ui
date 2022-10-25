import { LearnModelBase } from '../../../functions'

export interface ResourceProvider extends LearnModelBase {
    attributionStatement: string
    id: string
    name: string
    url: string
}

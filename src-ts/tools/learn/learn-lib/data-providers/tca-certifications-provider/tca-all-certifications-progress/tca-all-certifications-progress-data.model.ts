import { TCACertificationProgress } from '../tca-certification-progress'

export interface TCACertificationsProgressProviderData {
    progresses: TCACertificationProgress[]
    error: boolean
    loading: boolean
    ready: boolean
}

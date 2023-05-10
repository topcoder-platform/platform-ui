import { TCACertificationProgress } from './tca-certification-progress.model'

export interface TCACertificationProgressProviderData {
    progress: TCACertificationProgress | undefined
    error: boolean
    loading: boolean
    ready: boolean
    refetch: () => void,
    setCertificateProgress: (progess: TCACertificationProgress) => void,
}

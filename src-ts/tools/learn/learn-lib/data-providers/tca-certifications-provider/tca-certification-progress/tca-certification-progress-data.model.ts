import { TCACertificationEnrollmentBase } from '../tca-certification-enrollment-base.model'

import { TCACertificationProgress } from './tca-certification-progress.model'

export interface TCACertificationProgressProviderData {
    progress: TCACertificationProgress | undefined
    error: boolean
    loading: boolean
    ready: boolean
    refetch: () => void,
    setCertificateProgress: (progess: TCACertificationProgress) => void,
}

export interface TCACertificationEnrollmentProviderData {
    enrollment: TCACertificationEnrollmentBase | TCACertificationProgress | undefined
    error: boolean
    loading: boolean
    ready: boolean
}

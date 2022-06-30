import { LearnMyCertificationProgress } from './learn-my-certification-progress.model'

export interface MyCertificationProgressProviderData {
    loading: boolean
    progress?: LearnMyCertificationProgress
    ready: boolean
}

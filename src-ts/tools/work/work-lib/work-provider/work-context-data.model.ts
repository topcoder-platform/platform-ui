import { Challenge, Work, WorkPricesType, WorkStatus } from './work-functions'

export interface WorkContextData {
    createFromChallenge: (challenge: Challenge, workPrices: WorkPricesType) => Work
    deleteWorkAsync: (id: string) => Promise<void>
    error?: string
    getStatusFromChallenge: (challenge: Challenge) => WorkStatus
    hasWork: boolean
    initialized: boolean
    work: Array<Work>
}

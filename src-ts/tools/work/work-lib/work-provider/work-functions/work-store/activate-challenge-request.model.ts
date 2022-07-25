import { ChallengeStatus } from './challenge-status.enum'

export interface ActivateChallengeRequest {
    discussions: Array<{ [key: string]: string }>
    id: string
    startDate: string
    status: ChallengeStatus.draft
}

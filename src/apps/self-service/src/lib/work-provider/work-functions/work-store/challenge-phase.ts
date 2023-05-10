import { ChallengePhaseName } from './challenge-phase-name.enum'

export interface ChallengePhase {
    actualEndDate: string
    actualStartDate: string
    isOpen: boolean
    name: ChallengePhaseName
    scheduledEndDate: string
    scheduledStartDate: string
}

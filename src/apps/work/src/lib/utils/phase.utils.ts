import {
    Challenge,
    ChallengePhase,
} from '../models'

export type PhaseLike = Pick<ChallengePhase, 'actualEndDate' | 'isOpen' | 'name'>

export function canChangeDuration(phase?: PhaseLike | null): boolean {
    if (!phase) {
        return false
    }

    if (phase.isOpen) {
        return true
    }

    return !phase.actualEndDate
}

export function getCurrentPhase(challenge?: Pick<Challenge, 'phases'>): string {
    const openPhases = (challenge?.phases || [])
        .filter(phase => phase.isOpen)
        .map(phase => phase.name)
        .filter(Boolean)

    return openPhases.length
        ? openPhases.join(' / ')
        : '-'
}

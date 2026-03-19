import {
    PHASE_DURATION_MAX_HOURS,
    PHASE_DURATION_MIN_MINUTES,
} from '../../../../../lib/constants/challenge-editor.constants'
import { ChallengePhase } from '../../../../../lib/models'
import { getPhaseEndDateInDate } from '../../../../../lib/utils/date.utils'

export interface RecalculatePhasesResult {
    phases: ChallengePhase[]
    error?: string
}

export interface RecalculatePhasesOptions {
    phaseStartOverrides?: ReadonlyMap<string, string>
    resetRootPhasesToStartDate?: boolean
}

export function toDate(value?: Date | string | null): Date | undefined {
    if (!value) {
        return undefined
    }

    const parsedDate = value instanceof Date
        ? value
        : new Date(value)

    if (Number.isNaN(parsedDate.getTime())) {
        return undefined
    }

    return parsedDate
}

export function normalizeDuration(duration: unknown): number {
    const parsedDuration = Number(duration)
    const maxDuration = PHASE_DURATION_MAX_HOURS * 60

    if (!Number.isFinite(parsedDuration)) {
        return PHASE_DURATION_MIN_MINUTES
    }

    return Math.max(
        PHASE_DURATION_MIN_MINUTES,
        Math.min(maxDuration, Math.trunc(parsedDuration)),
    )
}

export function normalizePhaseName(value: unknown): string {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
}

function isIterativeReviewPhase(phaseName: unknown): boolean {
    return normalizePhaseName(phaseName) === 'iterative review'
}

/**
 * Builds a stable key for phase-local UI state in the schedule editor.
 *
 * @param phase phase currently rendered.
 * @param index fallback index when ids are unavailable.
 * @returns stable string key for phase-level editor state.
 */
export function getPhaseKey(
    phase: ChallengePhase,
    index: number,
): string {
    return phase.id || phase.phaseId || `${index}`
}

export function canEditPhaseStartDate(
    phase: ChallengePhase,
    index: number,
    isTwoRoundDesignChallenge: boolean,
): boolean {
    const normalizedPhaseName = normalizePhaseName(phase.name)
    const isRegistrationPhase = normalizedPhaseName === 'registration'
    const isStandardSubmissionPhase = normalizedPhaseName === 'submission'
    const isTopgearSubmissionPhase = normalizedPhaseName === 'topgear submission'
    const isTopcoderSubmissionPhase = normalizedPhaseName === 'topcoder submission'
    const isSubmissionPhaseByName = isStandardSubmissionPhase
        || isTopgearSubmissionPhase
        || isTopcoderSubmissionPhase
    const isCheckpointSubmissionPhase = normalizedPhaseName === 'checkpoint submission'

    return index <= 0
        || isRegistrationPhase
        || isCheckpointSubmissionPhase
        || (isSubmissionPhaseByName && !isTwoRoundDesignChallenge)
}

// eslint-disable-next-line complexity
export function recalculatePhases(
    phases: ChallengePhase[],
    startDateValue?: Date | string,
    options: RecalculatePhasesOptions = {},
): RecalculatePhasesResult {
    if (!phases.length) {
        return {
            phases: [],
        }
    }

    const calculatedPhases: ChallengePhase[] = []
    const calculatedByPhaseId = new Map<string, ChallengePhase>()

    const baseStartDate = toDate(startDateValue)
    const shouldScheduleDates = options.resetRootPhasesToStartDate === true && !!baseStartDate
    let calculationError: string | undefined

    // eslint-disable-next-line complexity
    for (let index = 0; index < phases.length; index += 1) {
        const phase = phases[index]
        const duration = normalizeDuration(phase.duration)
        const existingPhaseStartDate = toDate(phase.scheduledStartDate)
        let phaseStartDate = shouldScheduleDates || index === 0
            ? baseStartDate
            : existingPhaseStartDate || baseStartDate

        if (phase.predecessor) {
            const predecessorPhase = calculatedByPhaseId.get(phase.predecessor)
            const predecessorStartDate = toDate(predecessorPhase?.scheduledStartDate)
            const predecessorEndDate = toDate(predecessorPhase?.scheduledEndDate)

            if (predecessorEndDate) {
                phaseStartDate = isIterativeReviewPhase(phase.name)
                    ? predecessorStartDate || predecessorEndDate
                    : predecessorEndDate
            } else if (shouldScheduleDates && !calculationError) {
                const phaseName = phase.name || phase.phaseId || `${index + 1}`
                calculationError = `Invalid predecessor configured for phase ${phaseName}.`
            }
        }

        const overriddenStartDate = toDate(options.phaseStartOverrides?.get(getPhaseKey(phase, index)))
        if (overriddenStartDate) {
            phaseStartDate = overriddenStartDate
        }

        const phaseEndDate = phaseStartDate
            ? getPhaseEndDateInDate(phaseStartDate, duration)
            : undefined

        const nextPhase: ChallengePhase = {
            ...phase,
            duration,
            scheduledEndDate: phaseEndDate?.toISOString(),
            scheduledStartDate: phaseStartDate?.toISOString(),
        }

        calculatedPhases.push(nextPhase)

        if (nextPhase.phaseId) {
            calculatedByPhaseId.set(nextPhase.phaseId, nextPhase)
        }
    }

    return {
        error: calculationError,
        phases: calculatedPhases,
    }
}

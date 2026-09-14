import {
    ChallengeCatalogValue,
    ChallengeOpportunity,
    ChallengePhase,
    ChallengePrize,
} from '../models'

const MILLISECONDS_PER_MINUTE = 60 * 1000
const MILLISECONDS_PER_HOUR = 60 * MILLISECONDS_PER_MINUTE
const MILLISECONDS_PER_DAY = 24 * MILLISECONDS_PER_HOUR

/** Canonical Challenge API copy for leaderboard-scored fun challenges. */
export const FUN_CHALLENGE_PRIZE_LABEL = 'No individual prize - leaderboard scoring'

/** Placement prize enriched with its source-order finishing position. */
export interface ChallengePlacementPrize extends ChallengePrize {
    placement: number
    value: number
}

/** Safe timing values used to present the current challenge phase. */
export interface ChallengePhaseTiming {
    endDate?: string
    progressPercent: number
    remainingMilliseconds?: number
    startDate?: string
}

/**
 * Trims an unknown API value when it is a non-empty string.
 *
 * @param value value read from a Challenge API response.
 * @returns trimmed text, or undefined for non-strings and empty strings.
 * @throws Does not throw.
 */
function trimmedString(value: unknown): string | undefined {
    if (typeof value !== 'string') return undefined
    return value.trim() || undefined
}

/**
 * Resolves a member-facing name from current catalog objects and legacy strings.
 *
 * @param value Challenge API catalog object or legacy string value.
 * @param fallback text returned when the catalog value has no usable label.
 * @returns trimmed catalog name, catalog track label, or the supplied fallback.
 * @throws Does not throw.
 */
export function challengeCatalogName(value: ChallengeCatalogValue | undefined, fallback: string = ''): string {
    if (typeof value === 'string') return trimmedString(value) ?? trimmedString(fallback) ?? ''
    return trimmedString(value?.name) ?? trimmedString(value?.track) ?? trimmedString(fallback) ?? ''
}

/**
 * Produces a stable lookup key for catalog enums, display names, and legacy strings.
 *
 * Catalog enum values such as `DATA_SCIENCE` are preferred over their display name
 * when both are present. Separator and case differences are removed, so
 * `First2Finish` and `First 2 Finish` share the key `first2finish`.
 *
 * @param value Challenge API catalog object or legacy string value.
 * @returns lowercase alphanumeric key, or an empty string when no value exists.
 * @throws Does not throw.
 */
export function challengeCatalogKey(value: ChallengeCatalogValue | undefined): string {
    const source = typeof value === 'string'
        ? trimmedString(value)
        : trimmedString(value?.track) ?? trimmedString(value?.name)
    return source?.toLowerCase()
        .replace(/[^a-z0-9]+/g, '') ?? ''
}

/**
 * Checks whether a phase represents an open registration window.
 *
 * @param phase phase returned by Challenge API.
 * @returns true only for an open Registration or legacy combined Open phase.
 * @throws Does not throw.
 */
function phaseRegistrationIsOpen(phase: ChallengePhase): boolean {
    const phaseKey = challengeCatalogKey(phase.name)
    return phase.isOpen === true && (phaseKey === 'registration' || phaseKey === 'open')
}

/**
 * Determines whether a challenge is currently accepting registrations.
 *
 * Lifecycle status alone is insufficient: the challenge must be ACTIVE and its
 * Registration phase (or legacy combined Open phase) must be open. Explicit phase
 * records take precedence; `currentPhaseNames` supports compact API responses.
 *
 * @param challenge challenge returned by Challenge API.
 * @returns true only while an ACTIVE challenge has an open registration window.
 * @throws Does not throw.
 */
export function challengeRegistrationIsOpen(challenge: ChallengeOpportunity): boolean {
    if (challengeCatalogKey(challenge.status) !== 'active') return false

    const registrationPhases = (challenge.phases ?? [])
        .filter(phase => {
            const phaseKey = challengeCatalogKey(phase.name)
            return phaseKey === 'registration' || phaseKey === 'open'
        })
    if (registrationPhases.length) return registrationPhases.some(phaseRegistrationIsOpen)

    return (challenge.currentPhaseNames ?? [])
        .some(name => {
            const phaseKey = challengeCatalogKey(name)
            return phaseKey === 'registration' || phaseKey === 'open'
        })
}

/**
 * Determines whether a challenge currently accepts a solution submission.
 *
 * Registration and submission can overlap, so every open phase and every
 * `currentPhaseNames` value is inspected rather than relying on the single
 * API-computed `currentPhase`. The legacy combined `Open` phase is treated as
 * both registration and submission.
 *
 * @param challenge challenge returned by Challenge API.
 * @returns true only for an ACTIVE challenge with an open submission phase.
 * @throws Does not throw.
 */
export function challengeSubmissionIsOpen(challenge: ChallengeOpportunity): boolean {
    if (challengeCatalogKey(challenge.status) !== 'active') return false

    /**
     * Identifies canonical submission phases, including Final Fix and the legacy combined Open phase.
     *
     * @param name Challenge API phase name.
     * @returns true when registration grants access to a currently open submission surface.
     * @throws Does not throw.
     */
    const phaseIsSubmission = (name: string): boolean => {
        const key = challengeCatalogKey(name)
        return key === 'open' || key.includes('submission') || key === 'finalfix'
    }

    if ((challenge.phases ?? []).some(phase => phase.isOpen === true && phaseIsSubmission(phase.name))) {
        return true
    }

    return (challenge.currentPhaseNames ?? []).some(phaseIsSubmission)
}

/**
 * Extracts only cash placement prizes from a challenge response.
 *
 * Prize order defines finishing placement in Challenge API. Invalid values are
 * omitted without renumbering later prizes, and checkpoint or other prize sets are
 * never used as a fallback.
 *
 * @param challenge challenge returned by Challenge API.
 * @returns valid nonnegative placement prizes in their source order.
 * @throws Does not throw.
 */
export function challengePlacementPrizes(challenge: ChallengeOpportunity): ChallengePlacementPrize[] {
    const placementSet = (challenge.prizeSets ?? [])
        .find(prizeSet => challengeCatalogKey(prizeSet.type) === 'placement')

    return (placementSet?.prizes ?? [])
        .flatMap((prize, index) => {
            if (typeof prize.value !== 'number' || !Number.isFinite(prize.value) || prize.value < 0) return []
            return [{ ...prize, placement: index + 1, value: prize.value }]
        })
}

/**
 * Resolves the challenge's aggregate placement-prize value.
 *
 * The canonical Challenge API overview wins, with a PLACEMENT-only sum used for
 * responses that omit it. Legacy top-level totals and non-placement sets are not
 * included.
 *
 * @param challenge challenge returned by Challenge API.
 * @returns finite nonnegative total, or undefined when no total can be determined.
 * @throws Does not throw.
 */
export function challengeTotalPrize(challenge: ChallengeOpportunity): number | undefined {
    const overviewTotal = challenge.overview && typeof challenge.overview === 'object'
        ? challenge.overview.totalPrizes
        : undefined
    if (typeof overviewTotal === 'number' && Number.isFinite(overviewTotal) && overviewTotal >= 0) {
        return overviewTotal
    }

    const placementPrizes = challengePlacementPrizes(challenge)
    if (!placementPrizes.length) return undefined
    return placementPrizes.reduce((total, prize) => total + prize.value, 0)
}

/**
 * Parses a supported date or clock value without allowing invalid timestamps through.
 *
 * @param value ISO date, Date instance, numeric epoch, or undefined.
 * @returns finite epoch milliseconds, or undefined for an invalid/missing value.
 * @throws Does not throw.
 */
function safeTimestamp(value: unknown): number | undefined {
    if (typeof value !== 'string' && typeof value !== 'number' && !(value instanceof Date)) return undefined
    const timestamp = value instanceof Date ? value.getTime() : new Date(value)
        .getTime()
    return Number.isFinite(timestamp) ? timestamp : undefined
}

/**
 * Resolves a phase's effective start timestamp using actual then scheduled data.
 *
 * @param phase Challenge API phase.
 * @returns effective start timestamp, or undefined when neither date is valid.
 * @throws Does not throw.
 */
function phaseStartTimestamp(phase: ChallengePhase): number | undefined {
    return safeTimestamp(phase.actualStartDate) ?? safeTimestamp(phase.scheduledStartDate)
}

/**
 * Selects the current open challenge phase.
 *
 * Challenge API's computed `currentPhase` is preferred unless it is explicitly
 * closed. Legacy responses are derived by selecting the open phase with the latest
 * valid actual-or-scheduled start date while retaining source order for ties.
 *
 * @param challenge challenge returned by Challenge API.
 * @returns current open phase, or undefined when no phase is open.
 * @throws Does not throw.
 */
export function challengeCurrentPhase(challenge: ChallengeOpportunity): ChallengePhase | undefined {
    if (challenge.currentPhase && challenge.currentPhase.isOpen !== false) return challenge.currentPhase

    const openPhases = (challenge.phases ?? [])
        .filter(phase => phase.isOpen === true)
    if (!openPhases.length) return undefined

    return openPhases.slice(1)
        .reduce((selected, candidate) => {
            const selectedStart = phaseStartTimestamp(selected)
            const candidateStart = phaseStartTimestamp(candidate)
            if (candidateStart !== undefined && (selectedStart === undefined || candidateStart > selectedStart)) {
                return candidate
            }

            return selected
        }, openPhases[0])
}

/**
 * Returns the first valid date string and timestamp in priority order.
 *
 * @param values ISO date strings ordered from most to least authoritative.
 * @returns resolved source date and epoch milliseconds, or undefined when invalid.
 * @throws Does not throw.
 */
function firstValidDate(...values: Array<string | undefined>): { date: string; timestamp: number } | undefined {
    const date = values.find(value => safeTimestamp(value) !== undefined)
    if (!date) return undefined
    return { date, timestamp: safeTimestamp(date) as number }
}

/**
 * Calculates defensive timing values for an open challenge phase.
 *
 * Actual dates take precedence over scheduled dates. When no end date exists, the
 * duration (Challenge API seconds) is applied to the effective start. Progress is
 * clamped to 0..100 and malformed or zero-length ranges never produce NaN/Infinity.
 *
 * @param phase current Challenge API phase, or undefined when no phase is open.
 * @param now Date instance or epoch milliseconds used as the presentation clock.
 * @returns normalized phase dates, safe progress, and signed remaining milliseconds.
 * @throws Does not throw.
 */
export function challengePhaseTiming(
    phase: ChallengePhase | undefined,
    now: Date | number = Date.now(),
): ChallengePhaseTiming {
    if (!phase) return { progressPercent: 0 }

    const start = firstValidDate(phase.actualStartDate, phase.scheduledStartDate)
    let end = firstValidDate(phase.actualEndDate, phase.scheduledEndDate)
    if (!end && start && typeof phase.duration === 'number'
        && Number.isFinite(phase.duration) && phase.duration >= 0) {
        const timestamp = start.timestamp + (phase.duration * 1000)
        const validTimestamp = safeTimestamp(timestamp)
        if (validTimestamp !== undefined) {
            end = {
                date: new Date(validTimestamp)
                    .toISOString(),
                timestamp: validTimestamp,
            }
        }
    }

    const nowTimestamp = safeTimestamp(now)
    const timing: ChallengePhaseTiming = {
        endDate: end?.date,
        progressPercent: 0,
        startDate: start?.date,
    }
    if (end && nowTimestamp !== undefined) timing.remainingMilliseconds = end.timestamp - nowTimestamp
    if (!start || !end || nowTimestamp === undefined || end.timestamp <= start.timestamp) return timing

    const elapsedFraction = (nowTimestamp - start.timestamp) / (end.timestamp - start.timestamp)
    timing.progressPercent = Math.min(100, Math.max(0, elapsedFraction * 100))
    return timing
}

/**
 * Formats a challenge phase countdown for compact card presentation.
 *
 * The two largest useful units are shown (`2d 3h`, `12h 30m`, or `45m`). Positive
 * partial minutes round up so an active deadline never displays zero prematurely.
 *
 * @param timing normalized timing returned by `challengePhaseTiming`.
 * @returns countdown suffixed with `left`, `Past due`, or an empty string if unknown.
 * @throws Does not throw.
 */
export function formatChallengeTimeLeft(timing: ChallengePhaseTiming | undefined): string {
    const remaining = timing?.remainingMilliseconds
    if (typeof remaining !== 'number' || !Number.isFinite(remaining)) return ''
    if (remaining < 0) return 'Past due'

    const totalMinutes = Math.ceil(remaining / MILLISECONDS_PER_MINUTE)
    const days = Math.floor(totalMinutes / (MILLISECONDS_PER_DAY / MILLISECONDS_PER_MINUTE))
    const hours = Math.floor((totalMinutes % (MILLISECONDS_PER_DAY / MILLISECONDS_PER_MINUTE))
        / (MILLISECONDS_PER_HOUR / MILLISECONDS_PER_MINUTE))
    const minutes = totalMinutes % (MILLISECONDS_PER_HOUR / MILLISECONDS_PER_MINUTE)
    if (days > 0) return `${days}d${hours > 0 ? ` ${hours}h` : ''} left`
    if (hours > 0) return `${hours}h${minutes > 0 ? ` ${minutes}m` : ''} left`
    return `${minutes}m left`
}

/**
 * Util for challenge
 */

import type {
    BackendMetadata,
    BackendPhase,
    ChallengeInfo,
    SelectOption,
} from '../models'

/**
 * Check if challenge is in the review phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the review phase
 */
export function isReviewPhase(challengeInfo?: ChallengeInfo): boolean {
    return (challengeInfo?.currentPhase ?? '').indexOf('Review') >= 0
}

/**
 * Check if challenge is in the appeals phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals phase
 */
export function isAppealsPhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals'
}

/**
 * Check if challenge is in the appeals response phase
 * @param challengeInfo challenge info
 * @returns true if challenge is in the appeals response phase
 */
export function isAppealsResponsePhase(challengeInfo?: ChallengeInfo): boolean {
    return challengeInfo?.currentPhase === 'Appeals Response'
}

const SUBMISSION_LIMIT_KEY = 'submissionlimit'
const UNLIMITED_KEYWORDS = ['unlimited', 'false', '0', 'no', 'none']
const TRUE_KEYWORDS = ['true', 'yes', '1']

function parseBooleanFlag(value: unknown): boolean | undefined {
    if (typeof value === 'boolean') {
        return value
    }

    if (typeof value === 'number') {
        if (value === 1) return true
        if (value === 0) return false
        return undefined
    }

    if (typeof value === 'string') {
        const normalized = value.trim()
            .toLowerCase()
        if (!normalized) {
            return undefined
        }

        if (TRUE_KEYWORDS.includes(normalized)) {
            return true
        }

        if (UNLIMITED_KEYWORDS.includes(normalized)) {
            return false
        }
    }

    return undefined
}

function hasPositiveNumeric(value: unknown): boolean {
    if (value === undefined || value === null) {
        return false
    }

    const numeric = Number(value)
    return Number.isFinite(numeric) && numeric > 0
}

function findSubmissionLimitMetadata(metadata: BackendMetadata[] | undefined): unknown {
    if (!Array.isArray(metadata)) {
        return undefined
    }

    const entry = metadata.find(candidate => (candidate?.name || '').toLowerCase() === SUBMISSION_LIMIT_KEY)
    return entry?.value
}

function normalizeLimitMetadataValue(rawValue: unknown): unknown {
    if (typeof rawValue !== 'string') {
        return rawValue
    }

    const trimmed = rawValue.trim()
    if (!trimmed) {
        return ''
    }

    try {
        return JSON.parse(trimmed)
    } catch {
        return trimmed
    }
}

function evaluateStringLimit(value: string): boolean {
    console.log('evaluateStringLimit', value)
    const trimmed = value.trim()
    if (!trimmed) {
        return true
    }

    if (hasPositiveNumeric(trimmed)) {
        return true
    }

    const normalized = trimmed.toLowerCase()
    if (UNLIMITED_KEYWORDS.includes(normalized)) {
        return false
    }

    const boolFlag = parseBooleanFlag(trimmed)
    if (boolFlag !== undefined) {
        return boolFlag
    }

    return true
}

function evaluateObjectLimit(candidate: Record<string, unknown>): boolean {
    const unlimitedFlag = parseBooleanFlag(candidate.unlimited)
    if (unlimitedFlag === true) {
        return false
    }

    const numericCandidates: unknown[] = [
        candidate.count,
        candidate.max,
        candidate.maximum,
        candidate.limitCount,
        candidate.value,
    ]

    if (numericCandidates.some(candidateValue => hasPositiveNumeric(candidateValue))) {
        return true
    }

    const limitFlag = parseBooleanFlag(candidate.limit)
    if (limitFlag !== undefined) {
        return limitFlag
    }

    return true
}

export function challengeHasSubmissionLimit(challengeInfo?: ChallengeInfo): boolean {
    const rawValue = findSubmissionLimitMetadata(challengeInfo?.metadata)
    if (rawValue === undefined || rawValue === null) {
        return true
    }

    const normalized = normalizeLimitMetadataValue(rawValue)

    if (typeof normalized === 'number') {
        return hasPositiveNumeric(normalized)
    }

    if (typeof normalized === 'boolean') {
        return normalized
    }

    if (typeof normalized === 'string') {
        return evaluateStringLimit(normalized)
    }

    if (normalized && typeof normalized === 'object') {
        return evaluateObjectLimit(normalized as Record<string, unknown>)
    }

    return true
}

export type PhaseLike = Pick<
    BackendPhase,
    | 'id'
    | 'phaseId'
    | 'name'
    | 'isOpen'
    | 'duration'
    | 'scheduledStartDate'
    | 'actualStartDate'
    | 'scheduledEndDate'
    | 'actualEndDate'
>

export type PhaseOrderingOptions = {
    isF2F?: boolean
    isTask?: boolean
}

const TAB_INSERTION_HELPERS = {
    insertIfMissing(
        tabs: SelectOption[],
        value: string,
        label: string,
        insertIdx: number,
    ): void {
        if (!tabs.some(tab => tab.value === value)) {
            tabs.splice(insertIdx, 0, { label, value })
        }
    },
}

const normalizePhaseName = (name?: string): string => (name || '')
    .trim()
    .toLowerCase()

const isRegistrationPhase = (name?: string): boolean => normalizePhaseName(name) === 'registration'
const isSubmissionPhase = (name?: string): boolean => normalizePhaseName(name) === 'submission'
const isIterativeReviewPhase = (name?: string): boolean => normalizePhaseName(name)
    .includes('iterative review')

const comparePhaseDates = (
    a: PhaseLike,
    b: PhaseLike,
): number => {
    const aStart = new Date(a.actualStartDate || a.scheduledStartDate || '')
        .getTime()
    const bStart = new Date(b.actualStartDate || b.scheduledStartDate || '')
        .getTime()

    if (!Number.isNaN(aStart) && !Number.isNaN(bStart)) {
        if (aStart !== bStart) {
            return aStart - bStart
        }

        const aReg = isRegistrationPhase(a.name)
        const bReg = isRegistrationPhase(b.name)
        const aSub = isSubmissionPhase(a.name)
        const bSub = isSubmissionPhase(b.name)

        if (aReg && bSub) return -1
        if (aSub && bReg) return 1
    }

    return 0
}

const EXPLICIT_PHASE_ORDER = [
    'registration',
    'checkpoint submission',
    'checkpoint screening',
    'checkpoint review',
    'submission',
    'screening',
    'review',
    'approval',
]

/**
 * Build tabs for challenge phases using a consistent ordering.
 */
export function buildPhaseTabs(
    phases: PhaseLike[],
    status?: string,
    opts?: PhaseOrderingOptions,
): SelectOption[] {
    const explicitOrder = new Map<string, number>(
        EXPLICIT_PHASE_ORDER.map((name, idx) => [name, idx]),
    )
    const hasCheckpointPhases = phases.some(phase => {
        const normalized = normalizePhaseName(phase.name)
        return normalized === 'checkpoint submission'
            || normalized === 'checkpoint screening'
            || normalized === 'checkpoint review'
    })

    let sortedPhases = [...phases].sort((a, b) => {
        const aName = normalizePhaseName(a.name)
        const bName = normalizePhaseName(b.name)

        if (hasCheckpointPhases) {
            const aRank = explicitOrder.has(aName)
                ? (explicitOrder.get(aName) as number)
                : Number.POSITIVE_INFINITY
            const bRank = explicitOrder.has(bName)
                ? (explicitOrder.get(bName) as number)
                : Number.POSITIVE_INFINITY

            if (aRank !== bRank) {
                return aRank - bRank
            }

            return comparePhaseDates(a, b)
        }

        return comparePhaseDates(a, b)
    })

    if (opts?.isF2F || opts?.isTask) {
        const iterative = sortedPhases.filter(phase => isIterativeReviewPhase(phase.name))
        if (iterative.length) {
            const remaining = sortedPhases.filter(phase => !isIterativeReviewPhase(phase.name))
            const registrationIdx = remaining.findIndex(phase => isRegistrationPhase(phase.name))
            const submissionIdx = remaining.findIndex(phase => isSubmissionPhase(phase.name))
            const afterIdx = Math.max(registrationIdx, submissionIdx)

            if (afterIdx >= 0 && afterIdx < remaining.length) {
                sortedPhases = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                sortedPhases = [...remaining, ...iterative]
            }
        }
    }

    const labelCounts = new Map<string, number>()
    const nextLabel = (rawName: string): string => {
        const count = labelCounts.get(rawName) || 0
        labelCounts.set(rawName, count + 1)
        if (count === 0) {
            return rawName
        }

        return `${rawName} ${count + 1}`
    }

    const tabs: SelectOption[] = []
    sortedPhases.forEach(phase => {
        const rawName = phase?.name?.trim() || ''
        if (!rawName) {
            return
        }

        const label = nextLabel(rawName)
        tabs.push({ label, value: label })
    })

    const normalizedStatus = (status || '').toUpperCase()
    if (normalizedStatus.startsWith('COMPLETED')) {
        TAB_INSERTION_HELPERS.insertIfMissing(tabs, 'Winners', 'Winners', tabs.length)
    }

    return tabs
}

/**
 * Given the tab label, locate the corresponding phase using the same ordering rules as buildPhaseTabs.
 */
export function findPhaseByTabLabel(
    phases: PhaseLike[],
    label: string,
    opts?: PhaseOrderingOptions,
): PhaseLike | undefined {
    const explicitOrder = new Map<string, number>(
        EXPLICIT_PHASE_ORDER.map((name, idx) => [name, idx]),
    )
    const hasCheckpointPhases = phases.some(phase => {
        const normalized = normalizePhaseName(phase.name)
        return normalized === 'checkpoint submission'
            || normalized === 'checkpoint screening'
            || normalized === 'checkpoint review'
    })

    let sortedPhases = [...phases].sort((a, b) => {
        const aName = normalizePhaseName(a.name)
        const bName = normalizePhaseName(b.name)

        if (hasCheckpointPhases) {
            const aRank = explicitOrder.has(aName)
                ? (explicitOrder.get(aName) as number)
                : Number.POSITIVE_INFINITY
            const bRank = explicitOrder.has(bName)
                ? (explicitOrder.get(bName) as number)
                : Number.POSITIVE_INFINITY

            if (aRank !== bRank) {
                return aRank - bRank
            }

            return comparePhaseDates(a, b)
        }

        return comparePhaseDates(a, b)
    })

    if (opts?.isF2F || opts?.isTask) {
        const iterative = sortedPhases.filter(phase => isIterativeReviewPhase(phase.name))
        if (iterative.length) {
            const remaining = sortedPhases.filter(phase => !isIterativeReviewPhase(phase.name))
            const registrationIdx = remaining.findIndex(phase => isRegistrationPhase(phase.name))
            const submissionIdx = remaining.findIndex(phase => isSubmissionPhase(phase.name))
            const afterIdx = Math.max(registrationIdx, submissionIdx)

            if (afterIdx >= 0 && afterIdx < remaining.length) {
                sortedPhases = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                sortedPhases = [...remaining, ...iterative]
            }
        }
    }

    const labelCounts = new Map<string, number>()
    const labelFor = (rawName: string): string => {
        const count = labelCounts.get(rawName) || 0
        labelCounts.set(rawName, count + 1)
        if (count === 0) {
            return rawName
        }

        return `${rawName} ${count + 1}`
    }

    for (const phase of sortedPhases) {
        const rawName = phase?.name?.trim() || ''
        if (rawName) {
            const computedLabel = labelFor(rawName)
            if (computedLabel === label) {
                return phase
            }
        }
    }

    return undefined
}

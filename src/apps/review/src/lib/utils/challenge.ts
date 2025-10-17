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
    | 'predecessor'
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
const isCheckpointSubmissionPhase = (name?: string): boolean => normalizePhaseName(name) === 'checkpoint submission'
const isCheckpointScreeningPhase = (name?: string): boolean => normalizePhaseName(name) === 'checkpoint screening'
const isIterativeReviewPhase = (name?: string): boolean => normalizePhaseName(name)
    .includes('iterative review')

const getPhaseStartTimestamp = (phase: PhaseLike | undefined): number | undefined => {
    if (!phase) return undefined
    const startSource = phase.actualStartDate || phase.scheduledStartDate
    if (!startSource) return undefined
    const parsed = Date.parse(startSource)
    if (Number.isNaN(parsed)) return undefined
    const minutes = Math.floor(parsed / 60000)
    return Number.isNaN(minutes) ? undefined : minutes
}

const orderPhasesForTabs = (
    phases: PhaseLike[],
    opts?: PhaseOrderingOptions,
): PhaseLike[] => {
    if (!Array.isArray(phases)) return []

    const sanitized = phases.filter(phase => Boolean(phase && typeof phase === 'object')) as PhaseLike[]

    const phaseById = new Map<string, PhaseLike>()
    const phaseByPhaseId = new Map<string, PhaseLike>()
    sanitized.forEach(phase => {
        if (phase.id) {
            phaseById.set(phase.id, phase)
        }

        if (phase.phaseId && !phaseByPhaseId.has(phase.phaseId)) {
            phaseByPhaseId.set(phase.phaseId, phase)
        }
    })

    const ordered: PhaseLike[] = []
    const visiting = new Set<PhaseLike>()
    const visited = new Set<PhaseLike>()

    const findPredecessor = (phase: PhaseLike): PhaseLike | undefined => {
        if (!phase?.predecessor) return undefined
        const predecessorId = phase.predecessor
        return (
            phaseById.get(predecessorId)
            || phaseByPhaseId.get(predecessorId)
            || sanitized.find(candidate => (
                candidate.phaseId === predecessorId
                || candidate.id === predecessorId
            ))
        )
    }

    const addPhase = (phase: PhaseLike): void => {
        if (visited.has(phase)) return
        if (visiting.has(phase)) {
            visiting.delete(phase)
            visited.add(phase)
            if (!ordered.includes(phase)) {
                ordered.push(phase)
            }

            return
        }

        visiting.add(phase)
        const predecessor = findPredecessor(phase)
        if (predecessor && predecessor !== phase) {
            addPhase(predecessor)
        }

        visiting.delete(phase)
        visited.add(phase)
        if (!ordered.includes(phase)) {
            ordered.push(phase)
        }
    }

    sanitized.forEach(addPhase)

    let orderedResult = [...ordered]

    const registrationIdx = orderedResult.findIndex(phase => isRegistrationPhase(phase.name))
    const submissionIdx = orderedResult.findIndex(phase => isSubmissionPhase(phase.name))

    if (registrationIdx > -1 && submissionIdx > -1 && registrationIdx > submissionIdx) {
        const [registrationPhase] = orderedResult.splice(registrationIdx, 1)
        orderedResult.splice(submissionIdx, 0, registrationPhase)
    }

    const ensureRegistrationBeforePhase = (predicate: (phase: PhaseLike) => boolean): void => {
        const currentRegistrationIdx = orderedResult.findIndex(phase => isRegistrationPhase(phase.name))
        if (currentRegistrationIdx === -1) return

        const targetIdx = orderedResult.findIndex(predicate)
        if (targetIdx === -1) return
        if (currentRegistrationIdx <= targetIdx) return

        const registrationPhase = orderedResult[currentRegistrationIdx]
        const targetPhase = orderedResult[targetIdx]
        const registrationStart = getPhaseStartTimestamp(registrationPhase)
        const targetStart = getPhaseStartTimestamp(targetPhase)

        if (registrationStart !== undefined && registrationStart === targetStart) {
            const [registrationEntry] = orderedResult.splice(currentRegistrationIdx, 1)
            const insertionIdx = orderedResult.indexOf(targetPhase)
            orderedResult.splice(insertionIdx < 0 ? 0 : insertionIdx, 0, registrationEntry)
        }
    }

    ensureRegistrationBeforePhase(phase => isCheckpointSubmissionPhase(phase.name))
    ensureRegistrationBeforePhase(phase => isCheckpointScreeningPhase(phase.name))

    if (opts?.isF2F || opts?.isTask) {
        const iterative = orderedResult.filter(phase => isIterativeReviewPhase(phase.name))
        if (iterative.length) {
            const remaining = orderedResult.filter(phase => !isIterativeReviewPhase(phase.name))
            const registrationIdxAfter = remaining.findIndex(phase => isRegistrationPhase(phase.name))
            const submissionIdxAfter = remaining.findIndex(phase => isSubmissionPhase(phase.name))
            const afterIdx = Math.max(registrationIdxAfter, submissionIdxAfter)

            if (afterIdx >= 0 && afterIdx < remaining.length) {
                orderedResult = [
                    ...remaining.slice(0, afterIdx + 1),
                    ...iterative,
                    ...remaining.slice(afterIdx + 1),
                ]
            } else {
                orderedResult = [...remaining, ...iterative]
            }
        }
    }

    return orderedResult
}

/**
 * Build tabs for challenge phases using a consistent ordering.
 */
export function buildPhaseTabs(
    phases: PhaseLike[],
    status?: string,
    opts?: PhaseOrderingOptions,
): SelectOption[] {
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
    const orderedPhases = orderPhasesForTabs(phases, opts)
    orderedPhases.forEach(phase => {
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
    const labelCounts = new Map<string, number>()
    const labelFor = (rawName: string): string => {
        const count = labelCounts.get(rawName) || 0
        labelCounts.set(rawName, count + 1)
        if (count === 0) {
            return rawName
        }

        return `${rawName} ${count + 1}`
    }

    const orderedPhases = orderPhasesForTabs(phases, opts)
    for (const phase of orderedPhases) {
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

const normalizePhaseIdentifier = (
    value: unknown,
): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized.length ? normalized : undefined
}

const collectOpenPhaseIdentifiers = (
    challengeInfo?: ChallengeInfo,
): Set<string> => {
    const identifiers = new Set<string>()

    const pushIdentifiers = (phase?: BackendPhase): void => {
        if (!phase) return
        const phaseId = normalizePhaseIdentifier(phase.phaseId)
        const id = normalizePhaseIdentifier(phase.id)

        if (phaseId) {
            identifiers.add(phaseId)
        }

        if (id) {
            identifiers.add(id)
        }
    }

    (challengeInfo?.phases ?? []).forEach(phase => {
        if (!phase?.isOpen) {
            return
        }

        pushIdentifiers(phase)
    })

    const currentPhase = challengeInfo?.currentPhaseObject
    if (currentPhase && currentPhase.isOpen !== false) {
        pushIdentifiers(currentPhase)
    }

    return identifiers
}

export function isReviewPhaseCurrentlyOpen(
    challengeInfo?: ChallengeInfo,
    phaseId?: string | number | null,
): boolean {
    const normalized = normalizePhaseIdentifier(phaseId)
    if (!normalized) {
        return true
    }

    const openPhaseIdentifiers = collectOpenPhaseIdentifiers(challengeInfo)
    if (!openPhaseIdentifiers.size) {
        return false
    }

    return openPhaseIdentifiers.has(normalized)
}

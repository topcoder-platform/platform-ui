import { isNil } from 'lodash'

export type ReviewPhaseType =
    | 'screening'
    | 'checkpoint screening'
    | 'checkpoint review'
    | 'post-mortem'
    | 'approval'
    | 'review'

export type ReviewerConfig = {
    phaseId?: unknown
    scorecardId?: unknown
    type?: unknown
}

export type ChallengePhaseSummary = {
    id?: unknown
    name?: unknown
}

type PhaseStringMatcher = {
    match: (source: string) => boolean
    phase: ReviewPhaseType
}

const POST_MORTEM_KEYWORDS = ['post-mortem', 'post mortem', 'postmortem']

const PHASE_STRING_MATCHERS: PhaseStringMatcher[] = [
    {
        match: source => source.includes('checkpoint screening'),
        phase: 'checkpoint screening',
    },
    {
        match: source => source.includes('checkpoint review'),
        phase: 'checkpoint review',
    },
    {
        match: source => POST_MORTEM_KEYWORDS.some(keyword => source.includes(keyword)),
        phase: 'post-mortem',
    },
    {
        match: source => source.includes('screening') && !source.includes('checkpoint'),
        phase: 'screening',
    },
    {
        match: source => source.includes('approval'),
        phase: 'approval',
    },
    {
        match: source => source.includes('review'),
        phase: 'review',
    },
]

const detectPhaseTypeFromObject = (value: Record<string, unknown>): ReviewPhaseType | undefined => {
    const candidateKeys: Array<keyof typeof value> = [
        'name',
        'phaseName',
        'phase',
        'type',
    ].filter(key => key in value) as Array<keyof typeof value>

    for (const key of candidateKeys) {
        const detected = detectReviewPhaseType(value[key])
        if (detected) {
            return detected
        }
    }

    return undefined
}

export const detectReviewTypeFromMetadata = (
    metadata: unknown,
): ReviewPhaseType | undefined => {
    if (!metadata || typeof metadata !== 'object') {
        return undefined
    }

    const metadataRecord = metadata as Record<string, unknown>
    const metadataKeys = ['type', 'reviewType', 'scorecardType', 'phaseName', 'name']

    for (const key of metadataKeys) {
        const rawValue = metadataRecord[key]
        if (typeof rawValue === 'string') {
            const detected = detectReviewPhaseType(rawValue)
            if (detected) {
                return detected
            }
        }
    }

    return undefined
}

const detectPhaseTypeFromString = (value: string): ReviewPhaseType | undefined => {
    const normalized = value.trim()
        .toLowerCase()
    if (!normalized) {
        return undefined
    }

    for (const matcher of PHASE_STRING_MATCHERS) {
        if (matcher.match(normalized)) {
            return matcher.phase
        }
    }

    return undefined
}

export function detectReviewPhaseType(value?: unknown): ReviewPhaseType | undefined {
    if (isNil(value)) {
        return undefined
    }

    if (typeof value === 'object') {
        return detectPhaseTypeFromObject(value as Record<string, unknown>)
    }

    return detectPhaseTypeFromString(`${value}`)
}

export const detectReviewTypeFromPhases = (
    phases: ChallengePhaseSummary[] | undefined,
    targetPhaseId?: unknown,
): ReviewPhaseType | undefined => {
    if (!phases?.length || targetPhaseId === undefined || targetPhaseId === null) {
        return undefined
    }

    const normalizedTargetPhaseId = `${targetPhaseId}`
    const matchedPhase = phases.find(phase => `${phase.id}` === normalizedTargetPhaseId)

    return detectReviewPhaseType(matchedPhase?.name)
}

export const detectReviewTypeFromReviewerConfig = (
    reviewerConfigs: ReviewerConfig[] | undefined,
    normalizedPhaseId?: string,
    normalizedScorecardId?: string,
): ReviewPhaseType | undefined => {
    if (!reviewerConfigs?.length) {
        return undefined
    }

    const matchedConfig = reviewerConfigs.find(config => (
        (normalizedPhaseId && `${config.phaseId}` === normalizedPhaseId)
        || (normalizedScorecardId && `${config.scorecardId}` === normalizedScorecardId)
    ))

    return detectReviewPhaseType(matchedConfig?.type)
}

export const normalizeRoleName = (value: unknown): string => {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

type RoleMatcher = (normalizedRoleName: string) => boolean

const PHASE_ROLE_MATCHERS: Partial<Record<ReviewPhaseType, RoleMatcher>> = {
    approval: normalizedRoleName => (
        normalizedRoleName.includes('approver')
        || normalizedRoleName.includes('approval')
    ),
    'checkpoint review': normalizedRoleName => normalizedRoleName === 'checkpointreviewer',
    'checkpoint screening': normalizedRoleName => normalizedRoleName === 'checkpointscreener',
    'post-mortem': normalizedRoleName => normalizedRoleName.includes('postmortem'),
    review: normalizedRoleName => (
        normalizedRoleName.includes('reviewer')
        && !normalizedRoleName.includes('checkpoint')
        && !normalizedRoleName.includes('postmortem')
    ),
    screening: normalizedRoleName => (
        (
            normalizedRoleName.includes('screener')
            || normalizedRoleName.includes('screening')
        )
        && !normalizedRoleName.includes('checkpoint')
    ),
}

export const canRoleEditPhase = (
    reviewPhaseType: ReviewPhaseType | undefined,
    currentPhaseReviewType: ReviewPhaseType | undefined,
    normalizedRoleName: string,
): boolean => {
    if (!reviewPhaseType) {
        return false
    }

    if (currentPhaseReviewType && currentPhaseReviewType !== reviewPhaseType) {
        return false
    }

    const matcher = PHASE_ROLE_MATCHERS[reviewPhaseType]

    return matcher ? matcher(normalizedRoleName) : false
}

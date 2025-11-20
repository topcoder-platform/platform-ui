import { useMemo } from 'react'

import {
    BackendResource,
    ChallengeInfo,
    ReviewInfo,
    ScorecardInfo,
} from '../models'

type ReviewPhaseType =
    | 'screening'
    | 'checkpoint screening'
    | 'checkpoint review'
    | 'post-mortem'
    | 'approval'
    | 'review'

type ReviewerConfig = {
    phaseId?: unknown
    scorecardId?: unknown
    type?: unknown
}

type ChallengePhaseSummary = {
    id?: unknown
    name?: unknown
}

type RoleMatcher = (normalizedRoleName: string) => boolean

const isNil = (value: unknown): value is null | undefined => value === null || value === undefined

const normalizeRoleName = (value: unknown): string => {
    if (typeof value !== 'string') {
        return ''
    }

    return value
        .trim()
        .toLowerCase()
        .replace(/[^a-z]/g, '')
}

const POST_MORTEM_KEYWORDS = ['post-mortem', 'post mortem', 'postmortem']

type PhaseStringMatcher = {
    match: (source: string) => boolean
    phase: ReviewPhaseType
}

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

function detectReviewPhaseType(value?: unknown): ReviewPhaseType | undefined {
    if (isNil(value)) {
        return undefined
    }

    if (typeof value === 'object') {
        return detectPhaseTypeFromObject(value as Record<string, unknown>)
    }

    return detectPhaseTypeFromString(`${value}`)
}

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

const detectReviewTypeFromReviewerConfig = (
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

const detectReviewTypeFromPhases = (
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

const canRoleEditPhase = (
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

export interface UseReviewEditAccessArgs {
    challengeInfo?: ChallengeInfo
    reviewInfo?: ReviewInfo
    scorecardInfo?: ScorecardInfo
    myChallengeResources: BackendResource[]
    isEditPhase: boolean
    isReviewCompleted: boolean
}

export interface UseReviewEditAccessResult {
    isEdit: boolean
    isPhaseEditAllowed: boolean
    reviewPhaseType?: ReviewPhaseType
}

/**
 * Determine whether the current user can edit the review scorecard.
 * Handles review, screening, checkpoint, approval, and post-mortem phase checks.
 */
export const useReviewEditAccess = ({
    challengeInfo,
    reviewInfo,
    scorecardInfo,
    myChallengeResources,
    isEditPhase,
    isReviewCompleted,
}: UseReviewEditAccessArgs): UseReviewEditAccessResult => {
    const reviewPhaseType = useMemo<ReviewPhaseType | undefined>(() => {
        const reviewerConfigs = challengeInfo?.reviewers ?? []
        const normalizedPhaseId = reviewInfo?.phaseId ? `${reviewInfo.phaseId}` : undefined
        const normalizedScorecardId = reviewInfo?.scorecardId ? `${reviewInfo.scorecardId}` : undefined

        const metadataDerived = detectReviewPhaseType(reviewInfo?.metadata)
        const phaseDerived = detectReviewTypeFromPhases(
            challengeInfo?.phases as ChallengePhaseSummary[],
            reviewInfo?.phaseId,
        )
        const reviewerDerived = detectReviewTypeFromReviewerConfig(
            reviewerConfigs as ReviewerConfig[],
            normalizedPhaseId,
            normalizedScorecardId,
        )
        const scorecardDerived = detectReviewPhaseType(scorecardInfo?.name)

        return metadataDerived
            || phaseDerived
            || reviewerDerived
            || scorecardDerived
            || undefined
    }, [
        challengeInfo?.phases,
        challengeInfo?.reviewers,
        reviewInfo?.metadata,
        reviewInfo?.phaseId,
        reviewInfo?.scorecardId,
        scorecardInfo?.name,
    ])

    const currentPhaseReviewType = useMemo(
        () => detectReviewPhaseType(challengeInfo?.currentPhase),
        [challengeInfo?.currentPhase],
    )

    const isPhaseEditAllowed = useMemo(() => {
        if (!reviewPhaseType || !reviewInfo?.resourceId) {
            return false
        }

        const myResource = myChallengeResources.find(resource => resource.id === reviewInfo.resourceId)
        if (!myResource) {
            return false
        }

        const normalizedRoleName = normalizeRoleName(myResource.roleName)

        return canRoleEditPhase(
            reviewPhaseType,
            currentPhaseReviewType,
            normalizedRoleName,
        )
    }, [
        reviewPhaseType,
        currentPhaseReviewType,
        myChallengeResources,
        reviewInfo?.resourceId,
    ])

    const isEdit = useMemo(
        () => (isEditPhase || isPhaseEditAllowed) && !isReviewCompleted,
        [isPhaseEditAllowed, isEditPhase, isReviewCompleted],
    )

    return {
        isEdit,
        isPhaseEditAllowed,
        reviewPhaseType,
    }
}

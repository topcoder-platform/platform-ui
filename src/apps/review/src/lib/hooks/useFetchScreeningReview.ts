import { every, filter, forEach, orderBy } from 'lodash'
import { useContext, useEffect, useMemo } from 'react'
import useSWR, { type SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared'

import {
    ADMIN,
    COPILOT,
    DESIGN,
    MANAGER,
    REVIEWER,
    SUBMITTER,
} from '../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import type {
    BackendResource,
    BackendReview,
    BackendSubmission,
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    ReviewAppContextModel,
    Screening,
    SubmissionInfo,
} from '../models'
import {
    convertBackendReviewToReviewInfo,
    convertBackendReviewToReviewResult,
    convertBackendSubmissionToScreening,
    convertBackendSubmissionToSubmissionInfo,
} from '../models'
import { fetchChallengeReviews } from '../services'
import { SUBMISSION_TYPE_CHECKPOINT, SUBMISSION_TYPE_CONTEST } from '../constants'
import { debugLog, DEBUG_CHECKPOINT_PHASES, isPhaseAllowedForReview, truncateForLog, warnLog } from '../utils'
import { registerChallengeReviewKey } from '../utils/reviewCacheRegistry'
import { normalizeReviewMetadata } from '../utils/metadataMatching'
import { resolvePhaseMeta } from '../utils/phaseResolution'
import { buildReviewForResource } from '../utils/reviewBuilding'
import { resolveReviewPhaseId, reviewMatchesPhase } from '../utils/reviewMatching'
import { shouldIncludeInReviewPhase } from '../utils/reviewPhaseGuards'
import {
    buildResourceFromReviewHandle,
    determinePassFail,
    getNumericScore,
    parseSubmissionScore,
    scoreToDisplay,
} from '../utils/reviewScoring'
import type {
    SubmissionIdResolutionArgs,
    SubmissionLookupArgs,
    SubmitterMemberIdResolutionArgs,
} from '../utils/submissionResolution'
import {
    resolveFallbackSubmissionId,
    resolveSubmissionForReview,
    resolveSubmitterMemberId,
} from '../utils/submissionResolution'

import type { useFetchAppealQueueProps } from './useFetchAppealQueue'
import { useFetchAppealQueue } from './useFetchAppealQueue'
import type { useFetchChallengeSubmissionsProps } from './useFetchChallengeSubmissions'
import { useFetchChallengeSubmissions } from './useFetchChallengeSubmissions'
import type { useRoleProps } from './useRole'
import { useRole } from './useRole'

const normalizeSubmissionType = (type?: string | null): string => type?.trim()
    .toUpperCase() ?? ''

const isContestSubmission = (submission: BackendSubmission): boolean => (
    normalizeSubmissionType(submission?.type) === SUBMISSION_TYPE_CONTEST
)

const isCheckpointSubmission = (submission: BackendSubmission): boolean => (
    normalizeSubmissionType(submission?.type) === SUBMISSION_TYPE_CHECKPOINT
)

const resolveCheckpointSubmissionScore = (
    review: BackendReview,
    submission: BackendSubmission,
): number | undefined => {
    const reviewStatus = (review.status || '').toUpperCase()
    if (reviewStatus !== 'COMPLETED' && reviewStatus !== 'SUBMITTED') {
        return undefined
    }

    return parseSubmissionScore(submission.screeningScore)
}

const phaseNameEquals = (
    value: string | null | undefined,
    target: string,
): boolean => {
    if (typeof value !== 'string') {
        return false
    }

    const normalizedValue = value.trim()
        .toLowerCase()
    const normalizedTarget = target.trim()
        .toLowerCase()

    return normalizedValue === normalizedTarget
}

const matchesReviewPhaseCandidate = (
    review: BackendReview | undefined,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
): boolean => {
    if (!review) {
        return false
    }

    if (reviewMatchesPhase(review, scorecardId, phaseIds, phaseLabel)) {
        return true
    }

    if (phaseNameEquals((review as { phaseName?: string | null }).phaseName, phaseLabel)) {
        return true
    }

    const reviewType = (review as { reviewType?: string | null }).reviewType
    if (phaseNameEquals(reviewType, phaseLabel)) {
        return true
    }

    return false
}

const collectMatchingReviews = (
    submission: BackendSubmission,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    submissionReviewMap?: Map<string, BackendReview>,
    globalReviews?: BackendReview[],
): BackendReview[] => {
    const seen = new Map<string, BackendReview>()
    const pushReview = (review: BackendReview | undefined): void => {
        if (!review?.id) {
            return
        }

        if (!matchesReviewPhaseCandidate(review, phaseLabel, scorecardId, phaseIds)) {
            return
        }

        if (!seen.has(review.id)) {
            seen.set(review.id, review)
        }
    }

    if (submissionReviewMap?.size) {
        pushReview(submissionReviewMap.get(submission.id))
    }

    if (Array.isArray(globalReviews) && globalReviews.length) {
        globalReviews.forEach(review => {
            if (review?.submissionId === submission.id) {
                pushReview(review)
            }
        })
    }

    if (submission.reviewResourceMapping) {
        Object.values(submission.reviewResourceMapping)
            .forEach(review => {
                pushReview(review)
            })
    }

    if (Array.isArray(submission.review)) {
        submission.review.forEach(review => {
            pushReview(review)
        })
    }

    return Array.from(seen.values())
}

const findFallbackReview = (
    submission: BackendSubmission,
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
): BackendReview | undefined => {
    if (!Array.isArray(submission.review)) {
        return undefined
    }

    const phaseLabelLower = phaseLabel.toLowerCase()

    return submission.review.find(review => {
        if (!review) {
            return false
        }

        if (matchesReviewPhaseCandidate(review, phaseLabel, scorecardId, phaseIds)) {
            return true
        }

        const typeMatches = typeof review.typeId === 'string'
            && review.typeId.toLowerCase()
                .includes(phaseLabelLower)

        return typeMatches
    })
}

const selectBestReview = (
    reviews: BackendReview[],
    phaseLabel: string,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
    submission: BackendSubmission,
): BackendReview | undefined => {
    if (!reviews.length) {
        return findFallbackReview(submission, phaseLabel, scorecardId, phaseIds)
    }

    const sorted = orderBy(
        reviews,
        [
            (review: BackendReview) => Boolean(review.committed),
            (review: BackendReview) => (review.status || '').toUpperCase() === 'COMPLETED',
            (review: BackendReview) => {
                const score = getNumericScore(review)
                return typeof score === 'number' ? score : -Infinity
            },
            (review: BackendReview) => {
                const updatedAt = review.updatedAt || review.reviewDate || review.createdAt
                const parsed = updatedAt ? Date.parse(updatedAt) : NaN
                return Number.isFinite(parsed) ? parsed : 0
            },
        ],
        ['desc', 'desc', 'desc', 'desc'],
    )

    return sorted[0]
}

type CheckpointReviewDebugArgs = {
    candidateReviews: BackendReview[]
    checkpointReviewPhaseIds: Set<string>
    checkpointReviewScorecardId?: string
    debugEnabled: boolean
    fallbackReviewByPhaseName: BackendReview | undefined
    submission: BackendSubmission
}

const logCheckpointReviewSubmissionDebug = ({
    candidateReviews,
    checkpointReviewPhaseIds,
    checkpointReviewScorecardId,
    debugEnabled,
    fallbackReviewByPhaseName,
    submission,
}: CheckpointReviewDebugArgs): void => {
    if (!debugEnabled) {
        return
    }

    if (!candidateReviews.length) {
        const embeddedReviews = Array.isArray(submission.review) ? submission.review : []

        debugLog('checkpointReview.unmatchedSubmission', {
            candidateReviewCount: candidateReviews.length,
            checkpointReviewPhaseIds,
            checkpointReviewScorecardId,
            fallbackReviewFound: Boolean(fallbackReviewByPhaseName),
            reviewIds: embeddedReviews.map(review => review?.id),
            reviewPhaseIds: embeddedReviews.map(review => review?.phaseId),
            reviewPhaseNames: embeddedReviews.map(review => review?.phaseName),
            reviewScorecardIds: embeddedReviews.map(review => review?.scorecardId),
            submissionId: submission.id,
            totalEmbeddedReviews: embeddedReviews.length,
        })
    }

    if (fallbackReviewByPhaseName) {
        debugLog('checkpointReview.fallbackPhaseMatch', {
            fallbackPhaseId: fallbackReviewByPhaseName.phaseId,
            fallbackReviewId: fallbackReviewByPhaseName.id,
            fallbackScorecardId: fallbackReviewByPhaseName.scorecardId,
            phaseName: fallbackReviewByPhaseName.phaseName,
            submissionId: submission.id,
        })
    }
}

type ReviewerDisplayArgs = {
    fallbackCheckpointReviewer?: BackendResource
    resources?: BackendResource[]
    reviewEntry: BackendReview | undefined
    reviewerResourceId: string | undefined
}

const resolveCheckpointReviewerDisplay = ({
    fallbackCheckpointReviewer,
    resources,
    reviewEntry,
    reviewerResourceId,
}: ReviewerDisplayArgs): BackendResource => {
    if (reviewerResourceId) {
        const resourceMatch = (resources ?? []).find(resource => resource.id === reviewerResourceId)
        if (resourceMatch) {
            return resourceMatch
        }

        if (reviewEntry?.reviewerHandle) {
            return {
                handleColor: '#2a2a2a',
                memberHandle: reviewEntry.reviewerHandle,
            } as BackendResource
        }
    }

    if (fallbackCheckpointReviewer) {
        return fallbackCheckpointReviewer
    }

    return {
        handleColor: '#2a2a2a',
        memberHandle: 'Not assigned',
    } as BackendResource
}

const resolveCheckpointNumericScore = (
    reviewEntry: BackendReview | undefined,
    submission: BackendSubmission,
): number | undefined => {
    if (!reviewEntry) {
        return undefined
    }

    const numericScore = getNumericScore(reviewEntry)
    if (numericScore !== undefined) {
        return numericScore
    }

    return resolveCheckpointSubmissionScore(reviewEntry, submission)
}

type CheckpointReviewRowBuilderArgs = {
    base: Screening
    fallbackCheckpointReviewer?: BackendResource
    item: BackendSubmission
    minPass: number | undefined
    myAssignment?: BackendReview
    resourceMemberIdMapping: ChallengeDetailContextModel['resourceMemberIdMapping']
    resources?: BackendResource[]
    reviewEntries: Array<BackendReview | undefined>
}

const buildCheckpointReviewRowsForSubmission = ({
    base,
    fallbackCheckpointReviewer,
    item,
    minPass,
    myAssignment,
    resourceMemberIdMapping,
    resources,
    reviewEntries,
}: CheckpointReviewRowBuilderArgs): Screening[] => reviewEntries.map(reviewEntry => {
    const numericScore = resolveCheckpointNumericScore(reviewEntry, item)
    const reviewerResourceId = reviewEntry?.resourceId ?? base.screenerId
    const reviewerDisplay = resolveCheckpointReviewerDisplay({
        fallbackCheckpointReviewer,
        resources,
        reviewEntry,
        reviewerResourceId,
    })

    return {
        ...base,
        checkpointReviewer: reviewerDisplay,
        myReviewId: myAssignment?.id,
        myReviewResourceId: myAssignment?.resourceId,
        myReviewStatus: myAssignment?.status ?? undefined,
        result: determinePassFail(numericScore, minPass, base.result, reviewEntry?.metadata),
        reviewId: reviewEntry?.id,
        reviewPhaseId: resolveReviewPhaseId(reviewEntry),
        reviewStatus: reviewEntry?.status ?? undefined,
        score: scoreToDisplay(numericScore, 'Pending'),
        screenerId: reviewerDisplay?.id || reviewerResourceId,
        userInfo: resourceMemberIdMapping[base.memberId],
    }
})

export interface useFetchScreeningReviewProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    // screening data
    screening: Screening[]
    screeningMinimumPassingScore: number | null | undefined
    // checkpoint data (if any)
    checkpoint: Screening[]
    checkpointScreeningMinimumPassingScore: number | null | undefined
    // checkpoint review data (if any)
    checkpointReview: Screening[]
    checkpointReviewMinimumPassingScore: number | null | undefined
    // review data
    review: SubmissionInfo[]
    reviewMinimumPassingScore: number | null | undefined
    submitterReviews: SubmissionInfo[]
    // approval reviews (one entry per approval review instance)
    approvalReviews: SubmissionInfo[]
    approvalMinimumPassingScore: number | null | undefined
    // post-mortem reviews (one entry per post-mortem instance)
    postMortemReviews: SubmissionInfo[]
    postMortemMinimumPassingScore: number | null | undefined
    isLoading: boolean
    reviewProgress: number
}

/**
 * Fetch screening and review data
 * @returns challenge screening and review data
 */
// eslint-disable-next-line complexity
export function useFetchScreeningReview(): useFetchScreeningReviewProps {
    const { actionChallengeRole }: useRoleProps = useRole()

    const {
        loginUserInfo,
        resourceRoleReviewer,
    }: ReviewAppContextModel = useContext(ReviewAppContext)

    // get challenge info from challenge detail context
    const {
        challengeId,
        challengeInfo,
        resourceMemberIdMapping,
        reviewers: challengeReviewers,
        resources,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const challengeLegacy = (challengeInfo as unknown as {
        legacy?: {
            reviewScorecardId?: number | string
            screeningScorecardId?: number | string
        }
    } | undefined)?.legacy

    // fetch challenge submissions
    const {
        challengeSubmissions,
        deletedLegacySubmissionIds,
        deletedSubmissionIds,
        isLoading,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(challengeId)

    const visibleChallengeSubmissions = useMemo<BackendSubmission[]>(
        () => challengeSubmissions,
        [challengeSubmissions],
    )

    const visibleSubmissionsById = useMemo(
        () => visibleChallengeSubmissions.reduce<Map<string, BackendSubmission>>(
            (accumulator, submission) => {
                if (submission.id) {
                    accumulator.set(submission.id, submission)
                }

                return accumulator
            },
            new Map<string, BackendSubmission>(),
        ),
        [visibleChallengeSubmissions],
    )

    const visibleSubmissionsByLegacyId = useMemo(
        () => visibleChallengeSubmissions.reduce<Map<string, BackendSubmission>>(
            (accumulator, submission) => {
                const legacyId = submission.legacySubmissionId
                if (legacyId) {
                    accumulator.set(`${legacyId}`, submission)
                }

                return accumulator
            },
            new Map<string, BackendSubmission>(),
        ),
        [visibleChallengeSubmissions],
    )

    const debugCheckpointPhases = DEBUG_CHECKPOINT_PHASES

    // Subsets by submission type for tab-specific displays
    const contestSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(isContestSubmission),
        [visibleChallengeSubmissions],
    )

    const checkpointSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(isCheckpointSubmission),
        [visibleChallengeSubmissions],
    )
    // Get list of reviewer ids
    const reviewerIds = useMemo(() => {
        let results: string[] = []

        const normalizeRoleName = (roleName?: string | null): string | undefined => roleName
            ?.trim()
            .toLowerCase()
        const isReviewerRoleName = (normalizedRoleName?: string): boolean => {
            if (!normalizedRoleName) {
                return false
            }

            const alphaOnly = normalizedRoleName.replace(/[^a-z]/g, '')
            if (!alphaOnly) {
                return false
            }

            if (alphaOnly.includes('postmortem')) {
                return true
            }

            if (alphaOnly.includes('reviewer')) {
                return true
            }

            if (alphaOnly.includes('interview')) {
                return false
            }

            return alphaOnly.includes('review') && !alphaOnly.includes('appeal')
        }

        const reviewerRoleIds = new Set<string>()
        const appendRoleId = (roleId?: string | null): void => {
            if (typeof roleId !== 'string') {
                return
            }

            const normalized = roleId.trim()
            if (!normalized) {
                return
            }

            reviewerRoleIds.add(normalized)
        }

        appendRoleId(resourceRoleReviewer?.id)

        if (challengeReviewers) {
            challengeReviewers.forEach(reviewer => appendRoleId(reviewer.roleId))
        }

        if (resources) {
            resources.forEach(resource => {
                const normalizedRoleName = normalizeRoleName(resource.roleName)
                if (isReviewerRoleName(normalizedRoleName)) {
                    appendRoleId(resource.roleId)
                }
            })
        }

        const roleIdMatches = (roleId?: string | null): boolean => {
            if (!roleId) {
                return false
            }

            const normalized = `${roleId}`.trim()
            if (!normalized) {
                return false
            }

            return reviewerRoleIds.size
                ? reviewerRoleIds.has(normalized)
                : normalized === (resourceRoleReviewer?.id ?? '')
        }

        if (challengeReviewers && challengeReviewers.length) {
            const reviewerRoleResources = filter(
                challengeReviewers,
                reviewer => {
                    const normalizedRoleName = normalizeRoleName(reviewer.roleName)
                    const matchesRoleName = isReviewerRoleName(normalizedRoleName)
                    const matchesRoleId = roleIdMatches(reviewer.roleId)
                    return matchesRoleName || matchesRoleId
                },
            )

            results = (
                actionChallengeRole === REVIEWER
                    ? filter(
                        reviewerRoleResources,
                        reviewer => reviewer.memberId === `${loginUserInfo?.userId}`,
                    )
                    : reviewerRoleResources
            )
                .map(reviewer => reviewer.id)
                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0)
        }

        const fallbackResults = new Set<string>(results)

        const reviewerResourceIds = new Set(
            (resources ?? [])
                .filter(resource => {
                    const normalizedRoleName = normalizeRoleName(resource.roleName)
                    const matchesRoleName = isReviewerRoleName(normalizedRoleName)
                    const matchesRoleId = roleIdMatches(resource.roleId)
                    const matchesCurrentReviewer = actionChallengeRole !== REVIEWER
                        || `${resource.memberId ?? ''}` === `${loginUserInfo?.userId ?? ''}`
                    return (matchesRoleName || matchesRoleId) && matchesCurrentReviewer
                })
                .map(resource => resource.id)
                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
        )

        reviewerResourceIds.forEach(id => fallbackResults.add(id))

        const shouldRestrictToKnownResources = reviewerResourceIds.size > 0
            && actionChallengeRole === REVIEWER

        forEach(visibleChallengeSubmissions, challengeSubmission => {
            forEach(challengeSubmission.review, review => {
                if (!isPhaseAllowedForReview(review?.phaseName)) {
                    return
                }

                const resourceId = review?.resourceId
                if (!resourceId) {
                    return
                }

                if (shouldRestrictToKnownResources && !reviewerResourceIds.has(resourceId)) {
                    return
                }

                fallbackResults.add(resourceId)
            })
        })

        return Array.from(fallbackResults)

    }, [
        challengeReviewers,
        visibleChallengeSubmissions,
        actionChallengeRole,
        loginUserInfo,
        resources,
        resourceRoleReviewer,
        challengeId,
    ])

    // fetch appeal response
    const {
        mappingReviewAppeal,
        loadResourceAppeal,
        cancelLoadResourceAppeal,
    }: useFetchAppealQueueProps = useFetchAppealQueue()

    const reviewerKey = useMemo(
        () => reviewerIds
            .slice()
            .sort()
            .join(','),
        [reviewerIds],
    )

    const shouldForceReviewFetch = useMemo(
        () => {
            const normalizedActionRole = actionChallengeRole ?? ''

            if (
                normalizedActionRole === SUBMITTER
                || normalizedActionRole === REVIEWER
                || normalizedActionRole === COPILOT
                || normalizedActionRole === ADMIN
                || normalizedActionRole === MANAGER
            ) {
                return true
            }

            return (myResources ?? []).some(resource => {
                const normalizedRoleName = (resource.roleName ?? '').toLowerCase()

                if (!normalizedRoleName) {
                    return false
                }

                return normalizedRoleName.includes('screener')
                    || normalizedRoleName.includes('reviewer')
                    || normalizedRoleName.includes('copilot')
                    || normalizedRoleName.includes('admin')
                    || normalizedRoleName.includes('manager')
            })
        },
        [actionChallengeRole, myResources],
    )

    const {
        data: challengeReviewsData,
        error: fetchChallengeReviewsError,
        isValidating: isValidatingChallengeReviews,
    }: SWRResponse<BackendReview[], Error> = useSWR<BackendReview[], Error>(
        challengeId && (reviewerIds.length || shouldForceReviewFetch)
            ? `reviewBaseUrl/reviews/${challengeId}/${reviewerKey}`
            : undefined,
        {
            fetcher: () => fetchChallengeReviews(challengeId ?? ''),
        },
    )

    useEffect(() => {
        if (!challengeId) {
            return
        }

        registerChallengeReviewKey(challengeId, `reviewBaseUrl/reviews/${challengeId}/${reviewerKey}`)
    }, [challengeId, reviewerKey])

    const challengeReviews = useMemo(
        () => {
            if (!challengeReviewsData) {
                return challengeReviewsData
            }

            if (!deletedSubmissionIds.size && !deletedLegacySubmissionIds.size) {
                return challengeReviewsData
            }

            return challengeReviewsData.filter(reviewEntry => {
                if (!reviewEntry) {
                    return false
                }

                if (reviewEntry.submissionId && deletedSubmissionIds.has(`${reviewEntry.submissionId}`)) {
                    return false
                }

                if (
                    reviewEntry.legacySubmissionId
                    && deletedLegacySubmissionIds.has(`${reviewEntry.legacySubmissionId}`)
                ) {
                    return false
                }

                return true
            })
        },
        [challengeReviewsData, deletedLegacySubmissionIds, deletedSubmissionIds],
    )

    const challengeReviewById = useMemo(() => {
        const map = new Map<string, BackendReview>()
        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, reviewEntry => {
                if (reviewEntry?.id) {
                    map.set(reviewEntry.id, reviewEntry)
                }
            })
        }

        return map
    }, [challengeReviews])

    // Resolve scorecard ids and phase ids for Screening / Checkpoint phases
    const screeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ],
    )
    const screeningScorecardId = screeningPhaseMeta.scorecardId
    const screeningPhaseIds = screeningPhaseMeta.phaseIds

    const checkpointScreeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.screeningScorecardId,
        ],
    )
    const checkpointScreeningScorecardId = checkpointScreeningPhaseMeta.scorecardId
    const checkpointScreeningPhaseIds = checkpointScreeningPhaseMeta.phaseIds

    const checkpointReviewPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Review',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const checkpointReviewScorecardId = checkpointReviewPhaseMeta.scorecardId
    const checkpointReviewPhaseIds = checkpointReviewPhaseMeta.phaseIds

    const reviewPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Review',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const reviewScorecardId = reviewPhaseMeta.scorecardId
    const reviewPhaseIds = reviewPhaseMeta.phaseIds

    const iterativeReviewPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Iterative Review',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const iterativeReviewScorecardId = iterativeReviewPhaseMeta.scorecardId
    const iterativeReviewPhaseIds = iterativeReviewPhaseMeta.phaseIds

    const approvalPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Approval',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const approvalScorecardId = approvalPhaseMeta.scorecardId
    const approvalPhaseIds = approvalPhaseMeta.phaseIds

    const postMortemPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Post-Mortem',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ),
        [
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
            challengeLegacy?.reviewScorecardId,
        ],
    )
    const postMortemScorecardId = postMortemPhaseMeta.scorecardId
    const postMortemPhaseIds = postMortemPhaseMeta.phaseIds

    // Fetch minimumPassingScore for screening and checkpoint review scorecards
    type ScorecardBase = { id: string; minimumPassingScore: number | null }
    const {
        data: screeningScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/screening/${screeningScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!screeningScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${screeningScorecardId}`)
                return rs
            },
            isPaused: () => !screeningScorecardId,
        },
    )

    const {
        data: checkpointScreeningScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/checkpoint-screening/${checkpointScreeningScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!checkpointScreeningScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${checkpointScreeningScorecardId}`)
                return rs
            },
            isPaused: () => !checkpointScreeningScorecardId,
        },
    )

    const {
        data: checkpointReviewScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/checkpoint-review/${checkpointReviewScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!checkpointReviewScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${checkpointReviewScorecardId}`)
                return rs
            },
            isPaused: () => !checkpointReviewScorecardId,
        },
    )

    const {
        data: reviewScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/review/${reviewScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!reviewScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${reviewScorecardId}`)
                return rs
            },
            isPaused: () => !reviewScorecardId,
        },
    )

    const {
        data: approvalScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/approval/${approvalScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!approvalScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${approvalScorecardId}`)
                return rs
            },
            isPaused: () => !approvalScorecardId,
        },
    )

    const {
        data: postMortemScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/postmortem/${postMortemScorecardId || ''}`,
        {
            fetcher: async () => {
                if (!postMortemScorecardId) return undefined
                const rs = await xhrGetAsync<{
                    id: string
                    minimumPassingScore: number | null
                }>(`${EnvironmentConfig.API.V6}/scorecards/${postMortemScorecardId}`)
                return rs
            },
            isPaused: () => !postMortemScorecardId,
        },
    )

    useEffect(() => {
        if (fetchChallengeReviewsError) {
            handleError(fetchChallengeReviewsError)
        }
    }, [fetchChallengeReviewsError])

    const reviewAssignmentsBySubmission = useMemo(
        () => {
            const mapping: { [submissionId: string]: { [resourceId: string]: BackendReview } } = {}

            forEach(challengeReviews, reviewItem => {
                if (!reviewItem) {
                    return
                }

                if (!isPhaseAllowedForReview(reviewItem.phaseName)) {
                    return
                }

                const resourceId = reviewItem.resourceId
                const submissionId = reviewItem.submissionId
                if (!resourceId || !submissionId) {
                    return
                }

                if (!mapping[submissionId]) {
                    mapping[submissionId] = {}
                }

                mapping[submissionId][resourceId] = reviewItem
            })

            return mapping
        },
        [challengeReviews, reviewerIds],
    )

    // get screening data from challenge submissions
    const screening = useMemo(
        () => {
            const screeningReviewsBySubmission = new Map<string, BackendReview>()
            if (challengeReviews && challengeReviews.length) {
                forEach(challengeReviews, rv => {
                    if (reviewMatchesPhase(rv, screeningScorecardId, screeningPhaseIds, 'Screening')) {
                        screeningReviewsBySubmission.set(rv.submissionId, rv)
                    }
                })
            }

            const minPass = screeningScorecardBase?.minimumPassingScore ?? undefined
            // Current viewer's resource ids that grant Screening review access (Screener or Reviewer)
            const myScreeningReviewerResourceIds = new Set<string>();
            (myResources ?? []).forEach(resource => {
                const normalizedRoleName = (resource.roleName || '').toLowerCase()

                const matchesScreenerRole = normalizedRoleName.includes('screener')
                    && !normalizedRoleName.includes('checkpoint')
                const matchesReviewerRole = normalizedRoleName.replace(/[^a-z]/g, '') === 'reviewer'

                if (!matchesScreenerRole && !matchesReviewerRole) {
                    return
                }

                const resourceIdValue = resource.id
                const resourceId = typeof resourceIdValue === 'string'
                    ? resourceIdValue.trim()
                    : resourceIdValue === undefined || resourceIdValue === null
                        ? ''
                        : `${resourceIdValue}`.trim()
                if (!resourceId) {
                    return
                }

                myScreeningReviewerResourceIds.add(resourceId)
            })
            // Only show CONTEST_SUBMISSION on Submission/Screening tabs
            // eslint-disable-next-line complexity
            return contestSubmissions.map(item => {
                const base = convertBackendSubmissionToScreening(item)
                let matchedReview = screeningReviewsBySubmission.get(item.id)
                if (!matchedReview && item.reviewResourceMapping) {
                    matchedReview = Object.values(item.reviewResourceMapping)
                        .find(review => reviewMatchesPhase(
                            review,
                            screeningScorecardId,
                            screeningPhaseIds,
                            'Screening',
                        ))
                }

                let numericScore = getNumericScore(matchedReview)
                let scoreDisplay = scoreToDisplay(numericScore, base.score)

                if (
                    numericScore === undefined
                    && matchedReview
                    && ['COMPLETED', 'SUBMITTED'].includes((matchedReview.status || '').toUpperCase())
                ) {
                    const submissionScore = parseSubmissionScore(item.screeningScore)
                    if (submissionScore !== undefined) {
                        numericScore = submissionScore
                        scoreDisplay = scoreToDisplay(numericScore, base.score)
                    }
                }

                const reviewForHandle = matchedReview
                const resolvedScreenerId = reviewForHandle?.resourceId ?? base.screenerId
                const result = determinePassFail(numericScore, minPass, base.result, matchedReview?.metadata)

                const normalizeResourceId = (resourceIdValue: BackendReview['resourceId']): string => {
                    if (typeof resourceIdValue === 'string') {
                        return resourceIdValue.trim()
                    }

                    if (resourceIdValue === undefined || resourceIdValue === null) {
                        return ''
                    }

                    return `${resourceIdValue}`.trim()
                }

                const matchesMyAssignment = (review?: BackendReview): review is BackendReview => {
                    if (!review) {
                        return false
                    }

                    if (review.submissionId !== item.id) {
                        return false
                    }

                    if (!reviewMatchesPhase(review, screeningScorecardId, screeningPhaseIds, 'Screening')) {
                        return false
                    }

                    const resourceId = normalizeResourceId(review.resourceId)
                    if (!resourceId) {
                        return false
                    }

                    return myScreeningReviewerResourceIds.has(resourceId)
                }

                let myAssignment = challengeReviews?.find(matchesMyAssignment)

                if (!myAssignment && item.reviewResourceMapping) {
                    myAssignment = Object.values(item.reviewResourceMapping)
                        .find(matchesMyAssignment)
                }

                if (!myAssignment && Array.isArray(item.review)) {
                    myAssignment = (item.review ?? []).find(matchesMyAssignment)
                }

                const defaultScreener = {
                    handleColor: '#2a2a2a',
                    memberHandle: 'Not assigned',
                } as BackendResource

                const screenerDisplay = (() => {
                    if (resolvedScreenerId) {
                        const resourceMatch = (resources ?? []).find(resource => resource.id === resolvedScreenerId)
                        if (resourceMatch) {
                            return resourceMatch
                        }

                        const assignmentReview = item.reviewResourceMapping?.[resolvedScreenerId]
                        const handleFromAssignment = buildResourceFromReviewHandle(assignmentReview)
                        if (handleFromAssignment) {
                            return handleFromAssignment
                        }
                    }

                    const handleFromMatchedReview = buildResourceFromReviewHandle(reviewForHandle)
                    if (handleFromMatchedReview) {
                        return handleFromMatchedReview
                    }

                    return defaultScreener
                })()

                return {
                    ...base,
                    myReviewId: myAssignment?.id,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    phaseName: matchedReview?.phaseName ?? undefined,
                    result,
                    reviewId: matchedReview?.id,
                    reviewPhaseId: resolveReviewPhaseId(matchedReview),
                    reviewStatus: matchedReview?.status ?? undefined,
                    score: scoreDisplay,
                    screener: screenerDisplay,
                    screenerId: screenerDisplay?.id ?? resolvedScreenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
        },
        [
            challengeReviews,
            resourceMemberIdMapping,
            screeningScorecardBase?.minimumPassingScore,
            screeningPhaseIds,
            screeningScorecardId,
            contestSubmissions,
            resources,
            myResources,
        ],
    )

    // Build checkpoint rows if checkpoint submissions and reviews exist
    const checkpoint = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        const matchedReviewDebugRows: Array<{
            metadataPreview: string
            phaseId: string | number | undefined
            reviewId: string | undefined
            scorecardId: string | undefined
            submissionId: string
            typeId: string | undefined
        }> = []

        const totalReviewsEvaluated = challengeReviews?.length ?? 0

        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                const matches = reviewMatchesPhase(
                    rv,
                    checkpointScreeningScorecardId,
                    checkpointScreeningPhaseIds,
                    'Checkpoint Screening',
                )

                if (matches) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                    if (debugCheckpointPhases) {
                        matchedReviewDebugRows.push({
                            metadataPreview: truncateForLog(normalizeReviewMetadata(rv.metadata)),
                            phaseId: rv.phaseId,
                            reviewId: rv.id,
                            scorecardId: rv.scorecardId,
                            submissionId: rv.submissionId,
                            typeId: rv.typeId ?? undefined,
                        })
                    }
                }
            })
        }

        if (debugCheckpointPhases) {
            debugLog('checkpointScreening.matches', {
                matchedReviewCount: matchedReviewDebugRows.length,
                matchedReviews: matchedReviewDebugRows,
                reviewMapBySubmission: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                totalReviewsEvaluated,
            })
        }

        const minPass = checkpointScreeningScorecardBase?.minimumPassingScore ?? undefined

        // Resolve a challenge-level Checkpoint Screener (if any) for handle display
        const checkpointScreenerResource = (resources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')

        // Current viewer's Checkpoint Screener resource id (if they have this role)
        const myCheckpointScreenerResourceId = (myResources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')?.id

        const checkpointRows = checkpointSubmissions
            // eslint-disable-next-line complexity
            .map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const candidateReviews = collectMatchingReviews(
                    item,
                    'Checkpoint Screening',
                    checkpointScreeningScorecardId,
                    checkpointScreeningPhaseIds,
                    checkpointReviewsBySubmission,
                    challengeReviews,
                )
                const matchedReview = selectBestReview(
                    candidateReviews,
                    'Checkpoint Screening',
                    checkpointScreeningScorecardId,
                    checkpointScreeningPhaseIds,
                    item,
                )

                let numericScore = getNumericScore(matchedReview)

                if (numericScore === undefined && matchedReview) {
                    const reviewStatus = (matchedReview.status || '').toUpperCase()
                    if (reviewStatus === 'COMPLETED' || reviewStatus === 'SUBMITTED') {
                        const submissionScore = parseSubmissionScore(item.screeningScore)
                        if (submissionScore !== undefined) {
                            numericScore = submissionScore
                        }
                    }
                }

                const scoreDisplay = scoreToDisplay(numericScore, base.score)

                let screenerId: string | undefined = base.screenerId
                if (matchedReview?.resourceId) {
                    screenerId = matchedReview.resourceId
                }

                const result = determinePassFail(numericScore, minPass, base.result, matchedReview?.metadata)
                const defaultScreener = {
                    handleColor: '#2a2a2a',
                    memberHandle: 'Not assigned',
                } as BackendResource

                const assignmentReview = screenerId
                    ? item.reviewResourceMapping?.[screenerId]
                    : undefined
                const handleFromAssignment = buildResourceFromReviewHandle(assignmentReview)
                const handleFromMatchedReview = buildResourceFromReviewHandle(matchedReview)

                // Prefer review assignment handle, then challenge-level screener, otherwise Not assigned.
                const screenerDisplay = ((): BackendResource => {
                    if (screenerId) {
                        const resourceMatch = (resources ?? []).find(x => x.id === screenerId)
                        if (resourceMatch) {
                            return resourceMatch
                        }

                        if (handleFromAssignment) {
                            return handleFromAssignment
                        }
                    }

                    if (handleFromMatchedReview) {
                        return handleFromMatchedReview
                    }

                    if (checkpointScreenerResource) {
                        return checkpointScreenerResource
                    }

                    return defaultScreener
                })()

                // Find a pending/in-progress assignment for current viewer (if any)
                const myAssignment
                    = (myCheckpointScreenerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                        && rv.resourceId === myCheckpointScreenerResourceId
                        && reviewMatchesPhase(
                            rv,
                            checkpointScreeningScorecardId,
                            checkpointScreeningPhaseIds,
                            'Checkpoint Screening',
                        )
                        ))
                        : undefined

                return {
                    ...base,
                    myReviewId: myAssignment?.id,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    reviewId: matchedReview?.id,
                    reviewPhaseId: resolveReviewPhaseId(matchedReview),
                    reviewStatus: matchedReview?.status ?? undefined,
                    score: scoreDisplay,
                    screener: screenerDisplay,
                    screenerId: screenerDisplay?.id || screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })

        if (debugCheckpointPhases) {
            debugLog('checkpointScreening.results', {
                checkpointRowCount: checkpointRows.length,
                matchedReviewsSummary: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                rows: checkpointRows.map(row => ({
                    result: row.result,
                    reviewId: row.reviewId,
                    score: row.score,
                    screenerId: row.screenerId,
                    submissionId: row.submissionId,
                })),
            })
        }

        return checkpointRows
    }, [
        challengeReviews,
        checkpointScreeningScorecardId,
        checkpointScreeningScorecardBase?.minimumPassingScore,
        checkpointScreeningPhaseIds,
        debugCheckpointPhases,
        resourceMemberIdMapping,
        resources,
        myResources,
        checkpointSubmissions,
    ])

    // Build checkpoint review rows if checkpoint review submissions and reviews exist
    const checkpointReview = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        const matchedReviewDebugRows: Array<{
            metadataPreview: string
            phaseId: string | number | undefined
            reviewId: string | undefined
            scorecardId: string | undefined
            submissionId: string
            typeId: string | undefined
        }> = []

        const totalReviewsEvaluated = challengeReviews?.length ?? 0

        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                const matches = reviewMatchesPhase(
                    rv,
                    checkpointReviewScorecardId,
                    checkpointReviewPhaseIds,
                    'Checkpoint Review',
                )

                if (matches) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                    if (debugCheckpointPhases) {
                        matchedReviewDebugRows.push({
                            metadataPreview: truncateForLog(normalizeReviewMetadata(rv.metadata)),
                            phaseId: rv.phaseId,
                            reviewId: rv.id,
                            scorecardId: rv.scorecardId,
                            submissionId: rv.submissionId,
                            typeId: rv.typeId ?? undefined,
                        })
                    }
                }
            })
        }

        if (debugCheckpointPhases) {
            debugLog('checkpointReview.matches', {
                matchedReviewCount: matchedReviewDebugRows.length,
                matchedReviews: matchedReviewDebugRows,
                reviewMapBySubmission: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                totalReviewsEvaluated,
            })
        }

        const minPass = checkpointReviewScorecardBase?.minimumPassingScore ?? undefined

        const checkpointReviewerResources = (resources ?? [])
            .filter(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')
        const fallbackCheckpointReviewer = checkpointReviewerResources.length === 1
            ? checkpointReviewerResources[0]
            : undefined

        // Current viewer's Checkpoint Reviewer resource id (if they have this role)
        const myCheckpointReviewerResourceId = (myResources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint reviewer')?.id

        const checkpointReviewRows = checkpointSubmissions.reduce<Screening[]>((rows, item) => {
            const candidateReviews = collectMatchingReviews(
                item,
                'Checkpoint Review',
                checkpointReviewScorecardId,
                checkpointReviewPhaseIds,
                checkpointReviewsBySubmission,
                challengeReviews,
            )

            const fallbackReviewByPhaseName = candidateReviews.length
                ? undefined
                : (item.review ?? []).find(review => (
                    typeof review?.phaseName === 'string'
                    && review.phaseName.trim()
                        .toLowerCase() === 'checkpoint review'
                ))

            logCheckpointReviewSubmissionDebug({
                candidateReviews,
                checkpointReviewPhaseIds,
                checkpointReviewScorecardId,
                debugEnabled: debugCheckpointPhases,
                fallbackReviewByPhaseName,
                submission: item,
            })

            const base = convertBackendSubmissionToScreening(item)
            const myAssignment
                = (myCheckpointReviewerResourceId && challengeReviews)
                    ? challengeReviews.find(rv => (
                        rv.submissionId === item.id
                        && rv.resourceId === myCheckpointReviewerResourceId
                        && reviewMatchesPhase(
                            rv,
                            checkpointReviewScorecardId,
                            checkpointReviewPhaseIds,
                            'Checkpoint Review',
                        )
                    ))
                    : undefined

            const reviewsToRender: Array<BackendReview | undefined> = candidateReviews.length
                ? candidateReviews
                : [fallbackReviewByPhaseName]

            const rowsForSubmission = buildCheckpointReviewRowsForSubmission({
                base,
                fallbackCheckpointReviewer,
                item,
                minPass,
                myAssignment,
                resourceMemberIdMapping,
                resources,
                reviewEntries: reviewsToRender,
            })

            const hasCheckpointReview = rowsForSubmission.some(row => Boolean(row.reviewId))
            const submissionStatus = (item.status ?? '')
                .toString()
                .trim()
                .toUpperCase()
            const failedCheckpointScreening = submissionStatus === 'FAILED_CHECKPOINT_SCREENING'

            if (failedCheckpointScreening && !hasCheckpointReview) {
                if (debugCheckpointPhases) {
                    debugLog('checkpointReview.skipSubmission', {
                        reason: 'failedCheckpointScreeningWithoutReview',
                        submissionId: item.id,
                        submissionStatus,
                    })
                }

                return rows
            }

            rows.push(...rowsForSubmission)

            return rows
        }, [])

        if (debugCheckpointPhases) {
            debugLog('checkpointReview.results', {
                checkpointReviewRowCount: checkpointReviewRows.length,
                matchedReviewsSummary: Array.from(checkpointReviewsBySubmission.entries())
                    .map(([submissionId, review]) => ({
                        phaseId: review?.phaseId,
                        reviewId: review?.id,
                        scorecardId: review?.scorecardId,
                        submissionId,
                        typeId: review?.typeId,
                    })),
                rows: checkpointReviewRows.map(row => ({
                    result: row.result,
                    reviewId: row.reviewId,
                    score: row.score,
                    screenerId: row.screenerId,
                    submissionId: row.submissionId,
                })),
            })
        }

        return checkpointReviewRows
    }, [
        challengeReviews,
        checkpointReviewScorecardId,
        checkpointReviewScorecardBase?.minimumPassingScore,
        checkpointReviewPhaseIds,
        debugCheckpointPhases,
        myResources,
        resources,
        resourceMemberIdMapping,
        checkpointSubmissions,
    ])

    useEffect(() => {
        if (!debugCheckpointPhases) {
            return
        }

        const reviewById = new Map<string, BackendReview>()
        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, reviewItem => {
                if (reviewItem?.id) {
                    reviewById.set(reviewItem.id, reviewItem)
                }
            })
        }

        const checkpointReviewIds = new Set(
            checkpoint
                .map(item => item.reviewId)
                .filter((id): id is string => Boolean(id)),
        )
        const checkpointReviewTabIds = new Set(
            checkpointReview
                .map(item => item.reviewId)
                .filter((id): id is string => Boolean(id)),
        )

        const overlappingReviewIds = Array.from(checkpointReviewIds)
            .filter(id => checkpointReviewTabIds.has(id))

        const miscategorizedCheckpoint = checkpoint
            .map(entry => {
                const review = entry.reviewId ? reviewById.get(entry.reviewId) : undefined
                return { entry, review }
            })
            .filter(({ review }: { review: BackendReview | undefined }) => (
                Boolean(review && (review.typeId || '').toLowerCase()
                    .includes('checkpoint review'))
            ))

        const miscategorizedCheckpointReview = checkpointReview
            .map(entry => {
                const review = entry.reviewId ? reviewById.get(entry.reviewId) : undefined
                return { entry, review }
            })
            .filter(({ review }: { review: BackendReview | undefined }) => (
                Boolean(review && (review.typeId || '').toLowerCase()
                    .includes('checkpoint screening'))
            ))

        const formatReviewDetails = (
            review: BackendReview | undefined,
        ): Record<string, unknown> | undefined => (
            review
                ? {
                    id: review.id,
                    metadataPreview: truncateForLog(normalizeReviewMetadata(review.metadata)),
                    phaseId: review.phaseId,
                    scorecardId: review.scorecardId,
                    typeId: review.typeId ?? undefined,
                }
                : undefined
        )

        const payload: Record<string, unknown> = {
            checkpointMismatches: miscategorizedCheckpoint.map(
                ({ entry, review }: { entry: Screening; review: BackendReview | undefined }) => ({
                    checkpointEntry: {
                        result: entry.result,
                        reviewId: entry.reviewId,
                        submissionId: entry.submissionId,
                    },
                    review: formatReviewDetails(review),
                }),
            ),
            checkpointReviewMismatches: miscategorizedCheckpointReview.map(
                ({ entry, review }: { entry: Screening; review: BackendReview | undefined }) => ({
                    checkpointReviewEntry: {
                        result: entry.result,
                        reviewId: entry.reviewId,
                        submissionId: entry.submissionId,
                    },
                    review: formatReviewDetails(review),
                }),
            ),
            overlappingReviewCount: overlappingReviewIds.length,
            overlappingReviewIds,
            totalCheckpointEntries: checkpoint.length,
            totalCheckpointReviewEntries: checkpointReview.length,
        }

        const recommendations: string[] = []

        miscategorizedCheckpoint.forEach(({ review }: { review: BackendReview | undefined }) => {
            if (review?.id) {
                recommendations.push(
                    `Review ${review.id} (typeId: ${review.typeId ?? 'unknown'}) appears in checkpoint data `
                    + 'but matches Checkpoint Review criteria.',
                )
            }
        })

        miscategorizedCheckpointReview.forEach(({ review }: { review: BackendReview | undefined }) => {
            if (review?.id) {
                recommendations.push(
                    `Review ${review.id} (typeId: ${review.typeId ?? 'unknown'}) appears in checkpoint review data `
                    + 'but matches Checkpoint Screening criteria.',
                )
            }
        })

        if (recommendations.length) {
            payload.recommendations = recommendations
        }

        if (
            overlappingReviewIds.length
            || miscategorizedCheckpoint.length
            || miscategorizedCheckpointReview.length
        ) {
            warnLog('checkpointCrossReference', payload)
        } else {
            debugLog('checkpointCrossReference', {
                ...payload,
                message: 'Checkpoint and Checkpoint Review data sets are distinct with no misclassifications detected.',
            })
        }
    }, [
        challengeReviews,
        checkpoint,
        checkpointReview,
        debugCheckpointPhases,
    ])

    const submitterReviewEntries = useMemo<BackendReview[]>(() => {
        if (actionChallengeRole !== SUBMITTER) {
            return challengeReviews ?? []
        }

        const allowedReviewerIds = reviewerIds.length ? new Set(reviewerIds) : undefined

        if (challengeReviews && challengeReviews.length) {
            const filteredReviews = (challengeReviews ?? []).filter(review => {
                if (!review) {
                    return false
                }

                if (!isPhaseAllowedForReview(review.phaseName)) {
                    return false
                }

                if (allowedReviewerIds?.size) {
                    return Boolean(
                        review.resourceId && allowedReviewerIds.has(review.resourceId),
                    )
                }

                return true
            })

            if (filteredReviews.length) {
                return filteredReviews
            }
        }

        const fallbackReviews: BackendReview[] = []
        forEach(visibleChallengeSubmissions, submission => {
            forEach(submission.review, reviewItem => {
                if (!isPhaseAllowedForReview(reviewItem?.phaseName)) {
                    return
                }

                const resourceId = reviewItem?.resourceId
                if (allowedReviewerIds?.size) {
                    if (!resourceId || !allowedReviewerIds.has(resourceId)) {
                        return
                    }
                }

                if (reviewItem?.id) {
                    fallbackReviews.push({
                        ...reviewItem,
                        legacySubmissionId: reviewItem.legacySubmissionId || submission.legacySubmissionId,
                        submissionId: reviewItem.submissionId || submission.id,
                    })
                }
            })
        })

        if (fallbackReviews.length) {
            return fallbackReviews
        }

        const filteredByPhase = (challengeReviews ?? []).filter(review => (
            review ? isPhaseAllowedForReview(review.phaseName) : false
        ))

        return filteredByPhase
    }, [
        actionChallengeRole,
        challengeReviews,
        visibleChallengeSubmissions,
        reviewerIds,
    ])

    // get review data from challenge submissions
    const submitterReviews = useMemo(() => {
        if (actionChallengeRole !== SUBMITTER) {
            return []
        }

        if (!submitterReviewEntries.length) {
            return []
        }

        const memberId = loginUserInfo?.userId
            ? `${loginUserInfo.userId}`
            : ''
        const resolvedReviews = submitterReviewEntries
            .map((reviewItem, index) => {
                const matchingSubmission = resolveSubmissionForReview({
                    review: reviewItem,
                    submissionsById: visibleSubmissionsById,
                    submissionsByLegacyId: visibleSubmissionsByLegacyId,
                } satisfies SubmissionLookupArgs)

                const submissionType = matchingSubmission?.type?.trim()
                if (submissionType?.toUpperCase() !== 'CONTEST_SUBMISSION') {
                    return undefined
                }

                const submissionWithReview: BackendSubmission | undefined = matchingSubmission
                    ? {
                        ...matchingSubmission,
                        review: [reviewItem],
                    }
                    : undefined

                const baseSubmissionInfo = submissionWithReview
                    ? convertBackendSubmissionToSubmissionInfo(submissionWithReview)
                    : undefined

                const fallbackId = resolveFallbackSubmissionId({
                    baseSubmissionInfo,
                    defaultId: `${memberId || 'submission'}-${index}`,
                    matchingSubmission,
                    review: reviewItem,
                } satisfies SubmissionIdResolutionArgs)

                if (!fallbackId) {
                    return undefined
                }

                const resolvedMemberId = resolveSubmitterMemberId({
                    baseSubmissionInfo,
                    matchingSubmission,
                } satisfies SubmitterMemberIdResolutionArgs)

                const reviewInfo = convertBackendReviewToReviewInfo(reviewItem)
                const reviewResult = convertBackendReviewToReviewResult(reviewItem)

                return {
                    ...baseSubmissionInfo,
                    id: fallbackId,
                    isLatest: baseSubmissionInfo?.isLatest
                        ?? matchingSubmission?.isLatest
                        ?? true,
                    memberId: resolvedMemberId,
                    review: reviewInfo,
                    reviews: [reviewResult],
                    reviewTypeId: reviewItem.typeId ?? baseSubmissionInfo?.reviewTypeId,
                    submittedDate: baseSubmissionInfo?.submittedDate,
                    submittedDateString: baseSubmissionInfo?.submittedDateString,
                    userInfo: resolvedMemberId
                        ? resourceMemberIdMapping[resolvedMemberId]
                        : undefined,
                    virusScan: baseSubmissionInfo?.virusScan,
                } as SubmissionInfo
            })
            .filter((entry): entry is SubmissionInfo => Boolean(entry))

        return resolvedReviews
    }, [
        actionChallengeRole,
        loginUserInfo?.userId,
        resourceMemberIdMapping,
        visibleSubmissionsById,
        visibleSubmissionsByLegacyId,
        submitterReviewEntries,
    ])

    const review = useMemo(() => {
        const validReviews: BackendSubmission[] = []
        // Only show CONTEST_SUBMISSION on Review tabs
        forEach(contestSubmissions, challengeSubmission => {
            const normalizedReviewerIds = new Set<string>()
            const combinedReviewerIds: string[] = []
            const appendReviewerId = (value?: string | null): void => {
                if (typeof value !== 'string') {
                    return
                }

                const normalized = value.trim()
                if (!normalized || normalizedReviewerIds.has(normalized)) {
                    return
                }

                normalizedReviewerIds.add(normalized)
                combinedReviewerIds.push(normalized)
            }

            const matchesReviewPhase = (candidate: BackendReview | undefined): boolean => (
                reviewMatchesPhase(
                    candidate,
                    reviewScorecardId,
                    reviewPhaseIds,
                    'Review',
                )
                || reviewMatchesPhase(
                    candidate,
                    iterativeReviewScorecardId,
                    iterativeReviewPhaseIds,
                    'Iterative Review',
                )
            )

            reviewerIds.forEach(appendReviewerId)
            forEach(challengeSubmission.review, reviewEntry => {
                if (matchesReviewPhase(reviewEntry)) {
                    appendReviewerId(reviewEntry?.resourceId)
                }
            })

            forEach(combinedReviewerIds, reviewerId => {
                const matchingReview = challengeSubmission.review?.find(
                    r => r.resourceId === reviewerId && matchesReviewPhase(r),
                )
                const assignmentReviewCandidate
                    = reviewAssignmentsBySubmission[challengeSubmission.id]?.[reviewerId]
                const assignmentReview = matchesReviewPhase(assignmentReviewCandidate)
                    ? assignmentReviewCandidate
                    : undefined

                const normalizedReviewForResource = buildReviewForResource({
                    assignmentReview,
                    challengeReviewById,
                    challengeSubmission,
                    matchingReview,
                    reviewerId,
                })

                validReviews.push({
                    ...challengeSubmission,
                    review: [normalizedReviewForResource],
                    reviewResourceMapping: {
                        ...(challengeSubmission.reviewResourceMapping ?? {}),
                        [reviewerId]: normalizedReviewForResource,
                    },
                })
            })
        })
        return validReviews.map(item => {
            const result = convertBackendSubmissionToSubmissionInfo(item)

            return {
                ...result,
                userInfo: resourceMemberIdMapping[result.memberId],
            }
        })
    }, [
        challengeReviewById,
        contestSubmissions,
        iterativeReviewPhaseIds,
        iterativeReviewScorecardId,
        resourceMemberIdMapping,
        reviewerIds,
        reviewAssignmentsBySubmission,
        reviewPhaseIds,
        reviewScorecardId,
    ])

    // Build approval reviews list (one entry per approval review instance)
    const approvalReviews = useMemo<SubmissionInfo[]>(() => {
        if (!challengeReviews?.length || approvalPhaseIds.size === 0) {
            return []
        }

        const result: SubmissionInfo[] = []

        forEach(challengeReviews, reviewEntry => {
            if (!reviewEntry) {
                return
            }

            if (!reviewMatchesPhase(reviewEntry, approvalScorecardId, approvalPhaseIds, 'Approval')) {
                return
            }

            const matchingSubmission = resolveSubmissionForReview({
                review: reviewEntry,
                submissionsById: visibleSubmissionsById,
                submissionsByLegacyId: visibleSubmissionsByLegacyId,
            } satisfies SubmissionLookupArgs)

            if (!matchingSubmission) {
                return
            }

            const submissionWithReview: BackendSubmission = {
                ...matchingSubmission,
                review: [reviewEntry],
            }

            const submissionInfo = convertBackendSubmissionToSubmissionInfo(submissionWithReview)

            result.push({
                ...submissionInfo,
                review: submissionInfo.review ?? convertBackendReviewToReviewInfo(reviewEntry),
                reviews: [convertBackendReviewToReviewResult(reviewEntry)],
                userInfo: resourceMemberIdMapping[submissionInfo.memberId],
            })
        })

        return result
    }, [
        approvalPhaseIds,
        approvalScorecardId,
        challengeReviews,
        resourceMemberIdMapping,
        visibleSubmissionsById,
        visibleSubmissionsByLegacyId,
    ])

    // Build post-mortem reviews list (for Topgear Task challenges)
    const postMortemReviews = useMemo<SubmissionInfo[]>(() => {
        if (!challengeReviews?.length || postMortemPhaseIds.size === 0) {
            return []
        }

        const submissionsById = new Map(visibleChallengeSubmissions.map(s => [s.id, s]))
        const allowedReviewerIds = new Set(reviewerIds)
        const result: SubmissionInfo[] = []

        const shouldIncludeReview = (candidate: BackendReview | undefined): boolean => {
            if (!candidate) {
                return false
            }

            const candidatePhaseId = candidate.phaseId !== undefined && candidate.phaseId !== null
                ? `${candidate.phaseId}`
                : undefined
            if (!candidatePhaseId || !postMortemPhaseIds.has(candidatePhaseId)) {
                return false
            }

            if (allowedReviewerIds.size > 0 && !allowedReviewerIds.has(candidate.resourceId)) {
                return false
            }

            return reviewMatchesPhase(
                candidate,
                postMortemScorecardId,
                postMortemPhaseIds,
                'Post-Mortem',
            )
        }

        forEach(challengeReviews, rv => {
            if (!shouldIncludeReview(rv)) return
            const submission = rv.submissionId ? submissionsById.get(rv.submissionId) : undefined
            const reviewInfo = convertBackendReviewToReviewInfo(rv)
            const reviewResult = convertBackendReviewToReviewResult(rv)
            const resolvedSubmissionId = submission?.id
                ?? (rv.submissionId ? `${rv.submissionId}` : rv.id)
                ?? `${rv.resourceId ?? 'post-mortem'}`
            const resolvedMemberId = submission?.memberId ?? 'post-mortem'
            const resolvedUserInfo = submission
                ? resourceMemberIdMapping[submission.memberId]
                : undefined

            result.push({
                id: resolvedSubmissionId,
                memberId: resolvedMemberId,
                review: reviewInfo,
                reviews: [reviewResult],
                reviewTypeId: rv.typeId ?? 'post-mortem',
                userInfo: resolvedUserInfo,
            })
        })

        return result
    }, [
        challengeReviews,
        postMortemPhaseIds,
        postMortemScorecardId,
        resourceMemberIdMapping,
        reviewerIds,
        visibleChallengeSubmissions,
    ])

    useEffect(() => {
        const reviewSources: SubmissionInfo[] = actionChallengeRole === SUBMITTER
            ? submitterReviews
            : review
        const processed = new Set<string>()

        forEach<SubmissionInfo>(reviewSources, item => {
            const reviewId = item.review?.id

            if (reviewId && !processed.has(reviewId)) {
                loadResourceAppeal(reviewId)
                processed.add(reviewId)
            }
        })
    }, [actionChallengeRole, loadResourceAppeal, review, submitterReviews])

    // get review progress from challenge review
    const reviewProgress = useMemo(() => {
        if (!review.length) {
            return 0
        }

        const eligibleReviews = review.filter(submission => shouldIncludeInReviewPhase(
            submission,
            challengeInfo?.phases,
        ))
        if (!eligibleReviews.length) {
            return 0
        }

        const isDesignChallenge = challengeInfo?.track?.name === DESIGN

        const filteredReviews = isDesignChallenge
            ? eligibleReviews
            : eligibleReviews.filter(item => item.isLatest)

        if (!filteredReviews.length) {
            return 0
        }

        const completedReviews = filteredReviews.filter(item => {
            const committed = item.review?.committed
            if (typeof committed === 'boolean') {
                return committed
            }

            const status = item.review?.status
            if (typeof status === 'string' && status.trim()) {
                return status.trim()
                    .toUpperCase() === 'COMPLETED'
            }

            if (!item.reviews?.length) {
                return false
            }

            return every(
                item.reviews,
                reviewResult => typeof reviewResult.score === 'number'
                    && Number.isFinite(reviewResult.score),
            )
        })

        return Math.round(
            (completedReviews.length * 100) / filteredReviews.length,
        )
    }, [review, challengeInfo?.phases, challengeInfo?.track?.name])

    useEffect(() => () => {
        cancelLoadResourceAppeal()
    }, [cancelLoadResourceAppeal])

    const shouldAwaitSubmitterReviews = actionChallengeRole === SUBMITTER
        ? false
        : (isValidatingChallengeReviews && visibleChallengeSubmissions.length > 0)

    return {
        approvalMinimumPassingScore: approvalScorecardBase?.minimumPassingScore,
        approvalReviews,
        checkpoint,
        checkpointReview,
        checkpointReviewMinimumPassingScore: checkpointReviewScorecardBase?.minimumPassingScore,
        checkpointScreeningMinimumPassingScore: checkpointScreeningScorecardBase?.minimumPassingScore,
        isLoading: isLoading || shouldAwaitSubmitterReviews,
        mappingReviewAppeal,
        postMortemMinimumPassingScore: postMortemScorecardBase?.minimumPassingScore,
        postMortemReviews,
        review,
        reviewMinimumPassingScore: reviewScorecardBase?.minimumPassingScore,
        reviewProgress,
        screening,
        screeningMinimumPassingScore: screeningScorecardBase?.minimumPassingScore,
        submitterReviews,
    }
}

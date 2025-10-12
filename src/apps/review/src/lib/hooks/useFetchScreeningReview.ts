import { every, filter, forEach } from 'lodash'
import { useContext, useEffect, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared'

import { REVIEWER, SUBMITTER } from '../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import {
    BackendPhase,
    BackendResource,
    BackendReview,
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendReviewToReviewInfo,
    convertBackendReviewToReviewResult,
    convertBackendSubmissionToScreening,
    convertBackendSubmissionToSubmissionInfo,
    createEmptyBackendReview,
    MappingReviewAppeal,
    ReviewAppContextModel,
    Screening,
    SubmissionInfo,
} from '../models'
import { fetchChallengeReviews } from '../services'

import { useFetchAppealQueue, useFetchAppealQueueProps } from './useFetchAppealQueue'
import { useFetchChallengeSubmissions, useFetchChallengeSubmissionsProps } from './useFetchChallengeSubmissions'
import { useRole, useRoleProps } from './useRole'
import { useSubmissionDownloadAccess } from './useSubmissionDownloadAccess'
import type { UseSubmissionDownloadAccessResult } from './useSubmissionDownloadAccess'

type ReviewerPhaseConfig = {
    scorecardId?: string
    phaseId?: string | number
    type?: string
}

// Local helpers
function getNumericScore(review: BackendReview | undefined): number | undefined {
    if (!review) return undefined
    if (Number.isFinite(review.finalScore)) return review.finalScore
    if (Number.isFinite(review.initialScore)) return review.initialScore
    return undefined
}

function scoreToDisplay(numericScore: number | undefined, fallback: string | undefined): string {
    if (typeof numericScore === 'number') {
        return numericScore.toFixed(2)
    }

    return fallback ?? 'Pending'
}

function determinePassFail(
    numericScore: number | undefined,
    minPass: number | null | undefined,
    baseResult: Screening['result'],
): Screening['result'] {
    if (typeof numericScore === 'number' && typeof minPass === 'number') {
        return numericScore >= minPass ? 'PASS' : 'NO PASS'
    }

    return baseResult
}

function collectPhaseIdsForName(
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    phaseName: string,
): Set<string> {
    const normalizedPhaseName = phaseName.toLowerCase()
    const ids = new Set<string>()

    phases?.forEach(phase => {
        if ((phase.name || '').toLowerCase() === normalizedPhaseName) {
            if (phase.phaseId) {
                ids.add(`${phase.phaseId}`)
            }

            if (phase.id) {
                ids.add(`${phase.id}`)
            }
        }
    })

    reviewers?.forEach(reviewer => {
        const matchesType = (reviewer.type || '').toLowerCase() === normalizedPhaseName
        const hasPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
        if (matchesType && hasPhaseId) {
            ids.add(`${reviewer.phaseId}`)
        }
    })

    return ids
}

function resolvePhaseMeta(
    phaseName: string,
    phases: BackendPhase[] | undefined,
    reviewers: ReviewerPhaseConfig[] | undefined,
    reviews: BackendReview[] | undefined,
): { scorecardId?: string; phaseIds: Set<string> } {
    const normalizedPhaseName = phaseName.toLowerCase()
    const phaseIds = collectPhaseIdsForName(phases, reviewers, phaseName)

    const reviewMatch = reviews?.find(review => {
        if (!review?.scorecardId) {
            return false
        }

        const reviewPhaseId = review.phaseId ? `${review.phaseId}` : undefined
        if (reviewPhaseId && phaseIds.has(reviewPhaseId)) {
            return true
        }

        return false
    })

    if (reviewMatch?.scorecardId) {
        if (reviewMatch.phaseId) {
            phaseIds.add(`${reviewMatch.phaseId}`)
        }

        return { phaseIds, scorecardId: reviewMatch.scorecardId }
    }

    const reviewerMatch = reviewers?.find(reviewer => {
        if (!reviewer?.scorecardId) {
            return false
        }

        const reviewerPhaseId = reviewer.phaseId !== undefined && reviewer.phaseId !== null
            ? `${reviewer.phaseId}`
            : undefined
        if (reviewerPhaseId && phaseIds.has(reviewerPhaseId)) {
            return true
        }

        return (reviewer.type || '').toLowerCase() === normalizedPhaseName
    })

    if (reviewerMatch?.scorecardId) {
        if (reviewerMatch.phaseId !== undefined && reviewerMatch.phaseId !== null) {
            phaseIds.add(`${reviewerMatch.phaseId}`)
        }

        return { phaseIds, scorecardId: reviewerMatch.scorecardId }
    }

    const matchingPhase = phases?.find(
        phase => (phase.name || '').toLowerCase() === normalizedPhaseName,
    )
    const constraintValue = matchingPhase
        ? matchingPhase.constraints?.find(constraint => constraint.name === 'Scorecard')?.value
        : undefined

    if (constraintValue) {
        return { phaseIds, scorecardId: `${constraintValue}` }
    }

    return { phaseIds }
}

function reviewMatchesPhase(
    review: BackendReview | undefined,
    scorecardId: string | undefined,
    phaseIds: Set<string>,
): boolean {
    if (!review) {
        return false
    }

    const matchesScorecard = Boolean(scorecardId && review.scorecardId === scorecardId)
    const reviewPhaseId = review.phaseId ? `${review.phaseId}` : undefined
    const matchesPhase = Boolean(reviewPhaseId && phaseIds.has(reviewPhaseId))

    return matchesScorecard || matchesPhase
}

export interface useFetchScreeningReviewProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    // screening data
    screening: Screening[]
    // checkpoint data (if any)
    checkpoint: Screening[]
    // checkpoint review data (if any)
    checkpointReview: Screening[]
    // review data
    review: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    // approval reviews (one entry per approval review instance)
    approvalReviews: SubmissionInfo[]
    // post-mortem reviews (one entry per post-mortem instance)
    postMortemReviews: SubmissionInfo[]
    isLoading: boolean
    reviewProgress: number
}

/**
 * Fetch screening and review data
 * @returns challenge screening and review data
 */
export function useFetchScreeningReview(): useFetchScreeningReviewProps {
    const { actionChallengeRole }: useRoleProps = useRole()

    const {
        loginUserInfo,
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

    // fetch challenge submissions
    const {
        challengeSubmissions: allChallengeSubmissions,
        isLoading,
    }: useFetchChallengeSubmissionsProps = useFetchChallengeSubmissions(challengeId)

    const {
        currentMemberId,
        shouldRestrictSubmitterToOwnSubmission,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const visibleChallengeSubmissions = useMemo<BackendSubmission[]>(
        () => {
            if (!shouldRestrictSubmitterToOwnSubmission) {
                return allChallengeSubmissions
            }

            if (!currentMemberId) {
                return []
            }

            return allChallengeSubmissions.filter(
                submission => submission.memberId === currentMemberId,
            )
        },
        [
            allChallengeSubmissions,
            currentMemberId,
            shouldRestrictSubmitterToOwnSubmission,
        ],
    )

    const visibleSubmissionIds = useMemo(
        () => new Set(visibleChallengeSubmissions.map(submission => submission.id)),
        [visibleChallengeSubmissions],
    )

    // Subsets by submission type for tab-specific displays
    const contestSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(s => (s.type || '').toUpperCase() === 'CONTEST_SUBMISSION'),
        [visibleChallengeSubmissions],
    )
    const finalFixSubmissions = useMemo(
        () => visibleChallengeSubmissions.filter(s => (s.type || '').toUpperCase() === 'STUDIO_FINAL_FIX_SUBMISSION'),
        [visibleChallengeSubmissions],
    )

    // Get list of reviewer ids
    const reviewerIds = useMemo(() => {
        let results: string[] = []

        if (challengeReviewers && challengeReviewers.length) {
            results = (
                actionChallengeRole === REVIEWER
                    ? filter(
                        challengeReviewers,
                        reviewer => reviewer.memberId === `${loginUserInfo?.userId}`,
                    )
                    : challengeReviewers
            ).map(reviewer => reviewer.id)
        }

        if (!results.length) {
            forEach(visibleChallengeSubmissions, challengeSubmission => {
                forEach(challengeSubmission.review, review => {
                    results.push(review.resourceId)
                })
            })
        }

        return results

    }, [
        challengeReviewers,
        visibleChallengeSubmissions,
        actionChallengeRole,
        loginUserInfo,
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

    const {
        data: challengeReviewsData,
        error: fetchChallengeReviewsError,
    }: SWRResponse<BackendReview[], Error> = useSWR<BackendReview[], Error>(
        `reviewBaseUrl/reviews/${challengeId}/${reviewerKey}`,
        {
            fetcher: () => fetchChallengeReviews(challengeId ?? ''),
            isPaused: () => !challengeId || !reviewerIds.length,
        },
    )

    const challengeReviews = useMemo(
        () => {
            if (!challengeReviewsData) {
                return challengeReviewsData
            }

            if (!shouldRestrictSubmitterToOwnSubmission) {
                return challengeReviewsData
            }

            return challengeReviewsData.filter(reviewItem => (
                visibleSubmissionIds.has(reviewItem.submissionId)
            ))
        },
        [
            challengeReviewsData,
            shouldRestrictSubmitterToOwnSubmission,
            visibleSubmissionIds,
        ],
    )

    // Resolve scorecard ids and phase ids for Screening / Checkpoint phases
    const screeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
        ),
        [challengeInfo?.phases, challengeInfo?.reviewers, challengeReviews],
    )
    const screeningScorecardId = screeningPhaseMeta.scorecardId
    const screeningPhaseIds = screeningPhaseMeta.phaseIds

    const checkpointScreeningPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Screening',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
        ),
        [challengeInfo?.phases, challengeInfo?.reviewers, challengeReviews],
    )
    const checkpointScreeningScorecardId = checkpointScreeningPhaseMeta.scorecardId
    const checkpointScreeningPhaseIds = checkpointScreeningPhaseMeta.phaseIds

    const checkpointReviewPhaseMeta = useMemo(
        () => resolvePhaseMeta(
            'Checkpoint Review',
            challengeInfo?.phases,
            challengeInfo?.reviewers,
            challengeReviews,
        ),
        [challengeInfo?.phases, challengeInfo?.reviewers, challengeReviews],
    )
    const checkpointReviewScorecardId = checkpointReviewPhaseMeta.scorecardId
    const checkpointReviewPhaseIds = checkpointReviewPhaseMeta.phaseIds

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

                if (!reviewerIds.includes(reviewItem.resourceId)) {
                    return
                }

                if (!mapping[reviewItem.submissionId]) {
                    mapping[reviewItem.submissionId] = {}
                }

                mapping[reviewItem.submissionId][reviewItem.resourceId] = reviewItem
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
                    if (reviewMatchesPhase(rv, screeningScorecardId, screeningPhaseIds)) {
                        screeningReviewsBySubmission.set(rv.submissionId, rv)
                    }
                })
            }

            const minPass = screeningScorecardBase?.minimumPassingScore ?? undefined
            // Current viewer's Screener resource id (if they have this role)
            const myScreenerResourceId = (myResources ?? [])
                .find(r => {
                    const n = (r.roleName || '').toLowerCase()
                    return n.includes('screener') && !n.includes('checkpoint')
                })?.id

            // Only show CONTEST_SUBMISSION on Submission/Screening tabs
            // eslint-disable-next-line complexity
            return contestSubmissions.map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = screeningReviewsBySubmission.get(item.id)
                const numericScore = getNumericScore(matchedReview)
                const scoreDisplay = scoreToDisplay(numericScore, base.score)

                const screenerId = matchedReview?.resourceId ?? base.screenerId
                const result = determinePassFail(numericScore, minPass, base.result)

                const myAssignment
                    = (myScreenerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                            && rv.resourceId === myScreenerResourceId
                            && reviewMatchesPhase(rv, screeningScorecardId, screeningPhaseIds)
                        ))
                        : undefined

                return {
                    ...base,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    score: scoreDisplay,
                    screener: screenerId
                        ? resourceMemberIdMapping[screenerId]
                        : ({ handleColor: '#2a2a2a', memberHandle: 'Not assigned' } as BackendResource),
                    screenerId,
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
        ],
    )

    // Build checkpoint rows if checkpoint submissions and reviews exist
    const checkpoint = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                if (reviewMatchesPhase(rv, checkpointScreeningScorecardId, checkpointScreeningPhaseIds)) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                }
            })
        }

        const minPass = checkpointScreeningScorecardBase?.minimumPassingScore ?? undefined

        // Resolve a challenge-level Checkpoint Screener (if any) for handle display
        const checkpointScreenerResource = (resources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')

        // Current viewer's Checkpoint Screener resource id (if they have this role)
        const myCheckpointScreenerResourceId = (myResources ?? [])
            .find(r => (r.roleName || '').toLowerCase() === 'checkpoint screener')?.id

        return visibleChallengeSubmissions
            .filter(s => (s.type || '').toUpperCase()
                .includes('CHECKPOINT'))
            // eslint-disable-next-line complexity
            .map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = checkpointReviewsBySubmission.get(item.id)
                const numericScore = getNumericScore(matchedReview)
                const scoreDisplay = scoreToDisplay(numericScore, base.score)

                let result = base.result
                let screenerId: string | undefined = base.screenerId
                if (matchedReview) {
                    screenerId = matchedReview.resourceId
                }

                if (typeof numericScore === 'number' && typeof minPass === 'number') {
                    result = numericScore >= minPass ? 'PASS' as const : 'NO PASS' as const
                }

                // Determine screener to display: review assignment screener -> challenge-level screener -> Not assigned
                const screenerDisplay = ((): BackendResource => {
                    if (screenerId) {
                        const r = (resources ?? []).find(x => x.id === screenerId)
                        if (r) return r
                    }

                    if (checkpointScreenerResource) return checkpointScreenerResource
                    return {
                        handleColor: '#2a2a2a',
                        memberHandle: 'Not assigned',
                    } as BackendResource
                })()

                // Find a pending/in-progress assignment for current viewer (if any)
                const myAssignment
                    = (myCheckpointScreenerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                        && rv.resourceId === myCheckpointScreenerResourceId
                        && reviewMatchesPhase(rv, checkpointScreeningScorecardId, checkpointScreeningPhaseIds)
                        ))
                        : undefined

                return {
                    ...base,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    score: scoreDisplay,
                    screener: screenerDisplay,
                    screenerId: screenerDisplay?.id || screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
    }, [
        challengeReviews,
        checkpointScreeningScorecardId,
        checkpointScreeningScorecardBase?.minimumPassingScore,
        checkpointScreeningPhaseIds,
        resourceMemberIdMapping,
        resources,
        myResources,
        visibleChallengeSubmissions,
    ])

    // Build checkpoint review rows if checkpoint review submissions and reviews exist
    const checkpointReview = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        if (challengeReviews && challengeReviews.length) {
            forEach(challengeReviews, rv => {
                if (reviewMatchesPhase(rv, checkpointReviewScorecardId, checkpointReviewPhaseIds)) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                }
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

        return visibleChallengeSubmissions
            .filter(s => (s.type || '').toUpperCase()
                .includes('CHECKPOINT'))
            .map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = checkpointReviewsBySubmission.get(item.id)
                const numericScore = getNumericScore(matchedReview)
                const scoreDisplay = scoreToDisplay(numericScore, 'Pending')

                const screenerId = matchedReview?.resourceId ?? base.screenerId
                const result = determinePassFail(numericScore, minPass, base.result)

                const myAssignment
                    = (myCheckpointReviewerResourceId && challengeReviews)
                        ? challengeReviews.find(rv => (
                            rv.submissionId === item.id
                            && rv.resourceId === myCheckpointReviewerResourceId
                            && reviewMatchesPhase(rv, checkpointReviewScorecardId, checkpointReviewPhaseIds)
                        ))
                        : undefined

                const reviewerDisplay = ((): BackendResource => {
                    if (screenerId) {
                        const resourceMatch = (resources ?? []).find(x => x.id === screenerId)
                        if (resourceMatch) {
                            return resourceMatch
                        }

                        if (matchedReview?.reviewerHandle) {
                            return {
                                handleColor: '#2a2a2a',
                                memberHandle: matchedReview.reviewerHandle,
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
                })()

                return {
                    ...base,
                    myReviewResourceId: myAssignment?.resourceId,
                    myReviewStatus: myAssignment?.status ?? undefined,
                    result,
                    score: scoreDisplay,
                    screener: reviewerDisplay,
                    screenerId: reviewerDisplay?.id || screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
    }, [
        challengeReviews,
        checkpointReviewScorecardId,
        checkpointReviewScorecardBase?.minimumPassingScore,
        checkpointReviewPhaseIds,
        myResources,
        resources,
        resourceMemberIdMapping,
        visibleChallengeSubmissions,
    ])

    // get review data from challenge submissions
    const submitterReviews = useMemo(() => {
        if (actionChallengeRole !== SUBMITTER) {
            return []
        }

        if (!challengeReviews) {
            return []
        }

        const memberId = loginUserInfo?.userId
            ? `${loginUserInfo.userId}`
            : ''
        const userInfo = memberId
            ? resourceMemberIdMapping[memberId]
            : undefined

        return challengeReviews.map(reviewItem => ({
            id: reviewItem.submissionId,
            memberId,
            review: convertBackendReviewToReviewInfo(reviewItem),
            reviews: [convertBackendReviewToReviewResult(reviewItem)],
            userInfo,
        }))
    }, [
        actionChallengeRole,
        challengeReviews,
        loginUserInfo?.userId,
        resourceMemberIdMapping,
    ])

    const review = useMemo(() => {
        const validReviews: BackendSubmission[] = []
        // Only show CONTEST_SUBMISSION on Review tabs
        forEach(contestSubmissions, challengeSubmission => {
            forEach(reviewerIds, reviewerId => {
                const matchingReview
                    = challengeSubmission.reviewResourceMapping?.[reviewerId]
                const assignmentReview
                    = reviewAssignmentsBySubmission[challengeSubmission.id]?.[reviewerId]

                let reviewForResource = matchingReview

                if (assignmentReview) {
                    if (reviewForResource) {
                        reviewForResource = {
                            ...reviewForResource,
                            committed: assignmentReview.committed,
                            id: assignmentReview.id,
                            reviewerHandle: assignmentReview.reviewerHandle,
                            reviewerMaxRating: assignmentReview.reviewerMaxRating,
                            status: assignmentReview.status,
                            submissionId: assignmentReview.submissionId,
                        }
                    } else {
                        reviewForResource = {
                            ...assignmentReview,
                            reviewItems: assignmentReview.reviewItems ?? [],
                        }
                    }
                }

                if (!reviewForResource) {
                    const emptyReview = {
                        ...createEmptyBackendReview(),
                        resourceId: reviewerId,
                        submissionId: challengeSubmission.id,
                    }
                    reviewForResource = emptyReview
                }

                validReviews.push({
                    ...challengeSubmission,
                    review: [reviewForResource],
                    reviewResourceMapping: {
                        ...(challengeSubmission.reviewResourceMapping ?? {}),
                        [reviewerId]: reviewForResource,
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
        contestSubmissions,
        resourceMemberIdMapping,
        reviewerIds,
        reviewAssignmentsBySubmission,
    ])

    // Build approval reviews list (one entry per approval review instance)
    const approvalReviews = useMemo<SubmissionInfo[]>(() => {
        const approvalPhaseIds = new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => (p.name || '').toLowerCase() === 'approval')
                .map(p => p.id),
        )

        if (!challengeReviews?.length || approvalPhaseIds.size === 0) {
            return []
        }

        // Only map to STUDIO_FINAL_FIX_SUBMISSION submissions for Approval tab
        const submissionsById = new Map(finalFixSubmissions.map(s => [s.id, s]))
        const result: SubmissionInfo[] = []

        forEach(challengeReviews, rv => {
            if (!rv) return
            if (!approvalPhaseIds.has(rv.phaseId)) return
            const submission = submissionsById.get(rv.submissionId)
            if (!submission) return

            const reviewInfo = convertBackendReviewToReviewInfo(rv)
            result.push({
                id: submission.id,
                memberId: submission.memberId,
                review: reviewInfo,
                reviews: [convertBackendReviewToReviewResult(rv)],
                userInfo: resourceMemberIdMapping[submission.memberId],
            })
        })

        return result
    }, [challengeInfo?.phases, challengeReviews, resourceMemberIdMapping, finalFixSubmissions])

    // Build post-mortem reviews list (for Topgear Task challenges)
    const postMortemReviews = useMemo<SubmissionInfo[]>(() => {
        const postMortemPhaseIds = new Set(
            (challengeInfo?.phases ?? [])
                .filter(p => ((p.name || '').toLowerCase()
                    .replace(/[^a-z]/g, '') === 'postmortem'))
                .map(p => p.id),
        )

        if (!challengeReviews?.length || postMortemPhaseIds.size === 0) {
            return []
        }

        const submissionsById = new Map(visibleChallengeSubmissions.map(s => [s.id, s]))
        const allowedReviewerIds = new Set(reviewerIds)
        const result: SubmissionInfo[] = []

        forEach(challengeReviews, rv => {
            if (!rv) return
            if (!postMortemPhaseIds.has(rv.phaseId)) return
            if (allowedReviewerIds.size > 0 && !allowedReviewerIds.has(rv.resourceId)) return
            const submission = submissionsById.get(rv.submissionId)
            if (!submission) return

            const reviewInfo = convertBackendReviewToReviewInfo(rv)
            result.push({
                id: submission.id,
                memberId: submission.memberId,
                review: reviewInfo,
                reviews: [convertBackendReviewToReviewResult(rv)],
                userInfo: resourceMemberIdMapping[submission.memberId],
            })
        })

        return result
    }, [challengeInfo?.phases, challengeReviews, resourceMemberIdMapping, visibleChallengeSubmissions])

    useEffect(() => {
        forEach(review, item => {
            const reviewId = item.review?.id

            if (reviewId) {
                loadResourceAppeal(reviewId)
            }
        })
    }, [loadResourceAppeal, review])

    // get review progress from challenge review
    const reviewProgress = useMemo(() => {
        if (!review.length) {
            return 0
        }

        const submittedReviewSubmissions = filter(review, item => {
            if (!item.reviews?.length) {
                return false
            }

            return every(item.reviews, reviewResult => !!reviewResult.score)
        })

        return Math.round(
            (submittedReviewSubmissions.length * 100) / review.length,
        )
    }, [review])

    useEffect(() => () => {
        cancelLoadResourceAppeal()
    }, [cancelLoadResourceAppeal])

    const shouldAwaitSubmitterReviews = (
        actionChallengeRole === SUBMITTER
        && challengeReviews === undefined
        && visibleChallengeSubmissions.length > 0
    )

    return {
        approvalReviews,
        checkpoint,
        checkpointReview,
        isLoading: isLoading || shouldAwaitSubmitterReviews,
        mappingReviewAppeal,
        postMortemReviews,
        review,
        reviewProgress,
        screening,
        submitterReviews,
    }
}

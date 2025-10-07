import { every, filter, find, forEach } from 'lodash'
import { useContext, useEffect, useMemo } from 'react'
import useSWR, { SWRResponse } from 'swr'

import { EnvironmentConfig } from '~/config'
import { xhrGetAsync } from '~/libs/core'
import { handleError } from '~/libs/shared'

import { REVIEWER, SUBMITTER } from '../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import {
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

export interface useFetchScreeningReviewProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    // screening data
    screening: Screening[]
    // checkpoint data (if any)
    checkpoint: Screening[]
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

    // Resolve scorecard ids for Screening and Checkpoint Review phases (if present)
    const screeningScorecardId = useMemo<string | undefined>(() => {
        const screeningPhase = challengeInfo?.phases?.find(
            p => (p.name || '').toLowerCase() === 'screening',
        )
        const scorecardConstraint = screeningPhase
            ? find(screeningPhase.constraints ?? [], c => c.name === 'Scorecard')
            : undefined
        return scorecardConstraint ? `${scorecardConstraint.value}` : undefined
    }, [challengeInfo?.phases])

    const checkpointReviewScorecardId = useMemo<string | undefined>(() => {
        const cpReviewPhase = challengeInfo?.phases?.find(
            p => (p.name || '').toLowerCase() === 'checkpoint review',
        )
        const scorecardConstraint = cpReviewPhase
            ? find(cpReviewPhase.constraints ?? [], c => c.name === 'Scorecard')
            : undefined
        return scorecardConstraint ? `${scorecardConstraint.value}` : undefined
    }, [challengeInfo?.phases])

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
        data: checkpointScorecardBase,
    }: SWRResponse<ScorecardBase | undefined, Error> = useSWR<ScorecardBase | undefined, Error>(
        `EnvironmentConfig.API.V6/scorecards/checkpoint/${checkpointReviewScorecardId || ''}`,
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
            if (challengeReviews && screeningScorecardId) {
                forEach(challengeReviews, rv => {
                    if (rv && rv.scorecardId === screeningScorecardId) {
                        screeningReviewsBySubmission.set(rv.submissionId, rv)
                    }
                })
            }

            const minPass = screeningScorecardBase?.minimumPassingScore ?? undefined

            return visibleChallengeSubmissions.map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = screeningReviewsBySubmission.get(item.id)
                const numericScore: number | undefined = matchedReview
                    ? (Number.isFinite(matchedReview.finalScore)
                        ? matchedReview.finalScore
                        : Number.isFinite(matchedReview.initialScore)
                            ? matchedReview.initialScore
                            : undefined)
                    : undefined

                const scoreDisplay = typeof numericScore === 'number'
                    ? (Number.isInteger(numericScore)
                        ? `${numericScore}`
                        : numericScore.toFixed(2))
                    : base.score

                // determine pass/fail using minimumPassingScore when available
                let result = base.result
                let screenerId: string | undefined = base.screenerId
                if (matchedReview) {
                    screenerId = matchedReview.resourceId
                }

                if (typeof numericScore === 'number' && typeof minPass === 'number') {
                    result = numericScore >= minPass ? 'PASS' as const : 'NO PASS' as const
                }

                return {
                    ...base,
                    result,
                    score: scoreDisplay,
                    screener: screenerId
                        ? resourceMemberIdMapping[screenerId]
                        : ({
                            handleColor: '#2a2a2a',
                            memberHandle: 'Not assigned',
                        } as BackendResource),
                    screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
        },
        [
            challengeReviews,
            resourceMemberIdMapping,
            screeningScorecardBase?.minimumPassingScore,
            screeningScorecardId,
            visibleChallengeSubmissions,
        ],
    )

    // Build checkpoint rows if checkpoint submissions and reviews exist
    const checkpoint = useMemo(() => {
        const checkpointReviewsBySubmission = new Map<string, BackendReview>()
        if (challengeReviews && checkpointReviewScorecardId) {
            forEach(challengeReviews, rv => {
                if (rv && rv.scorecardId === checkpointReviewScorecardId) {
                    checkpointReviewsBySubmission.set(rv.submissionId, rv)
                }
            })
        }

        const minPass = checkpointScorecardBase?.minimumPassingScore ?? undefined

        return visibleChallengeSubmissions
            .filter(s => (s.type || '').toUpperCase()
                .includes('CHECKPOINT'))
            .map(item => {
                const base = convertBackendSubmissionToScreening(item)
                const matchedReview = checkpointReviewsBySubmission.get(item.id)
                const numericScore: number | undefined = matchedReview
                    ? (Number.isFinite(matchedReview.finalScore)
                        ? matchedReview.finalScore
                        : Number.isFinite(matchedReview.initialScore)
                            ? matchedReview.initialScore
                            : undefined)
                    : undefined
                const scoreDisplay = typeof numericScore === 'number'
                    ? (Number.isInteger(numericScore)
                        ? `${numericScore}`
                        : numericScore.toFixed(2))
                    : 'Pending'

                let result = base.result
                let screenerId: string | undefined = base.screenerId
                if (matchedReview) {
                    screenerId = matchedReview.resourceId
                }

                if (typeof numericScore === 'number' && typeof minPass === 'number') {
                    result = numericScore >= minPass ? 'PASS' as const : 'NO PASS' as const
                }

                return {
                    ...base,
                    result,
                    score: scoreDisplay,
                    screener: screenerId
                        ? resourceMemberIdMapping[screenerId]
                        : ({
                            handleColor: '#2a2a2a',
                            memberHandle: 'Not assigned',
                        } as BackendResource),
                    screenerId,
                    userInfo: resourceMemberIdMapping[base.memberId],
                }
            })
    }, [
        challengeReviews,
        checkpointReviewScorecardId,
        checkpointScorecardBase?.minimumPassingScore,
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
        forEach(visibleChallengeSubmissions, challengeSubmission => {
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
        visibleChallengeSubmissions,
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

        const submissionsById = new Map(visibleChallengeSubmissions.map(s => [s.id, s]))
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
    }, [challengeInfo?.phases, challengeReviews, resourceMemberIdMapping, visibleChallengeSubmissions])

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
    )

    return {
        approvalReviews,
        checkpoint,
        isLoading: isLoading || shouldAwaitSubmitterReviews,
        mappingReviewAppeal,
        postMortemReviews,
        review,
        reviewProgress,
        screening,
        submitterReviews,
    }
}

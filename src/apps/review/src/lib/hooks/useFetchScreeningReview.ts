import { useContext, useEffect, useMemo } from 'react'
import { every, filter, forEach } from 'lodash'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/libs/shared'

import { REVIEWER } from '../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import {
    BackendResource,
    BackendReview,
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendSubmissionToScreening,
    convertBackendSubmissionToSubmissionInfo,
    createEmptyBackendReview,
    MappingReviewAppeal,
    ReviewAppContextModel,
    Screening,
    SubmissionInfo,
} from '../models'
import { fetchChallengeReviews } from '../services'

import {
    useFetchAppealQueue,
    useFetchAppealQueueProps,
} from './useFetchAppealQueue'
import {
    useFetchChallengeSubmissions,
    useFetchChallengeSubmissionsProps,
} from './useFetchChallengeSubmissions'
import { useRole, useRoleProps } from './useRole'

export interface useFetchScreeningReviewProps {
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    // screening data
    screening: Screening[]
    // review data
    review: SubmissionInfo[]
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
        resourceMemberIdMapping,
        reviewers: challengeReviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    // fetch challenge submissions
    const {
        challengeSubmissions,
        isLoading,
    }: useFetchChallengeSubmissionsProps
        = useFetchChallengeSubmissions(challengeId)

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
            forEach(challengeSubmissions, challengeSubmission => {
                forEach(challengeSubmission.review, review => {
                    results.push(review.resourceId)
                })
            })
        }

        return results

    }, [challengeReviewers, challengeSubmissions, actionChallengeRole, loginUserInfo])

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
        data: challengeReviews,
        error: fetchChallengeReviewsError,
    }: SWRResponse<BackendReview[], Error> = useSWR<BackendReview[], Error>(
        `reviewBaseUrl/reviews/${challengeId}/${reviewerKey}`,
        {
            fetcher: () => fetchChallengeReviews(challengeId ?? ''),
            isPaused: () => !challengeId || !reviewerIds.length,
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
        () => challengeSubmissions.map(item => {
            const result = convertBackendSubmissionToScreening(item)
            return {
                ...result,
                screener: result.screenerId
                    ? resourceMemberIdMapping[result.screenerId]
                    : ({
                        handleColor: '#2a2a2a',
                        memberHandle: 'Not assigned',
                    } as BackendResource),
                userInfo: resourceMemberIdMapping[result.memberId],
            }
        }),
        [challengeSubmissions, resourceMemberIdMapping],
    )

    // get review data from challenge submissions
    const review = useMemo(() => {
        const validReviews: BackendSubmission[] = []
        forEach(challengeSubmissions, challengeSubmission => {
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
        challengeSubmissions,
        resourceMemberIdMapping,
        reviewerIds,
        reviewAssignmentsBySubmission,
    ])

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

    return {
        isLoading,
        mappingReviewAppeal,
        review,
        reviewProgress,
        screening,
    }
}

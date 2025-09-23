import { useContext, useEffect, useMemo } from 'react'
import { every, filter, forEach } from 'lodash'

import {
    BackendResource,
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
import { ChallengeDetailContext, ReviewAppContext } from '../contexts'
import { REVIEWER } from '../../config/index.config'

import {
    useFetchChallengeSubmissions,
    useFetchChallengeSubmissionsProps,
} from './useFetchChallengeSubmissions'
import {
    useFetchAppealQueue,
    useFetchAppealQueueProps,
} from './useFetchAppealQueue'
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
                if (matchingReview) {
                    validReviews.push({
                        ...challengeSubmission,
                        review: [matchingReview],
                    })
                    loadResourceAppeal(matchingReview.id)
                } else {
                    validReviews.push({
                        ...challengeSubmission,
                        review: [
                            {
                                ...createEmptyBackendReview(),
                                resourceId: reviewerId,
                            },
                        ],
                    })
                }
            })
        })
        return validReviews.map(item => {
            const result = convertBackendSubmissionToSubmissionInfo(item)
            return {
                ...result,
                userInfo: resourceMemberIdMapping[result.memberId],
            }
        })
    }, [challengeSubmissions, resourceMemberIdMapping, reviewerIds])

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
    }, [])

    return {
        isLoading,
        mappingReviewAppeal,
        review,
        reviewProgress,
        screening,
    }
}

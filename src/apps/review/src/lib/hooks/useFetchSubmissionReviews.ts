/**
 * Fetch reviews of submission
 */

import {
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { every, filter, find, forEach, map } from 'lodash'
import { toast } from 'react-toastify'
import { useParams } from 'react-router-dom'
import useSWR, { SWRResponse } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import {
    AppealInfo,
    BackendAppealResponse,
    BackendReview,
    BackendReviewItem,
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendAppeal,
    convertBackendReviewToReviewInfo,
    createEmptyReviewInfoFromScorecard,
    FormReviews,
    MappingAppeal,
    ReviewInfo,
    ReviewItemInfo,
    ScorecardInfo,
    ScorecardQuestion,
} from '../models'
import {
    createAppeal,
    createAppealResponse,
    createReview,
    deleteAppeal,
    fetchAppeals,
    fetchReviews,
    fetchScorecard,
    fetchSubmission,
    updateAppeal,
    updateAppealResponse,
    updateReview,
    updateReviewItem,
} from '../services'
import { ChallengeDetailContext } from '../contexts'
import { BackendReviewItemCommentType } from '../models/BackendReviewItemComment.model'
import { ReviewItemComment } from '../models/ReviewItemComment.model'
import { SUBMITTER } from '../../config/index.config'
import { isReviewPhase } from '../utils'

import { useRole, useRoleProps } from './useRole'

export interface useFetchSubmissionReviewsProps {
    mappingAppeals: MappingAppeal
    scorecardInfo?: ScorecardInfo
    submissionInfo?: BackendSubmission
    scorecardId: string
    isLoading: boolean
    reviewInfo?: ReviewInfo
    setReviewInfo: Dispatch<SetStateAction<ReviewInfo | undefined>>
    isSavingReview: boolean
    isSavingAppeal: boolean
    isSavingAppealResponse: boolean
    isSavingManagerComment: boolean
    saveReviewInfo: (
        updatedReview: FormReviews | undefined,
        fullReview: FormReviews | undefined,
        committed: boolean,
        totalScore: number,
        success: () => void,
    ) => void
    addAppeal: (
        content: string,
        commentItem: ReviewItemComment,
        success: () => void,
    ) => void
    doDeleteAppeal: (
        appealInfo: AppealInfo | undefined,
        success: () => void,
    ) => void
    addAppealResponse: (
        content: string,
        updatedResponse: string,
        appeal: AppealInfo,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
    addManagerComment: (
        content: string,
        updatedResponse: string,
        reviewItem: ReviewItemInfo,
        success: () => void,
    ) => void
}

/**
 * Fetch reviews of submission
 * @returns reviews info
 */
export function useFetchSubmissionReviews(): useFetchSubmissionReviewsProps {
    const [isSavingReview, setIsSavingReview] = useState(false)
    const [isSavingAppeal, setIsSavingAppeal] = useState(false)
    const [isSavingAppealResponse, setIsSavingAppealResponse] = useState(false)
    const [isSavingManagerComment, setIsSavingManagerComment] = useState(false)
    const { actionChallengeRole }: useRoleProps = useRole()
    const {
        submissionId = '',
        resourceId = '',
    }: {
        submissionId?: string
        resourceId?: string
    } = useParams<{
        submissionId: string
        resourceId: string
    }>()

    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )

    const currentPhase = useMemo(
        () => challengeInfo?.currentPhaseObject ?? challengeInfo?.phases[0],
        [challengeInfo],
    )
    const [updatedReviewInfo, setUpdatedReviewInfo] = useState<ReviewInfo>()

    // Use swr hooks for reviews info fetching
    const {
        data: reviews,
        error: fetchReviewsError,
        isValidating: isLoadingReviews,
    }: SWRResponse<BackendReview[], Error> = useSWR<BackendReview[], Error>(
        `EnvironmentConfig.API.V6/reviews/challengeId/${challengeInfo?.id}/submissionId/${submissionId}`,
        {
            fetcher: () => fetchReviews(1, 100, `${challengeInfo?.id}`, submissionId),
            isPaused: () => !challengeInfo
                || !submissionId
                || (isReviewPhase(challengeInfo)
                && actionChallengeRole === SUBMITTER),
        },
    )

    // Use swr hooks for appeals info fetching
    const mappingAppealsRef = useRef<MappingAppeal>({})
    const [mappingAppeals, setMappingAppeals] = useState<MappingAppeal>({})
    const {
        data: appeals,
        error: fetchAppealsError,
    }: SWRResponse<AppealInfo[], Error> = useSWR<AppealInfo[], Error>(
        `EnvironmentConfig.API.V6/appeals/resourceId/${resourceId}`,
        {
            fetcher: () => fetchAppeals(1, 100, resourceId),
            isPaused: () => !resourceId,
        },
    )

    useEffect(() => {
        const result: { [key: string]: AppealInfo } = {}
        forEach(appeals, item => {
            result[item.reviewItemCommentId] = item
        })
        mappingAppealsRef.current = result
        setMappingAppeals(result)
    }, [appeals])

    /**
     * Get scorecard id from reviews and challenge info
     */
    const scorecardId = useMemo(() => {
        if (reviews && reviews[0]) {
            return reviews[0].scorecardId
        }

        if (!challengeInfo) {
            return ''
        }

        if (challengeInfo.reviewers && challengeInfo.reviewers[0]) {
            return challengeInfo.reviewers[0].scorecardId
        }

        const reviewPhase = find(challengeInfo.phases, { name: 'Review' })
        const scoreCardInfo = find(reviewPhase?.constraints ?? [], {
            name: 'Scorecard',
        })
        return `${scoreCardInfo?.value ?? ''}`
    }, [challengeInfo, reviews])

    // Use swr hooks for scorecard info fetching
    const {
        data: scorecardInfo,
        error: fetchScorecardError,
        isValidating: isLoadingScorecard,
    }: SWRResponse<ScorecardInfo, Error> = useSWR<ScorecardInfo, Error>(
        `EnvironmentConfig.API.V6/scorecards/${scorecardId}`,
        {
            fetcher: () => fetchScorecard(scorecardId),
            isPaused: () => !scorecardId,
        },
    )

    // Use swr hooks for submission info fetching
    const {
        data: submissionInfo,
        error: fetchSubmissionError,
        isValidating: isLoadingSubmission,
    }: SWRResponse<BackendSubmission, Error> = useSWR<BackendSubmission, Error>(
        `EnvironmentConfig.API.V6/submissions/${submissionId}`,
        {
            fetcher: () => fetchSubmission(submissionId),
            isPaused: () => !submissionId,
        },
    )

    /**
     * Get review info from backend and scorecard info
     */
    const reviewInfo = useMemo(() => {
        let backendReview: BackendReview | undefined
        if (!scorecardInfo) {
            return undefined
        }

        const mappingScorecardQuestion: { [questionId: string]: boolean } = {}
        forEach(scorecardInfo.scorecardGroups, group => {
            forEach(group.sections, section => {
                forEach(section.questions, (question: ScorecardQuestion) => {
                    mappingScorecardQuestion[question.id ?? ''] = true
                })
            })
        })

        if (resourceId && reviews) {
            backendReview = find(reviews, review => (
                review.resourceId === resourceId
                && review.submissionId === submissionId
                && review.reviewItems
                && review.reviewItems.length > 0
                && every(
                    review.reviewItems,
                    item => mappingScorecardQuestion[item.scorecardQuestionId],
                )
            )) as BackendReview
        }

        if (backendReview) {
            return convertBackendReviewToReviewInfo(backendReview)
        }

        if (resourceId) {
            return createEmptyReviewInfoFromScorecard(scorecardInfo, resourceId)
        }

        return undefined
    }, [reviews, resourceId, submissionId, scorecardInfo])

    useEffect(() => {
        setUpdatedReviewInfo(reviewInfo)
    }, [reviewInfo])

    // Show backend error when fetching reviews info
    useEffect(() => {
        if (fetchReviewsError) {
            handleError(fetchReviewsError)
        }
    }, [fetchReviewsError])

    // Show backend error when fetching scorecard info
    useEffect(() => {
        if (fetchScorecardError) {
            handleError(fetchScorecardError)
        }
    }, [fetchScorecardError])

    // Show backend error when fetching submission info
    useEffect(() => {
        if (fetchSubmissionError) {
            handleError(fetchSubmissionError)
        }
    }, [fetchSubmissionError])

    // Show backend error when fetching appeal info
    useEffect(() => {
        if (fetchAppealsError) {
            handleError(fetchAppealsError)
        }
    }, [fetchAppealsError])

    /**
     * Save review info
     */
    const saveReviewInfo = useCallback(
        (
            updatedReview: FormReviews | undefined,
            fullReview: FormReviews | undefined,
            committed: boolean,
            totalScore: number,
            success: () => void,
        ) => {
            let listRequest: Promise<BackendReview | BackendReviewItem>[] = []
            if (updatedReviewInfo) {
                if (updatedReviewInfo.id) {
                    listRequest.push(
                        updateReview(updatedReviewInfo.id, {
                            committed,
                            finalScore: 0,
                            initialScore: totalScore,
                            reviewDate: new Date()
                                .toISOString(),
                            status: committed ? 'COMPLETED' : 'DRAFT',
                        }),
                    )

                    const updateReviewItemRequests = (
                        updatedReview?.reviews ?? []
                    ).map(reviewItem => updateReviewItem(reviewItem.id, {
                        initialAnswer: reviewItem.initialAnswer || ' ',
                        reviewItemComments: reviewItem.comments.map(comment => ({
                            content: comment.content || ' ',
                            sortOrder: comment.index,
                            type:
                                (comment.type as BackendReviewItemCommentType)
                                || 'COMMENT',
                        })),
                        scorecardQuestionId: reviewItem.scorecardQuestionId,
                    }))
                    listRequest = [...listRequest, ...updateReviewItemRequests]
                } else if (fullReview) {
                    listRequest.push(
                        new Promise<BackendReview>((resolve, reject) => {
                            createReview({
                                committed,
                                finalScore: 0,
                                initialScore: totalScore,
                                phaseId: currentPhase?.id ?? '',
                                resourceId,
                                reviewDate: new Date()
                                    .toISOString(),
                                reviewItems: (fullReview.reviews ?? []).map(
                                    reviewItem => ({
                                        initialAnswer:
                                            reviewItem.initialAnswer ?? ' ',
                                        reviewItemComments: filter(
                                            reviewItem.comments,
                                            comment => !!comment.content,
                                        )
                                            .map(comment => ({
                                                content: comment.content ?? ' ',
                                                sortOrder: comment.index,
                                                type:
                                                    (comment.type as BackendReviewItemCommentType)
                                                    ?? 'COMMENT',
                                            })),
                                        scorecardQuestionId:
                                            reviewItem.scorecardQuestionId,

                                    }),
                                ),
                                scorecardId,
                                status: 'DRAFT',
                                submissionId,
                                typeId: challengeInfo?.typeId ?? '',
                            })
                                .then(rs => {
                                    setUpdatedReviewInfo(
                                        convertBackendReviewToReviewInfo(rs),
                                    )
                                    resolve(rs)
                                })
                                .catch(reject)
                        }),
                    )
                }
            }

            if (listRequest.length) {
                setIsSavingReview(true)
                Promise.all(listRequest)

                    .then(() => {
                        setIsSavingReview(false)
                        success()
                    })
                    .catch(e => {
                        setIsSavingReview(false)
                        handleError(e)
                    })
            } else {
                success()
            }
        },
        [
            updatedReviewInfo,
            setUpdatedReviewInfo,
            reviewInfo,
            resourceId,
            submissionId,
            currentPhase,
            scorecardId,
            challengeInfo,
        ],
    )

    /**
     * Add appeal
     */
    const addAppeal = useCallback(
        (
            content: string,
            commentItem: ReviewItemComment,
            success: () => void,
        ) => {
            const existingAppeal = mappingAppealsRef.current[commentItem.id]
            const updateInfo = {
                content,
                resourceId,
                reviewItemCommentId: commentItem.id,
            }
            const request = existingAppeal
                ? updateAppeal(existingAppeal.id, updateInfo)
                : createAppeal(updateInfo)

            setIsSavingAppeal(true)
            request
                .then(rs => {
                    setIsSavingAppeal(false)
                    mappingAppealsRef.current = {
                        ...mappingAppealsRef.current,
                        [commentItem.id]: convertBackendAppeal(rs),
                    }
                    setMappingAppeals(mappingAppealsRef.current)

                    toast.success('Appeal saved successfully!')
                    success()
                })
                .catch(e => {
                    setIsSavingAppeal(false)
                    handleError(e)
                })
        },
        [resourceId],
    )

    /**
     * Delete appeal
     */
    const doDeleteAppeal = useCallback(
        (appealInfo: AppealInfo | undefined, success: () => void) => {
            if (appealInfo) {
                setIsSavingAppeal(true)
                deleteAppeal(appealInfo.id)
                    .then(() => {
                        setIsSavingAppeal(false)
                        mappingAppealsRef.current = {
                            ...mappingAppealsRef.current,
                            [appealInfo.reviewItemCommentId]: undefined,
                        }
                        setMappingAppeals(mappingAppealsRef.current)

                        toast.success('Appeal deleted successfully!')
                        success()
                    })
                    .catch(e => {
                        setIsSavingAppeal(false)
                        handleError(e)
                    })
            }
        },
        [],
    )

    /**
     * Add appeal response
     */
    const addAppealResponse = useCallback(
        (
            content: string,
            updatedResponse: string,
            appeal: AppealInfo,
            reviewItem: ReviewItemInfo,
            success: () => void,
        ) => {
            const listRequest: Promise<
                BackendReviewItem | BackendAppealResponse
            >[] = []
            if (updatedResponse) {
                listRequest.push(
                    new Promise<BackendReviewItem>((resolve, reject) => {
                        updateReviewItem(reviewItem.id, {
                            finalAnswer: updatedResponse,
                            initialAnswer: reviewItem.initialAnswer ?? '',
                            scorecardQuestionId: reviewItem.scorecardQuestionId,
                        })
                            .then(rs => {
                                const result = map(
                                    reviewInfo?.reviewItems ?? [],
                                    review => {
                                        if (review.id === reviewItem.id) {
                                            return {
                                                ...review,
                                                finalAnswer: updatedResponse,
                                            }
                                        }

                                        return review
                                    },
                                )
                                if (updatedReviewInfo) {
                                    setUpdatedReviewInfo({
                                        ...updatedReviewInfo,
                                        reviewItems: result,
                                    })
                                }

                                resolve(rs)
                            })
                            .catch(reject)
                    }),
                )
            }

            listRequest.push(
                new Promise<BackendAppealResponse>((resolve, reject) => {
                    const updateData = {
                        appealId: appeal.id,
                        content,
                        resourceId,
                        success: !!updatedResponse,
                    }
                    const updateRequest = appeal.appealResponse
                        ? updateAppealResponse(
                            appeal.appealResponse.id,
                            updateData,
                        )
                        : createAppealResponse(appeal.id, updateData)

                    updateRequest
                        .then(rs => {
                            mappingAppealsRef.current = {
                                ...mappingAppealsRef.current,
                                [appeal.reviewItemCommentId]: {
                                    ...mappingAppealsRef.current[
                                        appeal.reviewItemCommentId
                                    ],
                                    appealResponse: rs,
                                } as AppealInfo,
                            }
                            setMappingAppeals(mappingAppealsRef.current)
                            resolve(rs)
                        })
                        .catch(reject)
                }),
            )

            setIsSavingAppealResponse(true)
            Promise.all(listRequest)
                .then(() => {
                    setIsSavingAppealResponse(false)
                    toast.success('Appeal response saved successfully!')
                    success()
                })
                .catch(e => {
                    setIsSavingAppealResponse(false)
                    handleError(e)
                })
        },
        [resourceId, reviewInfo, setUpdatedReviewInfo, updatedReviewInfo],
    )

    /**
     * Add manager comment
     */
    const addManagerComment = useCallback(
        (
            content: string,
            updatedResponse: string,
            reviewItem: ReviewItemInfo,
            success: () => void,
        ) => {
            setIsSavingManagerComment(true)
            updateReviewItem(reviewItem.id, {
                finalAnswer: updatedResponse,
                initialAnswer: reviewItem.initialAnswer ?? '',
                managerComment: content,
                scorecardQuestionId: reviewItem.scorecardQuestionId,
            })
                .then(() => {
                    const result = map(
                        reviewInfo?.reviewItems ?? [],
                        review => {
                            if (review.id === reviewItem.id) {
                                return {
                                    ...review,
                                    finalAnswer: updatedResponse,
                                    managerComment: content,
                                }
                            }

                            return review
                        },
                    )
                    if (updatedReviewInfo) {
                        setUpdatedReviewInfo({
                            ...updatedReviewInfo,
                            reviewItems: result,
                        })
                    }

                    setIsSavingManagerComment(false)
                    toast.success('Manager comment saved successfully!')
                    success()
                })
                .catch(e => {
                    setIsSavingManagerComment(false)
                    handleError(e)
                })
        },
        [reviewInfo, setUpdatedReviewInfo, updatedReviewInfo],
    )

    return {
        addAppeal,
        addAppealResponse,
        addManagerComment,
        doDeleteAppeal,
        isLoading:
            isLoadingReviews || isLoadingScorecard || isLoadingSubmission,
        isSavingAppeal,
        isSavingAppealResponse,
        isSavingManagerComment,
        isSavingReview,
        mappingAppeals,
        reviewInfo: updatedReviewInfo,
        saveReviewInfo,
        scorecardId,
        scorecardInfo,
        setReviewInfo: setUpdatedReviewInfo,
        submissionInfo,

    }
}

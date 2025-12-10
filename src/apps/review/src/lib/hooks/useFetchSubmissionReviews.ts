/**
 * Fetch reviews of submission
 */

import {
    Dispatch,
    MutableRefObject,
    SetStateAction,
    useCallback,
    useContext,
    useEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { find, forEach, map } from 'lodash'
import { toast } from 'react-toastify'
import useSWR, { SWRResponse, mutate } from 'swr'

import { handleError } from '~/apps/admin/src/lib/utils'

import {
    AppealInfo,
    BackendAppealResponse,
    BackendPhase,
    BackendRequestReviewItem,
    BackendReview,
    BackendReviewItem,
    ChallengeDetailContextModel,
    convertBackendAppeal,
    convertBackendReviewToReviewInfo,
    createEmptyReviewInfoFromScorecard,
    FormReviews,
    MappingAppeal,
    ReviewInfo,
    ReviewItemInfo,
    ScorecardInfo,
} from '../models'
import {
    createAppeal,
    createAppealResponse,
    createReview,
    deleteAppeal,
    fetchAppeals,
    fetchChallengeReviews,
    fetchReview,
    fetchScorecard,
    updateAppeal,
    updateAppealResponse,
    updateReview,
    updateReviewItem,
} from '../services'
import { ChallengeDetailContext } from '../contexts'
import { BackendReviewItemCommentType } from '../models/BackendReviewItemComment.model'
import { ReviewItemComment } from '../models/ReviewItemComment.model'
import { SUBMITTER } from '../../config/index.config'

import { useRole, useRoleProps } from './useRole'
import { EnvironmentConfig } from '~/config'

const hasSubmitterReviewDetails = (review?: BackendReview): boolean => {
    if (!review) {
        return false
    }

    const normalizedSubmissionId = `${review.submissionId ?? ''}`.trim()
    const normalizedSubmitterHandle = `${review.submitterHandle ?? ''}`.trim()
    const hasReviewItems = Array.isArray(review.reviewItems)
        && review.reviewItems.length > 0

    return Boolean(
        normalizedSubmissionId
        && normalizedSubmitterHandle
        && hasReviewItems,
    )
}

const needsSubmitterReviewFallback = (review?: BackendReview): boolean => !hasSubmitterReviewDetails(review)

const normalizeId = (value: unknown): string | undefined => {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalized = `${value}`.trim()
    return normalized || undefined
}

const normalizeName = (value: unknown): string | undefined => {
    const normalized = normalizeId(value)
    return normalized ? normalized.toLowerCase() : undefined
}

type ReviewerConfigSummary = {
    phaseId?: unknown
    scorecardId?: unknown
}

const PHASE_METADATA_KEYS = ['phaseName', 'name', 'reviewPhase', 'reviewType'] as const

const matchesPhaseIdentifier = (
    phase: BackendPhase,
    normalizedTarget: string,
): boolean => (
    normalizeId(phase.id) === normalizedTarget
    || normalizeId(phase.phaseId) === normalizedTarget
)

const findPhaseByNormalizedId = (
    phases: BackendPhase[] | undefined,
    normalizedId: string | undefined,
): BackendPhase | undefined => {
    if (!normalizedId || !phases?.length) {
        return undefined
    }

    return phases.find(phase => matchesPhaseIdentifier(phase, normalizedId))
}

const findPhaseUsingReviewerConfigs = (
    phases: BackendPhase[] | undefined,
    reviewerConfigs: ReviewerConfigSummary[] | undefined,
    normalizedReviewPhaseId: string | undefined,
    normalizedScorecardId: string | undefined,
): BackendPhase | undefined => {
    if (!phases?.length || !reviewerConfigs?.length) {
        return undefined
    }

    const matchedConfig = reviewerConfigs.find(config => {
        const normalizedPhaseId = normalizeId(config.phaseId)
        if (normalizedReviewPhaseId && normalizedPhaseId === normalizedReviewPhaseId) {
            return true
        }

        const normalizedConfigScorecardId = normalizeId(config.scorecardId)
        return Boolean(
            normalizedScorecardId
            && normalizedConfigScorecardId === normalizedScorecardId,
        )
    })

    if (!matchedConfig) {
        return undefined
    }

    const normalizedConfigPhaseId = normalizeId(matchedConfig.phaseId)
    return findPhaseByNormalizedId(phases, normalizedConfigPhaseId)
}

const findPhaseByNormalizedName = (
    phases: BackendPhase[] | undefined,
    normalizedName: string | undefined,
): BackendPhase | undefined => {
    if (!normalizedName || !phases?.length) {
        return undefined
    }

    return phases.find(phase => normalizeName(phase.name) === normalizedName)
}

const findPhaseFromMetadata = (
    phases: BackendPhase[] | undefined,
    metadata: unknown,
): BackendPhase | undefined => {
    if (!phases?.length || !metadata || typeof metadata !== 'object') {
        return undefined
    }

    const metadataRecord = metadata as Record<string, unknown>
    for (const key of PHASE_METADATA_KEYS) {
        const match = findPhaseByNormalizedName(
            phases,
            normalizeName(metadataRecord[key]),
        )
        if (match) {
            return match
        }
    }

    return undefined
}

const findMatchingPhaseForReview = (
    phases: BackendPhase[] | undefined,
    review: BackendReview | undefined,
    reviewerConfigs: ReviewerConfigSummary[] | undefined,
): BackendPhase | undefined => {
    if (!phases?.length || !review) {
        return undefined
    }

    const normalizedReviewPhaseId = normalizeId(review.phaseId)
    const normalizedScorecardId = normalizeId(review.scorecardId)

    const matchedByReviewId = findPhaseByNormalizedId(
        phases,
        normalizedReviewPhaseId,
    )
    if (matchedByReviewId) {
        return matchedByReviewId
    }

    const matchedByReviewerConfig = findPhaseUsingReviewerConfigs(
        phases,
        reviewerConfigs,
        normalizedReviewPhaseId,
        normalizedScorecardId,
    )
    if (matchedByReviewerConfig) {
        return matchedByReviewerConfig
    }

    const matchedByName = findPhaseByNormalizedName(
        phases,
        normalizeName(review.phaseName),
    )
    if (matchedByName) {
        return matchedByName
    }

    return findPhaseFromMetadata(phases, review.metadata)
}

const cacheReviewIfComplete = (
    cache: MutableRefObject<Record<string, BackendReview | undefined>>,
    reviewId: string,
    review: BackendReview | undefined,
): void => {
    if (!review || needsSubmitterReviewFallback(review)) {
        return
    }

    cache.current[reviewId] = review
}

const fetchPrimaryReviewSafely = async (
    reviewId: string,
): Promise<{ error?: unknown; review?: BackendReview }> => {
    try {
        const review = await fetchReview(reviewId)
        return { review }
    } catch (error) {
        return { error }
    }
}

const fetchFallbackReviewSafely = async (
    challengeId: string,
    reviewId: string,
    cache: MutableRefObject<Record<string, BackendReview | undefined>>,
): Promise<{ error?: unknown; review?: BackendReview }> => {
    if (!challengeId) {
        return {}
    }

    const cached = cache.current[reviewId]
    if (cached && !needsSubmitterReviewFallback(cached)) {
        return { review: cached }
    }

    try {
        const challengeReviews = await fetchChallengeReviews(challengeId)
        const fallbackReview = challengeReviews.find(candidate => candidate.id === reviewId)
        cacheReviewIfComplete(cache, reviewId, fallbackReview)
        return { review: fallbackReview }
    } catch (error) {
        return { error }
    }
}

const resolveReviewOrThrow = (
    review: BackendReview | undefined,
    primaryError?: unknown,
    fallbackError?: unknown,
): BackendReview => {
    if (review) {
        return review
    }

    if (primaryError) {
        throw primaryError
    }

    if (fallbackError) {
        throw fallbackError
    }

    throw new Error('Review not found')
}

export interface useFetchSubmissionReviewsProps {
    mappingAppeals: MappingAppeal
    scorecardInfo?: ScorecardInfo
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
    isSubmitterPhaseLocked: boolean
    submitterLockedPhaseName?: string
}

/**
 * Fetch reviews of submission
 * @returns reviews info
 */
export function useFetchSubmissionReviews(reviewId: string = ''): useFetchSubmissionReviewsProps {
    const [isSavingReview, setIsSavingReview] = useState(false)
    const [isSavingAppeal, setIsSavingAppeal] = useState(false)
    const [isSavingAppealResponse, setIsSavingAppealResponse] = useState(false)
    const [isSavingManagerComment, setIsSavingManagerComment] = useState(false)
    const { actionChallengeRole }: useRoleProps = useRole()

    const {
        challengeId: contextChallengeId,
        challengeInfo,
    }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )

    const currentPhase = useMemo(
        () => challengeInfo?.currentPhaseObject ?? challengeInfo?.phases[0],
        [challengeInfo],
    )
    const [updatedReviewInfo, setUpdatedReviewInfo] = useState<ReviewInfo>()

    const challengeIdentifier = challengeInfo?.id ?? contextChallengeId ?? ''
    const shouldUseSubmitterFallback = actionChallengeRole === SUBMITTER
        && Boolean(challengeIdentifier)
    const fallbackReviewCacheRef = useRef<Record<string, BackendReview | undefined>>({})

    const fetchReviewWithFallback = useCallback(async (): Promise<BackendReview> => {
        if (!reviewId) {
            throw new Error('Missing review identifier')
        }

        const primaryResult = await fetchPrimaryReviewSafely(reviewId)
        const primaryReview = primaryResult.review
        const primaryError = primaryResult.error

        if (!shouldUseSubmitterFallback) {
            return resolveReviewOrThrow(primaryReview, primaryError)
        }

        if (primaryReview && !needsSubmitterReviewFallback(primaryReview)) {
            cacheReviewIfComplete(fallbackReviewCacheRef, reviewId, primaryReview)
            return primaryReview
        }

        const fallbackResult = await fetchFallbackReviewSafely(
            challengeIdentifier,
            reviewId,
            fallbackReviewCacheRef,
        )
        const fallbackReview = fallbackResult.review
        const fallbackError = fallbackResult.error

        const resolvedReview = fallbackReview ?? primaryReview
        cacheReviewIfComplete(fallbackReviewCacheRef, reviewId, resolvedReview)

        return resolveReviewOrThrow(resolvedReview, primaryError, fallbackError)
    }, [
        challengeIdentifier,
        reviewId,
        shouldUseSubmitterFallback,
    ])

    // Use swr hooks for reviews info fetching
    const {
        data: review,
        error: fetchReviewError,
        isValidating: isLoadingReview,
    }: SWRResponse<BackendReview, Error> = useSWR<BackendReview, Error>(
        reviewId
            ? `EnvironmentConfig.API.V6/reviews/${reviewId}`
            : undefined,
        {
            fetcher: fetchReviewWithFallback,
            isPaused: () => !reviewId,
        },
    )

    const submissionId = review?.submissionId ?? ''
    const resourceId = review?.resourceId ?? ''

    const reviewPhase = useMemo(
        () => findMatchingPhaseForReview(
            challengeInfo?.phases,
            review,
            challengeInfo?.reviewers,
        ),
        [challengeInfo?.phases, challengeInfo?.reviewers, review],
    )

    const submitterPhaseGate = useMemo(
        () => {
            if (actionChallengeRole !== SUBMITTER) {
                return {
                    isLocked: false,
                    phaseName: undefined as string | undefined,
                }
            }

            const phaseName = reviewPhase?.name
                ?? (typeof review?.phaseName === 'string' ? review?.phaseName : undefined)

            if (!reviewPhase) {
                return {
                    isLocked: false,
                    phaseName,
                }
            }

            return {
                isLocked: reviewPhase.isOpen === true,
                phaseName,
            }
        },
        [actionChallengeRole, review?.phaseName, reviewPhase],
    )

    // Use swr hooks for appeals info fetching
    const mappingAppealsRef = useRef<MappingAppeal>({})
    const [mappingAppeals, setMappingAppeals] = useState<MappingAppeal>({})
    const {
        data: appeals,
        error: fetchAppealsError,
    }: SWRResponse<AppealInfo[], Error> = useSWR<AppealInfo[], Error>(
        `${EnvironmentConfig.API.V6}/appeals/resourceId/${resourceId}`,
        {
            fetcher: () => fetchAppeals(1, 100, resourceId),
            isPaused: () => !resourceId,
        },
    )

    useEffect(() => {
        const result: MappingAppeal = {}
        forEach(appeals, item => {
            result[item.reviewItemCommentId] = item
        })
        forEach(updatedReviewInfo?.reviewItems ?? [], reviewItem => {
            forEach(reviewItem.reviewItemComments, comment => {
                if (comment.appeal) {
                    result[comment.id] = comment.appeal
                }
            })
        })

        mappingAppealsRef.current = result
        setMappingAppeals(result)
    }, [appeals, updatedReviewInfo])

    /**
     * Get scorecard id from review and challenge info
     */
    const scorecardId = useMemo(() => {
        if (review?.scorecardId) {
            return review.scorecardId
        }

        if (!challengeInfo) {
            return ''
        }

        if (challengeInfo.reviewers && challengeInfo.reviewers[0]) {
            return challengeInfo.reviewers[0].scorecardId
        }

        const reviewPhaseDefinition = find(challengeInfo.phases, { name: 'Review' })
        const scoreCardInfo = find(reviewPhaseDefinition?.constraints ?? [], {
            name: 'Scorecard',
        })
        return `${scoreCardInfo?.value ?? ''}`
    }, [challengeInfo, review])

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

    /**
     * Get review info from backend and scorecard info
     */
    const reviewInfo = useMemo(() => {
        if (!scorecardInfo) {
            return undefined
        }

        if (review) {
            const converted = convertBackendReviewToReviewInfo(review)
            if (converted.reviewItems.length) {
                return {
                    ...converted,
                    scorecardId:
                        review.scorecardId
                        || converted.scorecardId
                        || scorecardInfo.id,
                }
            }

            const emptyReview = createEmptyReviewInfoFromScorecard(
                scorecardInfo,
                resourceId,
            )
            return {
                ...converted,
                reviewItems: emptyReview.reviewItems,
                scorecardId:
                    review.scorecardId
                    || converted.scorecardId
                    || scorecardInfo.id,
            }
        }

        if (resourceId) {
            return createEmptyReviewInfoFromScorecard(scorecardInfo, resourceId)
        }

        return undefined
    }, [review, resourceId, scorecardInfo])

    useEffect(() => {
        setUpdatedReviewInfo(reviewInfo)
    }, [reviewInfo])

    // Show backend error when fetching reviews info
    useEffect(() => {
        if (fetchReviewError) {
            handleError(fetchReviewError)
        }
    }, [fetchReviewError])

    // Show backend error when fetching scorecard info
    useEffect(() => {
        if (fetchScorecardError) {
            handleError(fetchScorecardError)
        }
    }, [fetchScorecardError])

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
            if (!updatedReviewInfo && !fullReview) {
                success()
                return
            }

            const status = committed ? 'COMPLETED' : 'IN_PROGRESS'
            const reviewDate = new Date()
                .toISOString()

            const buildReviewItemsPayload = (
                reviewForm?: FormReviews,
            ): BackendRequestReviewItem[] => (
                reviewForm?.reviews ?? []
            ).map(reviewItem => ({
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

            if (updatedReviewInfo?.id) {
                const reviewItemsPayload = fullReview
                    ? buildReviewItemsPayload(fullReview)
                    : updatedReview
                        ? buildReviewItemsPayload(updatedReview)
                        : undefined

                const payload = {
                    committed,
                    reviewDate,
                    status,
                    ...(scorecardId ? { scorecardId } : {}),
                    ...(challengeInfo?.typeId ? { typeId: challengeInfo.typeId } : {}),
                    ...(currentPhase?.id ? { phaseId: currentPhase.id } : {}),
                    ...(reviewItemsPayload
                        ? { reviewItems: reviewItemsPayload }
                        : {}),
                }

                setIsSavingReview(true)
                updateReview(updatedReviewInfo.id, payload)
                    .then(response => {
                        setIsSavingReview(false)
                        setUpdatedReviewInfo(prev => {
                            if (!prev) {
                                return convertBackendReviewToReviewInfo(response)
                            }

                            return {
                                ...prev,
                                committed,
                                status,
                            }
                        })
                        success()
                    })
                    .catch(e => {
                        setIsSavingReview(false)
                        handleError(e)
                    })

                return
            }

            if (fullReview) {
                setIsSavingReview(true)
                createReview({
                    committed,
                    finalScore: 0,
                    initialScore: totalScore,
                    phaseId: currentPhase?.id ?? '',
                    resourceId,
                    reviewDate,
                    reviewItems: buildReviewItemsPayload(fullReview),
                    scorecardId,
                    status,
                    submissionId,
                    typeId: challengeInfo?.typeId ?? '',
                })
                    .then(rs => {
                        setUpdatedReviewInfo(
                            convertBackendReviewToReviewInfo(rs),
                        )
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
        [],
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
                                    existingReview => {
                                        if (existingReview.id === reviewItem.id) {
                                            return {
                                                ...existingReview,
                                                finalAnswer: updatedResponse,
                                            }
                                        }

                                        return existingReview
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
                .then(async () => {
                    setIsSavingAppealResponse(false)
                    // Revalidate SWR caches so other components using the raw SWR data update immediately
                    try {
                        if (resourceId) {
                            // re-fetch appeals for this resourceId
                            mutate(`EnvironmentConfig.API.V6/appeals/resourceId/${resourceId}`, (prev: any) => ({ ...prev, status: "processing" }), false)
                            
                        }
                        if (reviewId) {
                            // re-fetch review data
                            mutate(`EnvironmentConfig.API.V6/reviews/${reviewId}`, (prev: any) => ({ ...prev, status: "processing" }), false)
                        }
                    } catch (e) {
                        // ignore mutate errors
                    }

                    toast.success('Appeal response saved successfully!')
                    success()
                })
                .catch(e => {
                    setIsSavingAppealResponse(false)
                    handleError(e)
                })
        },
        [resourceId, reviewInfo, setUpdatedReviewInfo, updatedReviewInfo, reviewId],
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
                        existingReview => {
                            if (existingReview.id === reviewItem.id) {
                                return {
                                    ...existingReview,
                                    finalAnswer: updatedResponse,
                                    managerComment: content,
                                }
                            }

                            return existingReview
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
            isLoadingReview || isLoadingScorecard,
        isSavingAppeal,
        isSavingAppealResponse,
        isSavingManagerComment,
        isSavingReview,
        isSubmitterPhaseLocked: submitterPhaseGate.isLocked,
        mappingAppeals,
        reviewInfo: updatedReviewInfo,
        saveReviewInfo,
        scorecardId,
        scorecardInfo,
        setReviewInfo: setUpdatedReviewInfo,
        submitterLockedPhaseName: submitterPhaseGate.phaseName,
    }
}

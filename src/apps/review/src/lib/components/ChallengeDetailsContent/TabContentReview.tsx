/**
 * Content of review tab.
 */
import {
    FC,
    useCallback,
    useContext,
    useMemo,
} from 'react'

import { TableLoading } from '~/apps/admin/src/lib'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import {
    ChallengeDetailContext,
} from '../../contexts'
import {
    BackendResource,
    BackendSubmission,
    ChallengeDetailContextModel,
    convertBackendSubmissionToSubmissionInfo,
    MappingReviewAppeal,
    ReviewInfo,
    ReviewResult,
    SubmissionInfo,
} from '../../models'
import { hasIsLatestFlag } from '../../utils'
import { TableAppeals } from '../TableAppeals'
import { TableAppealsForSubmitter } from '../TableAppealsForSubmitter'
import { TableAppealsResponse } from '../TableAppealsResponse'
import { TableNoRecord } from '../TableNoRecord'
import { TableReview } from '../TableReview'
import { TableReviewForSubmitter } from '../TableReviewForSubmitter'
import { useRole, useRoleProps } from '../../hooks'
import {
    APPROVAL,
    REVIEWER,
    SUBMITTER,
} from '../../../config/index.config'
import {
    isContestReviewPhaseSubmission,
    shouldIncludeInReviewPhase,
} from '../../utils/reviewPhaseGuards'
import { hasSubmitterPassedThreshold } from '../../utils/reviewScoring'

interface Props {
    selectedTab: string
    reviews: SubmissionInfo[]
    submitterReviews: SubmissionInfo[]
    reviewMinimumPassingScore?: number | null
    isLoadingReview: boolean
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    isActiveChallenge: boolean
}

export const TabContentReview: FC<Props> = (props: Props) => {
    const selectedTab = props.selectedTab
    const providedReviews = props.reviews
    const providedSubmitterReviews = props.submitterReviews
    const {
        challengeInfo,
        challengeSubmissions: backendChallengeSubmissions,
        myResources,
        resourceMemberIdMapping,
        resources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { actionChallengeRole, isPrivilegedRole }: useRoleProps = useRole()
    const challengeSubmissions = useMemo<SubmissionInfo[]>(
        () => challengeInfo?.submissions ?? [],
        [challengeInfo?.submissions],
    )
    const myOwnedMemberIds = useMemo<Set<string>>(
        () => {
            const ids = new Set<string>()
            const ownedResources = myResources ?? []

            ownedResources.forEach(resource => {
                const memberId = resource?.memberId
                if (memberId === undefined || memberId === null) {
                    return
                }

                const normalized = `${memberId}`.trim()
                if (normalized.length) {
                    ids.add(normalized)
                }
            })
            return ids
        },
        [myResources],
    )
    const isChallengeCompleted = useMemo(
        () => {
            const status = challengeInfo?.status
            if (!status) {
                return false
            }

            const normalizedStatus = `${status}`.trim()
                .toUpperCase()
            if (!normalizedStatus.length) {
                return false
            }

            if (normalizedStatus === 'COMPLETED' || normalizedStatus === 'CANCELLED') {
                return true
            }

            return normalizedStatus.startsWith('CANCELLED_')
        },
        [challengeInfo?.status],
    )
    const hasPassedReviewThreshold = useMemo(
        () => hasSubmitterPassedThreshold(
            providedReviews ?? [],
            myOwnedMemberIds,
            props.reviewMinimumPassingScore,
        ),
        [providedReviews, myOwnedMemberIds, props.reviewMinimumPassingScore],
    )
    const myOwnedSubmissionIds = useMemo<Set<string>>(
        () => {
            if (!myOwnedMemberIds.size) {
                return new Set<string>()
            }

            const ids = new Set<string>()
            challengeSubmissions.forEach(submission => {
                if (!submission) {
                    return
                }

                const submissionId = (submission.id ?? '').trim()
                if (!submissionId.length) {
                    return
                }

                const ownerId = submission.memberId
                    ? `${submission.memberId}`.trim()
                    : ''
                if (ownerId.length && myOwnedMemberIds.has(ownerId)) {
                    ids.add(submissionId)
                }
            })
            return ids
        },
        [challengeSubmissions, myOwnedMemberIds],
    )
    const resourceByResourceId = useMemo<Map<string, BackendResource>>(
        () => {
            const mapping = new Map<string, BackendResource>()
            const adminResources = resources ?? []

            adminResources.forEach(resource => {
                if (!resource?.id) {
                    return
                }

                mapping.set(resource.id, resource)
            })
            return mapping
        },
        [resources],
    )
    const enhanceSubmissionForSubmitter = useCallback(
        (submission: SubmissionInfo): SubmissionInfo => {
            const memberId = submission.memberId ? `${submission.memberId}`.trim() : ''
            const submitterResource = memberId.length
                ? resourceMemberIdMapping?.[memberId]
                : undefined

            const resolveReviewerUpdate = (reviewInfo: ReviewInfo): Partial<ReviewInfo> | undefined => {
                const trimmedHandle = reviewInfo.reviewerHandle?.trim()

                if (trimmedHandle) {
                    if (trimmedHandle === reviewInfo.reviewerHandle) {
                        return undefined
                    }

                    return {
                        reviewerHandle: trimmedHandle,
                    }
                }

                if (!reviewInfo.resourceId) {
                    return undefined
                }

                const reviewerResource = resourceByResourceId.get(reviewInfo.resourceId)
                if (!reviewerResource?.memberHandle) {
                    return undefined
                }

                const rating = typeof reviewerResource.maxRating === 'number'
                    ? reviewerResource.maxRating
                    : typeof reviewerResource.rating === 'number'
                        ? reviewerResource.rating
                        : undefined

                return {
                    reviewerHandle: reviewerResource.memberHandle,
                    reviewerHandleColor: reviewerResource.handleColor ?? reviewInfo.reviewerHandleColor,
                    reviewerMaxRating: rating ?? reviewInfo.reviewerMaxRating,
                }
            }

            const resolveSubmitterUpdate = (reviewInfo: ReviewInfo): Partial<ReviewInfo> | undefined => {
                const trimmedHandle = reviewInfo.submitterHandle?.trim()

                if (trimmedHandle) {
                    if (trimmedHandle === reviewInfo.submitterHandle) {
                        return undefined
                    }

                    return {
                        submitterHandle: trimmedHandle,
                    }
                }

                if (!submitterResource?.memberHandle) {
                    return undefined
                }

                const rating = typeof submitterResource.maxRating === 'number'
                    ? submitterResource.maxRating
                    : typeof submitterResource.rating === 'number'
                        ? submitterResource.rating
                        : undefined

                return {
                    submitterHandle: submitterResource.memberHandle,
                    submitterHandleColor: submitterResource.handleColor ?? reviewInfo.submitterHandleColor,
                    submitterMaxRating: rating ?? reviewInfo.submitterMaxRating,
                }
            }

            const ensureReviewInfoHandles = (reviewInfo?: ReviewInfo): ReviewInfo | undefined => {
                if (!reviewInfo) {
                    return reviewInfo
                }

                const reviewerUpdate = resolveReviewerUpdate(reviewInfo)
                const submitterUpdate = resolveSubmitterUpdate(reviewInfo)

                if (!reviewerUpdate && !submitterUpdate) {
                    return reviewInfo
                }

                return {
                    ...reviewInfo,
                    ...reviewerUpdate,
                    ...submitterUpdate,
                }
            }

            const ensureReviewResultHandles = (reviewResult: ReviewResult): ReviewResult => {
                const reviewerHandle = reviewResult.reviewerHandle?.trim()
                if (reviewerHandle) {
                    if (reviewerHandle === reviewResult.reviewerHandle) {
                        return reviewResult
                    }

                    return {
                        ...reviewResult,
                        reviewerHandle,
                    }
                }

                if (!reviewResult.resourceId) {
                    return reviewResult
                }

                const reviewerResource = resourceByResourceId.get(reviewResult.resourceId)
                if (!reviewerResource?.memberHandle) {
                    return reviewResult
                }

                const rating = typeof reviewerResource.maxRating === 'number'
                    ? reviewerResource.maxRating
                    : typeof reviewerResource.rating === 'number'
                        ? reviewerResource.rating
                        : undefined

                return {
                    ...reviewResult,
                    reviewerHandle: reviewerResource.memberHandle,
                    reviewerHandleColor: reviewerResource.handleColor ?? reviewResult.reviewerHandleColor,
                    reviewerMaxRating: rating ?? reviewResult.reviewerMaxRating,
                }
            }

            const patchedReview = ensureReviewInfoHandles(submission.review)
            const patchedReviewResults = submission.reviews
                ? submission.reviews.map(ensureReviewResultHandles)
                : submission.reviews

            const resolvedUserInfo = submission.userInfo ?? submitterResource

            if (
                patchedReview === submission.review
                && patchedReviewResults === submission.reviews
                && resolvedUserInfo === submission.userInfo
            ) {
                return submission
            }

            return {
                ...submission,
                review: patchedReview,
                reviews: patchedReviewResults,
                userInfo: resolvedUserInfo,
            }
        },
        [resourceByResourceId, resourceMemberIdMapping],
    )
    const myReviewerResourceIds = useMemo<Set<string>>(
        () => new Set(
            (myResources ?? [])
                .filter(resource => {
                    const roleName = (resource.roleName || '').toLowerCase()
                    return roleName.includes('reviewer') && !roleName.includes('iterative')
                })
                .map(resource => resource.id)
                .filter((id): id is string => typeof id === 'string' && id.trim().length > 0),
        ),
        [myResources],
    )
    const hasReviewerAssignment = useCallback(
        (submission: SubmissionInfo): boolean => {
            const resourceIds = myReviewerResourceIds
            const primaryResourceId = submission.review?.resourceId
            if (primaryResourceId && resourceIds.has(primaryResourceId)) {
                return true
            }

            if (Array.isArray(submission.reviews)) {
                for (const review of submission.reviews) {
                    const reviewResourceId = review.resourceId
                    if (reviewResourceId && resourceIds.has(reviewResourceId)) {
                        return true
                    }
                }
            }

            return false
        },
        [myReviewerResourceIds],
    )
    const hasReviewPhaseReview = useCallback(
        (submission: SubmissionInfo): boolean => (
            isContestReviewPhaseSubmission(
                submission,
                challengeInfo?.phases,
            )
        ),
        [challengeInfo?.phases],
    )
    const resolvedReviews = useMemo(
        () => {
            const baseReviews = (() => {
                if (providedReviews.length) {
                    return providedReviews.filter(submission => shouldIncludeInReviewPhase(
                        submission,
                        challengeInfo?.phases,
                    ))
                }

                const fallbackFromBackend: SubmissionInfo[] = []

                if (backendChallengeSubmissions.length && myReviewerResourceIds.size) {
                    backendChallengeSubmissions.forEach(submission => {
                        const matchingReviews = (submission.review ?? []).filter(review => (
                            Boolean(review?.resourceId) && myReviewerResourceIds.has(review.resourceId)
                        ))

                        matchingReviews.forEach(review => {
                            const submissionForReviewer: BackendSubmission = {
                                ...submission,
                                review: [review],
                                reviewResourceMapping: {
                                    [review.resourceId]: review,
                                },
                            }
                            const converted = convertBackendSubmissionToSubmissionInfo(submissionForReviewer)
                            if (shouldIncludeInReviewPhase(converted, challengeInfo?.phases)) {
                                fallbackFromBackend.push(converted)
                            }
                        })
                    })
                }

                if (fallbackFromBackend.length) {
                    return fallbackFromBackend
                }

                if (!challengeSubmissions.length) {
                    return providedReviews
                }

                const fallback = challengeSubmissions.filter(hasReviewerAssignment)
                const filteredFallback = fallback.filter(submission => shouldIncludeInReviewPhase(
                    submission,
                    challengeInfo?.phases,
                ))
                return filteredFallback.length
                    ? filteredFallback
                    : providedReviews.filter(submission => shouldIncludeInReviewPhase(
                        submission,
                        challengeInfo?.phases,
                    ))
            })()

            const validReviewPhaseSubmissions = baseReviews.filter(hasReviewPhaseReview)

            if (isPrivilegedRole || (isChallengeCompleted && hasPassedReviewThreshold)) {
                return validReviewPhaseSubmissions
            }

            return validReviewPhaseSubmissions.filter(hasReviewerAssignment)
        },
        [
            backendChallengeSubmissions,
            challengeSubmissions,
            challengeInfo?.phases,
            hasReviewPhaseReview,
            hasReviewerAssignment,
            isChallengeCompleted,
            isPrivilegedRole,
            hasPassedReviewThreshold,
            myReviewerResourceIds,
            providedReviews,
        ],
    )
    const resolvedReviewsWithSubmitter = useMemo(
        () => resolvedReviews.map(enhanceSubmissionForSubmitter),
        [enhanceSubmissionForSubmitter, resolvedReviews],
    )
    const resolvedSubmitterReviews = useMemo(
        () => {
            if (providedSubmitterReviews.length) {
                return providedSubmitterReviews
            }

            if (!myOwnedMemberIds.size && !myOwnedSubmissionIds.size) {
                return providedSubmitterReviews
            }

            const source = challengeSubmissions.length
                ? challengeSubmissions
                : providedSubmitterReviews.length
                    ? providedSubmitterReviews
                    : providedReviews

            if (!source.length) {
                return providedSubmitterReviews
            }

            const fallback = source.filter(submission => {
                if (!submission) {
                    return false
                }

                if (!shouldIncludeInReviewPhase(submission, challengeInfo?.phases)) {
                    return false
                }

                if (!hasReviewPhaseReview(submission)) {
                    return false
                }

                const submissionMemberId = submission.memberId
                    ? `${submission.memberId}`.trim()
                    : ''
                if (submissionMemberId.length && myOwnedMemberIds.has(submissionMemberId)) {
                    return true
                }

                const submissionId = (submission.id ?? '').trim()
                if (submissionId.length && myOwnedSubmissionIds.has(submissionId)) {
                    return true
                }

                const reviewSubmissionId = (submission.review?.submissionId ?? '').trim()
                if (reviewSubmissionId.length && myOwnedSubmissionIds.has(reviewSubmissionId)) {
                    return true
                }

                return false
            })
                .map(enhanceSubmissionForSubmitter)

            if (fallback.length) {
                return fallback
            }

            return providedSubmitterReviews.filter(submission => (
                shouldIncludeInReviewPhase(
                    submission,
                    challengeInfo?.phases,
                )
                && hasReviewPhaseReview(submission)
            ))
        },
        [
            challengeSubmissions,
            enhanceSubmissionForSubmitter,
            challengeInfo?.phases,
            hasReviewPhaseReview,
            myOwnedMemberIds,
            myOwnedSubmissionIds,
            providedReviews,
            providedSubmitterReviews,
        ],
    )
    const filteredReviews = useMemo(
        () => {
            if (!resolvedReviewsWithSubmitter.length) {
                return resolvedReviewsWithSubmitter
            }

            const hasLatestFlag = hasIsLatestFlag(resolvedReviewsWithSubmitter)
            if (!hasLatestFlag) {
                return resolvedReviewsWithSubmitter
            }

            const latestOnly = resolvedReviewsWithSubmitter.filter(submission => submission.isLatest === true)
            return latestOnly.length ? latestOnly : resolvedReviewsWithSubmitter
        },
        [resolvedReviewsWithSubmitter],
    )
    const filteredSubmitterReviews = useMemo(
        () => {
            if (!resolvedSubmitterReviews.length) {
                return resolvedSubmitterReviews
            }

            const hasLatestFlag = hasIsLatestFlag(resolvedSubmitterReviews)
            if (!hasLatestFlag) {
                return resolvedSubmitterReviews
            }

            const latestOnly = resolvedSubmitterReviews.filter(submission => submission.isLatest === true)
            return latestOnly.length ? latestOnly : resolvedSubmitterReviews
        },
        [resolvedSubmitterReviews],
    )
    const hideHandleColumn = props.isActiveChallenge
        && actionChallengeRole === REVIEWER

    // show loading ui when fetching data
    const isSubmitterView = actionChallengeRole === SUBMITTER
        && selectedTab !== APPROVAL
    const reviewRows = isSubmitterView ? filteredSubmitterReviews : filteredReviews

    if (props.isLoadingReview) {
        return <TableLoading />
    }

    if (selectedTab === 'Appeals Response') {
        return (
            <TableAppealsResponse
                datas={resolvedReviewsWithSubmitter}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
                hideHandleColumn={hideHandleColumn}
            />
        )
    }

    // show no record message
    if (!reviewRows.length) {
        return <TableNoRecord message='No reviews yet' />
    }

    if (selectedTab === 'Appeals') {
        return isSubmitterView ? (
            <TableAppealsForSubmitter
                datas={filteredSubmitterReviews}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
            />
        ) : (
            <TableAppeals
                datas={filteredReviews}
                isDownloading={props.isDownloading}
                downloadSubmission={props.downloadSubmission}
                mappingReviewAppeal={props.mappingReviewAppeal}
                hideHandleColumn={hideHandleColumn}
            />
        )
    }

    return isSubmitterView ? (
        <TableReviewForSubmitter
            datas={filteredSubmitterReviews}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
        />
    ) : (
        <TableReview
            datas={filteredReviews}
            isDownloading={props.isDownloading}
            downloadSubmission={props.downloadSubmission}
            mappingReviewAppeal={props.mappingReviewAppeal}
            hideHandleColumn={hideHandleColumn}
        />
    )
}

export default TabContentReview

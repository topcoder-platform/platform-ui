import type { MouseEvent } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import classNames from 'classnames'

import { copyTextToClipboard } from '~/libs/shared'
import { IconOutline, Tooltip } from '~/libs/ui'

import {
    DOWNLOAD_OWN_SUBMISSION_TOOLTIP,
    VIEW_OWN_SCORECARD_TOOLTIP,
    VIRUS_SCAN_FAILED_MESSAGE,
} from '../../utils/constants'
import { getReviewRoute } from '../../utils/routes'
import {
    ChallengeDetailContextModel,
    ChallengeInfo,
} from '../../models'
import type {
    ReviewInfo,
    ReviewResult,
} from '../../models'
import { isReviewPhaseCurrentlyOpen } from '../../utils'

import {
    formatScoreDisplay,
    getHandleColor,
    getProfileUrl,
} from './columnUtils'
import type {
    AggregatedReviewDetail,
    DownloadButtonConfig,
    ScoreVisibilityConfig,
    SubmissionRow,
} from './types'
import styles from './TableColumnRenderers.module.scss'

/**
 * Renders the submission ID cell with download controls and copy-to-clipboard actions.
 */
export function renderSubmissionIdCell(
    submission: SubmissionRow,
    config: DownloadButtonConfig,
): JSX.Element {
    const configWithDefaults: DownloadButtonConfig = config
    const {
        isDownloading,
        downloadSubmission,
        shouldRestrictSubmitterToOwnSubmission,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        restrictionMessage,
        ownedMemberIds,
        virusScanFailedMessage = VIRUS_SCAN_FAILED_MESSAGE,
        downloadOwnSubmissionTooltip = DOWNLOAD_OWN_SUBMISSION_TOOLTIP,
    }: DownloadButtonConfig = configWithDefaults

    const isOwnedSubmission = submission.memberId
        ? ownedMemberIds.has(submission.memberId)
        : false
    const isOwnershipRestricted = shouldRestrictSubmitterToOwnSubmission && !isOwnedSubmission
    const isRestrictedForMember = isSubmissionDownloadRestrictedForMember(submission.memberId)
    const memberRestrictionMessage = getRestrictionMessageForMember(submission.memberId)
    const failedScan = submission.virusScan === false
    const isButtonDisabled = Boolean(
        isDownloading[submission.id]
        || isRestrictedForMember
        || failedScan,
    )

    const downloadButton = (
        <button
            onClick={function onClick() {
                if (isRestrictedForMember || failedScan || isOwnershipRestricted) {
                    return
                }

                downloadSubmission(submission.id)
            }}
            className={classNames(styles.textBlue, styles.linkButton)}
            disabled={isButtonDisabled}
            type='button'
        >
            {submission.id}
        </button>
    )

    async function handleCopySubmissionId(
        event: MouseEvent<HTMLButtonElement>,
    ): Promise<void> {
        event.stopPropagation()
        event.preventDefault()

        if (!submission.id) {
            return
        }

        await copyTextToClipboard(submission.id)
        toast.success('Submission ID copied to clipboard', {
            toastId: `challenge-submission-id-copy-${submission.id}`,
        })
    }

    let tooltipContent: string | undefined
    if (failedScan) {
        tooltipContent = virusScanFailedMessage
    } else if (isRestrictedForMember) {
        tooltipContent = memberRestrictionMessage
            ?? restrictionMessage
            ?? downloadOwnSubmissionTooltip
    } else if (isOwnershipRestricted) {
        tooltipContent = downloadOwnSubmissionTooltip
    } else if (isSubmissionDownloadRestricted && restrictionMessage) {
        tooltipContent = restrictionMessage
    }

    const downloadControl = isOwnershipRestricted ? (
        <span className={styles.textBlue}>
            {submission.id}
        </span>
    ) : (
        downloadButton
    )

    const renderedDownloadButton = tooltipContent ? (
        <Tooltip content={tooltipContent} triggerOn='click-hover'>
            <span className={styles.tooltipTrigger}>
                {downloadControl}
            </span>
        </Tooltip>
    ) : (
        downloadControl
    )

    return (
        <span className={styles.submissionCell}>
            {renderedDownloadButton}
            <button
                type='button'
                className={styles.copyButton}
                aria-label='Copy submission ID'
                title='Copy submission ID'
                onClick={handleCopySubmissionId}
                disabled={!submission.id}
            >
                <IconOutline.DocumentDuplicateIcon />
            </button>
        </span>
    )
}

/**
 * Renders the submitter handle including rating-based color and profile link.
 */
export function renderSubmitterHandleCell(submission: SubmissionRow): JSX.Element {
    const aggregated = submission.aggregated
    const aggregatedSubmission = aggregated?.submission
    const fallbackUserInfo = submission.userInfo ?? aggregatedSubmission?.userInfo
    const submitterHandle = [
        aggregated?.submitterHandle,
        submission.review?.submitterHandle,
        fallbackUserInfo?.memberHandle,
    ]
        .map(handle => handle?.trim())
        .find((handle): handle is string => Boolean(handle))

    if (!submitterHandle) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const explicitColor = aggregated?.submitterHandleColor
        ?? submission.review?.submitterHandleColor
        ?? fallbackUserInfo?.handleColor
    const maxRating = aggregated?.submitterMaxRating
        ?? submission.review?.submitterMaxRating
        ?? fallbackUserInfo?.maxRating
        ?? fallbackUserInfo?.rating
    const resolvedColor = getHandleColor(explicitColor, submitterHandle, maxRating) ?? '#2a2a2a'
    const profileUrl = getProfileUrl(submitterHandle)

    return (
        <a
            href={profileUrl}
            style={{ color: resolvedColor }}
            target='_blank'
            rel='noreferrer'
        >
            {submitterHandle}
        </a>
    )
}

/**
 * Renders the latest review date string for the submission.
 */
export function renderReviewDateCell(submission: SubmissionRow): JSX.Element {
    const reviewDateDisplay = submission.aggregated?.latestReviewDateString

    if (!reviewDateDisplay) {
        return (
            <span className={styles.notReviewed}>
                Not Reviewed
            </span>
        )
    }

    return <span>{reviewDateDisplay}</span>
}

/**
 * Renders the aggregated average score for a submission, honoring visibility rules.
 */
export function renderReviewScoreCell(
    submission: SubmissionRow,
    config: ScoreVisibilityConfig,
): JSX.Element {
    const configWithDefaults: ScoreVisibilityConfig = config
    const {
        canDisplayScores,
        canViewScorecard,
        viewOwnScorecardTooltip = VIEW_OWN_SCORECARD_TOOLTIP,
    }: ScoreVisibilityConfig = configWithDefaults

    if (!canDisplayScores(submission)) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const aggregatedReviews = submission.aggregated?.reviews ?? []
    const hasIncompleteReview = aggregatedReviews.some(review => {
        const statusRaw = review.reviewInfo?.status ?? review.status
        const normalizedStatus = typeof statusRaw === 'string'
            ? statusRaw
                .trim()
                .toUpperCase()
            : ''
        if (!normalizedStatus) {
            return true
        }

        return normalizedStatus !== 'COMPLETED'
    })

    if (!aggregatedReviews.length || hasIncompleteReview) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const rawScoreDisplay = submission.aggregated?.averageFinalScoreDisplay
    if (!rawScoreDisplay) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    if (!canViewScorecard) {
        return (
            <Tooltip
                content={viewOwnScorecardTooltip}
                triggerOn='click-hover'
            >
                <span className={styles.tooltipTrigger}>
                    <span className={styles.textBlue}>
                        --
                    </span>
                </span>
            </Tooltip>
        )
    }

    return <span>{rawScoreDisplay}</span>
}

interface ReviewerDisplayData {
    color: string
    handle?: string
    name: string
    profileUrl?: string
}

function findByResourceId<T extends { resourceId?: string | null }>(
    items: T[],
    resourceId: string | undefined,
): T | undefined {
    if (!resourceId) {
        return undefined
    }

    return items.find(item => item.resourceId === resourceId)
}

function getValueFromMap<T>(
    map: Record<string, T | undefined> | undefined,
    resourceId: string | undefined,
): T | undefined {
    if (!map || !resourceId) {
        return undefined
    }

    return map[resourceId]
}

function pickFirstNonEmptyString(values: Array<string | null | undefined>): string | undefined {
    for (const value of values) {
        const trimmed = value?.trim()
        if (trimmed) {
            return trimmed
        }
    }

    return undefined
}

function pickFirstNumber(values: Array<number | null | undefined>): number | undefined {
    for (const value of values) {
        if (typeof value === 'number') {
            return value
        }
    }

    return undefined
}

function buildReviewerDisplayData(
    submission: SubmissionRow,
    reviewDetail: AggregatedReviewDetail,
): ReviewerDisplayData {
    const aggregatedSubmission = submission.aggregated?.submission
    const resourceId = reviewDetail.reviewInfo?.resourceId ?? reviewDetail.resourceId
    const candidateReviewInfos: ReviewInfo[] = [
        reviewDetail.reviewInfo,
        aggregatedSubmission?.review,
        submission.review,
    ].filter((info): info is ReviewInfo => Boolean(info))
    const candidateReviewResults: ReviewResult[] = [
        ...(submission.reviews ?? []),
        ...(aggregatedSubmission?.reviews ?? []),
    ].filter((result): result is ReviewResult => Boolean(result))

    const matchingInfo = findByResourceId(candidateReviewInfos, resourceId)
    const matchingResult = findByResourceId(candidateReviewResults, resourceId)

    const reviewerHandle = pickFirstNonEmptyString([
        reviewDetail.reviewerHandle,
        reviewDetail.reviewInfo?.reviewerHandle,
        matchingInfo?.reviewerHandle,
        matchingResult?.reviewerHandle,
        getValueFromMap(submission.aggregated?.reviewerHandles, resourceId),
    ])

    const reviewerMaxRating = pickFirstNumber([
        reviewDetail.reviewerMaxRating,
        reviewDetail.reviewInfo?.reviewerMaxRating ?? undefined,
        matchingInfo?.reviewerMaxRating ?? undefined,
        matchingResult?.reviewerMaxRating ?? undefined,
        getValueFromMap(submission.aggregated?.reviewerMaxRatings, resourceId),
    ])

    const explicitColor = pickFirstNonEmptyString([
        reviewDetail.reviewerHandleColor,
        reviewDetail.reviewInfo?.reviewerHandleColor,
        matchingInfo?.reviewerHandleColor,
        matchingResult?.reviewerHandleColor,
        getValueFromMap(submission.aggregated?.reviewerHandleColors, resourceId),
    ])

    const color = getHandleColor(
        explicitColor,
        reviewerHandle,
        reviewerMaxRating,
    ) ?? '#2a2a2a'

    const name = reviewerHandle ?? 'Not assigned'
    const profileUrl = reviewerHandle ? getProfileUrl(reviewerHandle) : undefined

    return {
        color,
        handle: reviewerHandle,
        name,
        profileUrl,
    }
}

/**
 * Renders a reviewer cell for the given review index.
 */
export function renderReviewerCell(
    submission: SubmissionRow,
    reviewIndex: number,
): JSX.Element {
    const reviewDetail = submission.aggregated?.reviews?.[reviewIndex]

    if (!reviewDetail) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const {
        color,
        handle,
        name,
        profileUrl,
    }: ReviewerDisplayData = buildReviewerDisplayData(submission, reviewDetail)

    return (
        <span className={styles.reviewer}>
            {profileUrl ? (
                <a
                    href={profileUrl}
                    style={{ color }}
                    target='_blank'
                    rel='noreferrer'
                >
                    {handle}
                </a>
            ) : (
                <span style={{ color }}>
                    {name}
                </span>
            )}
        </span>
    )
}

interface PendingReopenState {
    review?: AggregatedReviewDetail
    submission?: SubmissionRow
    isOwnReview?: boolean
}

function createReopenActionButtons(
    challengeInfo: ChallengeDetailContextModel['challengeInfo'],
    submission: SubmissionRow,
    aggregatedReviews: AggregatedReviewDetail[] | undefined,
    {
        canManageCompletedReviews,
        isReopening,
        openReopenDialog,
        pendingReopen,
    }: {
        canManageCompletedReviews: boolean
        isReopening: boolean
        openReopenDialog: (submission: SubmissionRow, review: AggregatedReviewDetail) => void
        pendingReopen: PendingReopenState | undefined
    },
): JSX.Element[] {
    if (!canManageCompletedReviews) {
        return []
    }

    const buttons: JSX.Element[] = []
    const reviews = aggregatedReviews ?? []

    reviews.forEach(review => {
        const reviewInfo = review.reviewInfo
        if (!reviewInfo?.id) {
            return
        }

        if ((reviewInfo.status ?? '').toUpperCase() !== 'COMPLETED') {
            return
        }

        if (!isReviewPhaseCurrentlyOpen(challengeInfo, reviewInfo.phaseId)) {
            return
        }

        const isTargetReview = pendingReopen?.review?.reviewInfo?.id === reviewInfo.id

        function handleReopenClick(): void {
            openReopenDialog(submission, {
                ...review,
                reviewInfo,
            } as AggregatedReviewDetail)
        }

        buttons.push(
            // eslint-disable-next-line jsx-a11y/control-has-associated-label
            <button
                key={`reopen-${reviewInfo.id}`}
                type='button'
                className={classNames(styles.actionButton, styles.textBlue)}
                onClick={handleReopenClick}
                disabled={isReopening && isTargetReview}
                title='Reopen review'
            >
                <i className='icon-reopen' />
            </button>,
        )
    })

    return buttons
}

/**
 * Renders an individual review score, linking to the review detail when allowed.
 */
export function renderScoreCell(
    submission: SubmissionRow,
    reviewIndex: number,
    config: ScoreVisibilityConfig,
    challengeInfo?: ChallengeInfo | undefined,
    pendingReopen?: PendingReopenState | undefined,
    canManageCompletedReviews?: boolean,
    isReopening?: boolean,
    openReopenDialog?: (submission: SubmissionRow, review: AggregatedReviewDetail) => void,
): JSX.Element {
    const configWithDefaults: ScoreVisibilityConfig = config
    const {
        canDisplayScores,
        canViewScorecard,
        viewOwnScorecardTooltip = VIEW_OWN_SCORECARD_TOOLTIP,
        getReviewUrl,
    }: ScoreVisibilityConfig = configWithDefaults

    const reviewDetail = submission.aggregated?.reviews?.[reviewIndex]

    if (!reviewDetail) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const reviewInfo = reviewDetail.reviewInfo
    const reviewId = reviewInfo?.id || reviewDetail.reviewId

    if (!reviewInfo || !reviewId) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    if (!canDisplayScores(submission)) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const formattedScore = formatScoreDisplay(reviewDetail.finalScore)
    const scoreLabel = formattedScore ?? '--'

    const reopenButtons = createReopenActionButtons(
        challengeInfo,
        submission,
        [reviewDetail], // pass single review in an array
        {
            canManageCompletedReviews: !!canManageCompletedReviews,
            isReopening: !!isReopening,
            openReopenDialog: openReopenDialog as (submission: SubmissionRow, review: AggregatedReviewDetail) => void,
            pendingReopen,
        },
    )

    const reopenButton = reopenButtons.length ? reopenButtons[0] : undefined

    if (!canViewScorecard) {
        return (
            <Tooltip
                content={viewOwnScorecardTooltip}
                triggerOn='click-hover'
            >
                <span className={styles.tooltipTrigger}>
                    <span className={styles.textBlue}>
                        {scoreLabel}
                    </span>
                </span>
            </Tooltip>
        )
    }

    const reviewUrl = getReviewUrl ? getReviewUrl(reviewId) : getReviewRoute(reviewId)

    return (
        <div className={styles.scoreReopenBlock}>
            <Link
                to={reviewUrl}
                className={styles.textBlue}
            >
                {scoreLabel}

            </Link>
            <span>{reopenButton}</span>
        </div>
    )

}

/**
 * Renders appeals information for the given review index, linking when accessible.
 */
export function renderAppealsCell(
    submission: SubmissionRow,
    reviewIndex: number,
    config: ScoreVisibilityConfig,
): JSX.Element {
    const configWithDefaults: ScoreVisibilityConfig = config
    const {
        canViewScorecard,
        viewOwnScorecardTooltip = VIEW_OWN_SCORECARD_TOOLTIP,
        getReviewUrl,
    }: ScoreVisibilityConfig = configWithDefaults

    const reviewDetail = submission.aggregated?.reviews?.[reviewIndex]

    if (!reviewDetail) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const reviewInfo = reviewDetail.reviewInfo
    const reviewId = reviewInfo?.id || reviewDetail.reviewId

    if (!reviewInfo || !reviewId) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const totalAppeals = reviewDetail.totalAppeals ?? 0
    const reviewStatus = (reviewInfo.status ?? '').toUpperCase()

    if (!totalAppeals && reviewStatus !== 'COMPLETED') {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    if (!canViewScorecard) {
        return (
            <Tooltip
                content={viewOwnScorecardTooltip}
                triggerOn='click-hover'
            >
                <span
                    className={classNames(
                        styles.tooltipTrigger,
                        styles.appealsLink,
                        'last-element',
                    )}
                >
                    --
                </span>
            </Tooltip>
        )
    }

    const reviewUrl = getReviewUrl ? getReviewUrl(reviewId) : getReviewRoute(reviewId)

    return (
        <Link
            className={classNames(
                styles.appealsLink,
                'last-element',
            )}
            to={reviewUrl}
        >
            <span className={styles.textBlue}>
                {totalAppeals}
            </span>
        </Link>
    )
}

/**
 * Renders the remaining appeals count for the given review index.
 */
export function renderRemainingCell(
    submission: SubmissionRow,
    reviewIndex: number,
): JSX.Element {
    const reviewDetail = submission.aggregated?.reviews?.[reviewIndex]

    if (!reviewDetail || (!reviewDetail.reviewInfo && !reviewDetail.reviewId)) {
        return (
            <span className={styles.notReviewed}>
                --
            </span>
        )
    }

    const totalAppeals = reviewDetail.totalAppeals ?? 0
    const finishedAppeals = reviewDetail.finishedAppeals ?? 0
    const remainingAppeals = Math.max(totalAppeals - finishedAppeals, 0)

    return (
        <span className={styles.textBlue}>
            {remainingAppeals}
        </span>
    )
}

/**
 * Table Review Appeals.
 */
import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
    useState,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'
import { copyTextToClipboard, handleError, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'
import { getRatingColor } from '~/libs/core'

import { APPROVAL, REVIEWER, WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { useRole, useRoleProps, useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import {
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    ReviewAppContextModel,
    SubmissionInfo,
} from '../../models'
import {
    AggregatedReviewDetail,
    AggregatedSubmissionReviews,
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    getHandleUrl,
    getSubmissionHistoryKey,
    hasIsLatestFlag,
    isReviewPhase,
    isReviewPhaseCurrentlyOpen,
    partitionSubmissionHistory,
    refreshChallengeReviewData,
    REOPEN_MESSAGE_OTHER,
    REOPEN_MESSAGE_SELF,
    SubmissionHistoryPartition,
} from '../../utils'
import { ConfirmModal } from '../ConfirmModal'
import { updateReview } from '../../services'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    tab: string
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    hideHandleColumn?: boolean
    isActiveChallenge?: boolean
}

type SubmissionRow = SubmissionInfo & {
    aggregated?: AggregatedSubmissionReviews
}

const resolveRatingValue = (value: number | string | null | undefined): number | undefined => {
    if (typeof value === 'number' && Number.isFinite(value)) {
        return value
    }

    if (typeof value === 'string') {
        const trimmed = value.trim()
        if (!trimmed.length) {
            return undefined
        }

        const parsed = Number.parseFloat(trimmed)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
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
        pendingReopen: { review?: AggregatedReviewDetail } | undefined
    },
): JSX.Element[] {
    if (!canManageCompletedReviews) {
        return []
    }

    const buttons: JSX.Element[] = []

    const reviews = aggregatedReviews ?? []

    reviews.forEach(rv => {
        const reviewInfo = rv?.reviewInfo
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
                ...rv,
                reviewInfo,
            } as AggregatedReviewDetail)
        }

        buttons.push(
            <button
                key={`reopen-${reviewInfo.id}`}
                type='button'
                className={classNames(
                    styles.actionButton,
                    styles.textBlue,
                )}
                onClick={handleReopenClick}
                disabled={isReopening && isTargetReview}
            >
                <i className='icon-reopen' />
                Reopen review
            </button>,
        )
    })

    return buttons
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const {
        challengeInfo,
        reviewers,
        myResources,
        myRoles,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole }: useRoleProps = useRole()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const datas = props.datas
    const downloadSubmission = props.downloadSubmission
    const isActiveChallenge = props.isActiveChallenge
    const firstSubmissions = props.firstSubmissions
    const hideHandleColumn = props.hideHandleColumn
    const isDownloading = props.isDownloading
    const mappingReviewAppeal = props.mappingReviewAppeal
    const tab = props.tab
    const isSubmissionTab = (tab || '').toLowerCase() === 'submission'
    const wrapperClassName = props.className

    const submissionTypes = new Set(
        datas
            .map(d => d.type)
            .filter((t): t is string => Boolean(t)),
    )
    const filteredChallengeSubmissions = submissionTypes.size
        ? (challengeInfo?.submissions ?? [])
            .filter(s => s.type && submissionTypes.has(s.type))
        : (challengeInfo?.submissions ?? [])

    const submissionHistory = useMemo<SubmissionHistoryPartition>(
        () => partitionSubmissionHistory(datas, filteredChallengeSubmissions),
        [datas, filteredChallengeSubmissions],
    )
    const {
        latestSubmissions,
        latestSubmissionIds,
        historyByMember,
    }: SubmissionHistoryPartition = submissionHistory
    const shouldShowHistoryActions = useMemo(
        () => isSubmissionTab && hasIsLatestFlag(datas),
        [datas, isSubmissionTab],
    )

    const submissionMetaById = useMemo(() => {
        const map = new Map<string, SubmissionInfo>()
        filteredChallengeSubmissions.forEach(submission => {
            if (submission?.id) {
                map.set(submission.id, submission)
            }
        })
        datas.forEach(submission => {
            if (submission?.id && !map.has(submission.id)) {
                map.set(submission.id, submission)
            }
        })
        return map
    }, [datas, filteredChallengeSubmissions])

    const resolveSubmissionMeta = useCallback(
        (submissionId: string): SubmissionInfo | undefined => submissionMetaById.get(submissionId),
        [submissionMetaById],
    )

    const restrictToLatest = useMemo(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const [historyKey, setHistoryKey] = useState<string | undefined>(undefined)

    const historyEntriesForModal = useMemo<SubmissionInfo[]>(
        () => (historyKey ? historyByMember.get(historyKey) ?? [] : []),
        [historyByMember, historyKey],
    )

    const closeHistoryModal = useCallback((): void => {
        setHistoryKey(undefined)
    }, [])

    const openHistoryModal = useCallback(
        (memberId: string | undefined, submissionId: string): void => {
            const key = getSubmissionHistoryKey(memberId, submissionId)
            const historyEntries = historyByMember.get(key)
            if (!historyEntries || historyEntries.length === 0) {
                return
            }

            setHistoryKey(key)
        },
        [historyByMember],
    )

    const getHistoryRestriction = useCallback(
        (submission: SubmissionInfo): { message?: string; restricted: boolean } => {
            const restrictedForMember = isSubmissionDownloadRestrictedForMember(submission.memberId)
            const message = restrictedForMember
                ? getRestrictionMessageForMember(submission.memberId) ?? restrictionMessage
                : undefined

            return {
                message,
                restricted: restrictedForMember,
            }
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const handleHistoryButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        if (!submissionId) {
            return
        }

        const memberIdValue = event.currentTarget.dataset.memberId
        const normalizedMemberId = memberIdValue && memberIdValue.length ? memberIdValue : undefined
        openHistoryModal(normalizedMemberId, submissionId)
    }, [openHistoryModal])

    // Aggregated mode is used on the Appeals tab for admins/copilots (not for reviewers)
    const hasReviewerRole = useMemo(
        () => myRoles
            .some(role => role?.toLowerCase()
                .includes('reviewer')),
        [myRoles],
    )
    const hasCopilotRole = useMemo(
        () => myRoles
            .some(role => role?.toLowerCase()
                .includes('copilot')),
        [myRoles],
    )
    const hasAdminRole = useMemo(
        () => myRoles
            .some(role => role?.toLowerCase()
                .includes('admin')),
        [myRoles],
    )

    const isTopcoderAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === 'administrator',
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const canViewHistory = hasAdminRole || hasCopilotRole || isTopcoderAdmin

    const shouldShowAggregatedReviewScore = useMemo(
        () => !(hasReviewerRole && !hasCopilotRole && !hasAdminRole && !isTopcoderAdmin),
        [hasAdminRole, hasCopilotRole, hasReviewerRole, isTopcoderAdmin],
    )

    // Aggregated view groups one row per submission and shows reviewer columns + average score.
    const isAggregatedView = useMemo(() => {
        if (tab === 'Appeals' || tab === 'Review') {
            return true
        }

        if (tab === 'Appeals Response') {
            return hasCopilotRole || hasAdminRole || isTopcoderAdmin
        }

        return false
    }, [hasAdminRole, hasCopilotRole, isTopcoderAdmin, tab])

    const submissionsForAggregation = useMemo(
        () => (restrictToLatest ? latestSubmissions : datas),
        [datas, latestSubmissions, restrictToLatest],
    )

    const aggregatedRows = useMemo(() => {
        if (!isAggregatedView) {
            return [] as AggregatedSubmissionReviews[]
        }

        return aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers,
            submissions: submissionsForAggregation,
        })
    }, [isAggregatedView, mappingReviewAppeal, reviewers, submissionsForAggregation])

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
        () => {
            const rows = aggregatedRows.map(row => ({
                ...row.submission,
                aggregated: row,
            }))

            if (!restrictToLatest) {
                return rows
            }

            return rows.filter(row => latestSubmissionIds.has(row.id))
        },
        [aggregatedRows, latestSubmissionIds, restrictToLatest],
    )

    const maxReviewCount = useMemo(
        () => (isAggregatedView
            ? aggregatedRows.reduce(
                (count, row) => Math.max(count, row.reviews.length),
                0,
            )
            : 0),
        [aggregatedRows, isAggregatedView],
    )

    // Only allow Appeals columns if the challenge type/track supports it
    // AND the challenge actually contains an Appeals-related phase.
    const hasAppealsPhase = useMemo(() => {
        const phases = challengeInfo?.phases ?? []
        return phases.some(p => {
            const name = (p?.name || '').toLowerCase()
            return name === 'appeals' || name === 'appeals response'
        })
    }, [challengeInfo?.phases])

    const allowsAppeals = useMemo(
        () => hasAppealsPhase && !(
            includes(WITHOUT_APPEAL, challengeType?.name)
            || includes(WITHOUT_APPEAL, challengeTrack?.name)
        ),
        [challengeTrack?.name, challengeType?.name, hasAppealsPhase],
    )

    // Only show "Respond to Appeals" when Appeals Response phase is open
    const isAppealsResponsePhaseOpen = useMemo(() => {
        const phases = challengeInfo?.phases ?? []
        return phases.some(p => (p?.name || '').toLowerCase() === 'appeals response' && p.isOpen)
    }, [challengeInfo?.phases])

    const [isReopening, setIsReopening] = useState(false)
    const [pendingReopen, setPendingReopen] = useState<{
        review?: AggregatedReviewDetail
        submission?: SubmissionRow
        isOwnReview?: boolean
    } | undefined>(undefined)
    const myResourceIds = useMemo(
        () => new Set(myResources.map(resource => resource.id)),
        [myResources],
    )

    const canManageCompletedReviews = useMemo(
        () => Boolean(
            isActiveChallenge
            && isAggregatedView
            && isReviewPhase(challengeInfo)
            && (
                hasReviewerRole
                || hasCopilotRole
                || hasAdminRole
                || isTopcoderAdmin
            ),
        ),
        [
            challengeInfo,
            hasAdminRole,
            hasCopilotRole,
            hasReviewerRole,
            isActiveChallenge,
            isAggregatedView,
            isTopcoderAdmin,
        ],
    )

    const openReopenDialog = useCallback((submission: SubmissionRow, review: AggregatedReviewDetail) => {
        const resourceId = review.reviewInfo?.resourceId
            ?? review.resourceId
        const isOwnReview = resourceId ? myResourceIds.has(resourceId) : false

        setPendingReopen({
            isOwnReview,
            review,
            submission,
        })
    }, [myResourceIds])

    const closeReopenDialog = useCallback(() => {
        setPendingReopen(undefined)
    }, [])

    const handleConfirmReopen = useCallback(async () => {
        const reviewId = pendingReopen?.review?.reviewInfo?.id

        if (!reviewId) {
            closeReopenDialog()
            return
        }

        setIsReopening(true)

        try {
            await updateReview(reviewId, { committed: false, status: 'PENDING' })
            toast.success('Scorecard reopened.')
            closeReopenDialog()

            const challengeId = challengeInfo?.id

            await refreshChallengeReviewData(challengeId)
        } catch (error) {
            handleError(error)
        } finally {
            setIsReopening(false)
        }
    }, [
        challengeInfo?.id,
        closeReopenDialog,
        loginUserInfo?.userId,
        pendingReopen,
        reviewers,
    ])

    /* eslint-disable indent, padding-line-between-statements */
    // eslint-disable-next-line complexity
    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const submissionColumn: TableColumn<SubmissionRow> = {
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (data: SubmissionRow) => {
                const failedScan = data.virusScan === false
                const isButtonDisabled = Boolean(
                    isDownloading[data.id]
                    || isSubmissionDownloadRestricted
                    || failedScan,
                )

                const downloadButton = (
                    <button
                        onClick={function onClick() {
                            if (isSubmissionDownloadRestricted || failedScan) {
                                return
                            }

                            downloadSubmission(data.id)
                        }}
                        className={styles.textBlue}
                        disabled={isButtonDisabled}
                        type='button'
                    >
                        {data.id}
                    </button>
                )

                async function handleCopySubmissionId(
                    event: MouseEvent<HTMLButtonElement>,
                ): Promise<void> {
                    event.stopPropagation()
                    event.preventDefault()

                    if (!data.id) {
                        return
                    }

                    await copyTextToClipboard(data.id)
                    toast.success('Submission ID copied to clipboard', {
                        toastId: `challenge-submission-id-copy-${data.id}`,
                    })
                }

                const tooltipContent = failedScan
                    ? 'Submission failed virus scan'
                    : restrictionMessage
                const renderedDownloadButton = (isSubmissionDownloadRestricted || failedScan) ? (
                    <Tooltip content={tooltipContent} triggerOn='click-hover'>
                        <span className={styles.tooltipTrigger}>
                            {downloadButton}
                        </span>
                    </Tooltip>
                ) : (
                    downloadButton
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
                            disabled={!data.id}
                        >
                            <IconOutline.DocumentDuplicateIcon />
                        </button>
                    </span>
                )
            },
            type: 'element',
        }

        if (isAggregatedView) {
            // Optional Handle column (submitter) — keep parity with non-aggregated view
            const handleColumnAgg: TableColumn<SubmissionRow> | undefined = hideHandleColumn
                ? undefined
                : {
                    columnId: 'handle-aggregated',
                    label: 'Handle',
                    propertyName: 'handle',
                    renderer: (data: SubmissionRow) => {
                        const aggregatedRating = resolveRatingValue(data.aggregated?.submitterMaxRating)
                        const reviewRating = resolveRatingValue(data.review?.submitterMaxRating)
                        const userRating = resolveRatingValue(data.userInfo?.maxRating)
                        const computedColor = data.aggregated?.submitterHandleColor
                            ?? data.review?.submitterHandleColor
                            ?? (aggregatedRating !== undefined ? getRatingColor(aggregatedRating) : undefined)
                            ?? (reviewRating !== undefined ? getRatingColor(reviewRating) : undefined)
                            ?? data.userInfo?.handleColor
                            ?? (userRating !== undefined ? getRatingColor(userRating) : undefined)
                            ?? '#2a2a2a'

                        return (
                            <a
                                href={getHandleUrl(data.userInfo)}
                                target='_blank'
                                rel='noreferrer'
                                style={{ color: computedColor }}
                                onClick={function onClick() {
                                    window.open(getHandleUrl(data.userInfo), '_blank')
                                }}
                            >
                                {data.aggregated?.submitterHandle ?? data.userInfo?.memberHandle ?? ''}
                            </a>
                        )
                    },
                    type: 'element',
                }

            const reviewDateColumn: TableColumn<SubmissionRow> = {
                columnId: 'review-date',
                label: 'Review Date',
                renderer: (data: SubmissionRow) => {
                    const reviewDateDisplay = data.aggregated?.latestReviewDateString
                    if (!reviewDateDisplay) {
                        return (
                            <span className={styles.notReviewed}>
                                Not Reviewed
                            </span>
                        )
                    }

                    return <span>{reviewDateDisplay}</span>
                },
                type: 'element',
            }

            const reviewScoreColumn: TableColumn<SubmissionRow> = {
                columnId: 'review-score',
                label: 'Review Score',
                renderer: (data: SubmissionRow) => {
                    const scoreDisplay = data.aggregated?.averageFinalScoreDisplay
                    const reviewStatus = (data.review?.status ?? '').toUpperCase()
                    const isReviewPending = ['IN_PROGRESS', 'PENDING'].includes(reviewStatus)

                    if (!scoreDisplay || isReviewPending) {
                        return (
                            <span className={styles.statusBadgePending}>
                                Pending Review
                            </span>
                        )
                    }

                    return <span>{scoreDisplay}</span>
                },
                type: 'element',
            }

            const renderReviewerCell = (
                data: SubmissionRow,
                reviewIndex: number,
            ): JSX.Element => {
                const reviewDetail: AggregatedReviewDetail | undefined
                    = data.aggregated?.reviews[reviewIndex]

                if (!reviewDetail) {
                    return <span>--</span>
                }

                const reviewerName = reviewDetail.reviewerHandle
                    ? reviewDetail.reviewerHandle
                    : 'Not assigned'
                const reviewerColor = reviewDetail.reviewerHandleColor
                    ?? '#2a2a2a'
                const reviewerHandle = reviewDetail.reviewerHandle?.trim()
                const reviewerProfileUrl = reviewerHandle
                    ? `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(reviewerHandle)}`
                    : undefined

                return (
                    <span className={styles.reviewerCell}>
                        {reviewerProfileUrl ? (
                            <a
                                href={reviewerProfileUrl}
                                style={{ color: reviewerColor }}
                                target='_blank'
                                rel='noreferrer'
                            >
                                {reviewerHandle}
                            </a>
                        ) : (
                            <span style={{ color: reviewerColor }}>
                                {reviewerName}
                            </span>
                        )}
                    </span>
                )
            }

            const renderScoreCell = (
                data: SubmissionRow,
                reviewIndex: number,
            ): JSX.Element => {
                const reviewDetail: AggregatedReviewDetail | undefined
                    = data.aggregated?.reviews[reviewIndex]

                const reviewInfo = reviewDetail?.reviewInfo
                const reviewStatus = (reviewInfo?.status ?? '').toUpperCase()

                if (!reviewInfo || !reviewInfo.id) {
                    return (
                        <span className={styles.notReviewed}>--</span>
                    )
                }

                const finalScore = reviewDetail?.finalScore
                const canShowFinalScore = (
                    reviewStatus === 'COMPLETED'
                    && typeof finalScore === 'number'
                    && Number.isFinite(finalScore)
                )

                if (canShowFinalScore) {
                    const formattedScore = finalScore.toFixed(2)
                    return (
                        <Link
                            to={`./../review/${reviewInfo.id}`}
                            className={styles.textBlue}
                        >
                            {formattedScore}
                        </Link>
                    )
                }

                // For non-completed reviews, show placeholder only
                if (!includes(['COMPLETED'], reviewStatus)) {
                    return (
                        <span className={styles.notReviewed}>--</span>
                    )
                }

                // Fallback (should not normally reach here)
                return <span className={styles.notReviewed}>--</span>
            }

            const renderAppealsCell = (
                data: SubmissionRow,
                reviewIndex: number,
            ): JSX.Element => {
                const reviewDetail: AggregatedReviewDetail | undefined
                    = data.aggregated?.reviews[reviewIndex]

                const reviewInfo = reviewDetail?.reviewInfo

                if (!reviewInfo || !reviewInfo.id) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                const totalAppeals = reviewDetail?.totalAppeals ?? 0
                if (!totalAppeals && (reviewInfo.status ?? '').toUpperCase() !== 'COMPLETED') {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                if (tab === 'Appeals Response') {
                    return (
                        <Link
                            to={`./../review/${reviewInfo.id}`}
                            className={styles.appealsLink}
                        >
                            <span className={styles.textBlue}>{totalAppeals}</span>
                        </Link>
                    )
                }

                return (
                    <Link
                        to={`./../review/${reviewInfo.id}`}
                        className={styles.appealsLink}
                    >
                        <span className={styles.textBlue}>{totalAppeals}</span>
                    </Link>
                )
            }

            const renderRemainingCell = (
                data: SubmissionRow,
                reviewIndex: number,
            ): JSX.Element => {
                const reviewDetail: AggregatedReviewDetail | undefined
                    = data.aggregated?.reviews[reviewIndex]

                const reviewInfo = reviewDetail?.reviewInfo

                if (!reviewInfo || !reviewInfo.id) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                const totalAppeals = reviewDetail?.totalAppeals ?? 0
                const finishedAppeals = reviewDetail?.finishedAppeals ?? 0
                const remainingAppeals = Math.max(totalAppeals - finishedAppeals, 0)

                return <span className={styles.textBlue}>{remainingAppeals}</span>
            }

            const aggregatedColumns: TableColumn<SubmissionRow>[] = [
                submissionColumn,
                ...(handleColumnAgg ? [handleColumnAgg] : []),
                reviewDateColumn,
                ...(shouldShowAggregatedReviewScore ? [reviewScoreColumn] : []),
            ]

            for (let index = 0; index < maxReviewCount; index += 1) {
                aggregatedColumns.push({
                    columnId: `reviewer-${index}`,
                    label: maxReviewCount === 1 ? 'Reviewer' : `Reviewer ${index + 1}`,
                    renderer: (data: SubmissionRow) => renderReviewerCell(data, index),
                    type: 'element',
                })

                aggregatedColumns.push({
                    columnId: `score-${index}`,
                    label: maxReviewCount === 1 ? 'Score' : `Score ${index + 1}`,
                    renderer: (data: SubmissionRow) => renderScoreCell(data, index),
                    type: 'element',
                })

                // Do not show Appeals columns on the Review tab
                if (allowsAppeals && tab !== 'Review') {
                    aggregatedColumns.push({
                        columnId: `appeals-${index}`,
                        label: maxReviewCount === 1 ? 'Appeals' : `Appeals ${index + 1}`,
                        renderer: (data: SubmissionRow) => renderAppealsCell(data, index),
                        type: 'element',
                    })

                    if (tab === 'Appeals Response') {
                        aggregatedColumns.push({
                            columnId: `remaining-${index}`,
                            label: maxReviewCount === 1 ? 'Remaining' : `Remaining ${index + 1}`,
                            renderer: (data: SubmissionRow) => renderRemainingCell(data, index),
                            type: 'element',
                        })
                    }
                }

                // Per-review action columns removed in favor of a single combined Actions column below
            }

            // Add a single combined Actions column (Review tab only)
            const myReviewerResourceIds = new Set(
                myResources
                    .filter(r => (r.roleName || '')
                        .toLowerCase()
                        .includes('reviewer')
                        && !(r.roleName || '').toLowerCase()
                            .includes('iterative'))
                    .map(r => r.id),
            )

            const shouldShowAggregatedActions = tab === 'Review'
                && isReviewPhase(challengeInfo)
                && (myReviewerResourceIds.size > 0 || canManageCompletedReviews)

            if (shouldShowAggregatedActions) {
                aggregatedColumns.push({
                    className: styles.textBlue,
                    columnId: 'actions',
                    label: 'Actions',
                    renderer: (data: SubmissionRow) => {
                        // Find my review for this submission if present
                        const myReviewDetail = data.aggregated?.reviews.find(r => (
                            (r.resourceId && myReviewerResourceIds.has(r.resourceId))
                            || (r.reviewInfo?.resourceId && myReviewerResourceIds.has(r.reviewInfo.resourceId))
                        ))

                        const reviewId = myReviewDetail?.reviewInfo?.id
                            ?? myReviewDetail?.reviewId
                        const status = (myReviewDetail?.reviewInfo?.status ?? '').toUpperCase()
                        const historyKeyForRow = getSubmissionHistoryKey(data.memberId, data.id)
                        const rowHistory = historyByMember.get(historyKeyForRow) ?? []
                        const hasReviewRole = myReviewerResourceIds.size > 0
                        const primaryAction = !hasReviewRole
                            ? undefined
                            : includes(['COMPLETED', 'SUBMITTED'], status)
                                ? (
                                    <div
                                        key='completed-indicator'
                                        aria-label='Review completed'
                                        className={classNames(
                                            styles.completedAction,
                                        )}
                                        title='Review completed'
                                    >
                                        <span className={styles.completedIcon} aria-hidden='true'>
                                            <IconOutline.CheckIcon />
                                        </span>
                                        <span className={styles.completedPill}>Review Complete</span>
                                    </div>
                                )
                                : (
                                    reviewId
                                        ? (
                                            <Link
                                                key='complete-review'
                                                to={`./../review/${reviewId}`}
                                                className={classNames(
                                                    styles.submit,
                                                )}
                                            >
                                                <i className='icon-upload' />
                                                Complete Review
                                            </Link>
                                        )
                                        : undefined
                                )

                        const reopenButtons = createReopenActionButtons(
                            challengeInfo,
                            data,
                            data.aggregated?.reviews,
                            {
                                canManageCompletedReviews,
                                isReopening,
                                openReopenDialog,
                                pendingReopen,
                            },
                        )

                        const historyAction = (canViewHistory && isSubmissionTab && rowHistory.length > 0)
                            ? (
                                <button
                                    key='view-submission-history'
                                    type='button'
                                    className={styles.historyButton}
                                    data-member-id={data.memberId ?? ''}
                                    data-submission-id={data.id}
                                    onClick={handleHistoryButtonClick}
                                >
                                    View Submission History
                                </button>
                            )
                            : undefined

                        const elements = [
                            primaryAction,
                            historyAction,
                            ...reopenButtons,
                        ].filter(Boolean) as JSX.Element[]

                        return (
                            <span>
                                {elements.map((el, i) => (
                                    <span
                                        key={`wrap-${String((el as any).key)}`}
                                        style={{ marginRight: i < elements.length - 1 ? 12 : 0 }}
                                    >
                                        {i === elements.length - 1 ? (
                                            <span className='last-element'>
                                                {el}
                                            </span>
                                        ) : el}
                                    </span>
                                ))}
                            </span>
                        )
                    },
                    type: 'element',
                })
            }

            return aggregatedColumns
        }

        const handleColumn: TableColumn<SubmissionRow> | undefined = hideHandleColumn
            ? undefined
            : {
                columnId: 'handle',
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: SubmissionRow) => {
                    const reviewRating = resolveRatingValue(data.review?.submitterMaxRating)
                    const userRating = resolveRatingValue(data.userInfo?.maxRating)
                    const computedColor = data.review?.submitterHandleColor
                        ?? data.userInfo?.handleColor
                        ?? (reviewRating !== undefined ? getRatingColor(reviewRating) : undefined)
                        ?? (userRating !== undefined ? getRatingColor(userRating) : undefined)
                        ?? '#2a2a2a'

                    return (
                        <a
                            href={getHandleUrl(data.userInfo)}
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                color: computedColor,
                            }}
                            onClick={function onClick() {
                                window.open(
                                    getHandleUrl(data.userInfo),
                                    '_blank',
                                )
                            }}
                        >
                            {data.userInfo?.memberHandle ?? ''}
                        </a>
                    )
                },
                type: 'element',
            }

        const reviewDateColumn: TableColumn<SubmissionRow> = {
            columnId: 'review-date-default',
            label: 'Review Date',
            renderer: (data: SubmissionRow) => {
                if (!data.review || !data.review.id) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                const status = (data.review?.status ?? '').toUpperCase()
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)

                if (data.review && isCompleted) {
                    return (
                        <span>
                            {data.review.updatedAtString
                                || data.review.reviewDateString
                                || data.review.createdAtString}
                        </span>
                    )
                }
                // If review exists but is not completed/submitted, show Not Reviewed
                return (
                    <span className={styles.notReviewed}>
                        Not Reviewed
                    </span>
                )
            },
            type: 'element',
        }

        const scoreColumn: TableColumn<SubmissionRow> = {
            columnId: 'score-default',
            label: 'Score',
            renderer: (data: SubmissionRow) => {
                // If there is no review started, show placeholder
                if (!data.review || !data.review.id) {
                    return <span className={styles.notReviewed}>--</span>
                }

                const reviewId = data.review.id
                const status = (data.review?.status ?? '').toUpperCase()
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)
                const finalScore = data.review?.finalScore

                if (isCompleted && typeof finalScore === 'number' && Number.isFinite(finalScore)) {
                    const formattedScore = finalScore.toFixed(2)
                    return (
                        <Link
                            to={`./../review/${reviewId}`}
                            className={styles.textBlue}
                        >
                            {formattedScore}
                        </Link>
                    )
                }

                // For non-completed or missing final score, show placeholder
                return <span className={styles.notReviewed}>--</span>
            },
            type: 'element',
        }

        const initalColumns: TableColumn<SubmissionRow>[] = [
            submissionColumn,
            ...(handleColumn ? [handleColumn] : []),
            reviewDateColumn,
            scoreColumn,
        ]

        const renderReviewCompletedAction = (): JSX.Element => (
            <div
                aria-label='Review completed'
                className={classNames(
                    styles.completedAction,
                    'last-element',
                )}
                title='Review completed'
            >
                <span className={styles.completedIcon} aria-hidden='true'>
                    <IconOutline.CheckIcon />
                </span>
                <span className={styles.completedPill}>Review Complete</span>
            </div>
        )

        const createPrimaryAction = ({
            actionLink,
            hasReview,
            reviewId,
            reviewStatus,
            reviewPhaseId,
        }: {
            actionLink?: JSX.Element
            hasReview: boolean
            reviewId?: string
            reviewStatus: string
            reviewPhaseId?: string
        }): JSX.Element | undefined => {
            if (includes(['COMPLETED', 'SUBMITTED'], reviewStatus)) {
                return renderReviewCompletedAction()
            }

            if (includes(['PENDING', 'IN_PROGRESS'], reviewStatus) && actionLink) {
                return actionLink
            }

            if (!reviewStatus && hasReview && reviewId) {
                if (!isReviewPhaseCurrentlyOpen(challengeInfo, reviewPhaseId)) {
                    return undefined
                }

                return (
                    <Link
                        to={`./../review/${reviewId}`}
                        className={classNames(
                            styles.submit,
                            'last-element',
                        )}
                    >
                        <i className='icon-reopen' />
                        Reopen Review
                    </Link>
                )
            }

            return actionLink
        }

        const createHistoryEntry = (
            data: SubmissionRow,
        ): { element: JSX.Element; key: string } | undefined => {
            if (!canViewHistory || !isSubmissionTab) {
                return undefined
            }

            const historyKeyForRow = getSubmissionHistoryKey(data.memberId, data.id)
            const rowHistory = historyByMember.get(historyKeyForRow) ?? []

            if (rowHistory.length === 0) {
                return undefined
            }

            return {
                element: (
                    <button
                        type='button'
                        className={styles.historyButton}
                        data-member-id={data.memberId ?? ''}
                        data-submission-id={data.id}
                        onClick={handleHistoryButtonClick}
                    >
                        View Submission History
                    </button>
                ),
                key: 'submission-history',
            }
        }

        // Actions on Review tab only (complete/reopen/submit review)
        const actionColumns = (actionChallengeRole === REVIEWER
            && isReviewPhase(challengeInfo)
            && tab === 'Review') ? [
            {
                className: styles.textBlue,
                columnId: 'action',
                label: 'Action',
                renderer: (data: SubmissionRow) => {
                    const reviewId = data.review?.id
                    const reviewStatus = (data.review?.status ?? '').toUpperCase()
                    const hasReview = !!reviewId
                    const actionLink = reviewId ? (
                        <Link
                            to={`./../review/${reviewId}`}
                            className={classNames(
                                styles.submit,
                                'last-element',
                            )}
                        >
                            <i className='icon-upload' />
                            Submit Review
                        </Link>
                    ) : undefined
                    const primaryAction = createPrimaryAction({
                        actionLink,
                        hasReview,
                        reviewId,
                        reviewPhaseId: data.review?.phaseId,
                        reviewStatus,
                    })

                    const actionEntries: Array<{ element: JSX.Element; key: string }> = primaryAction
                        ? [
                            { element: primaryAction, key: 'primary-action' },
                        ]
                        : []
                    const historyEntry = createHistoryEntry(data)

                    if (historyEntry) {
                        actionEntries.push(historyEntry)
                    }

                    if (!actionEntries.length) {
                        return <span className={styles.notReviewed}>--</span>
                    }

                    if (actionEntries.length === 1) {
                        return actionEntries[0].element
                    }

                    return (
                        <span className={styles.actionsCell}>
                            {actionEntries.map(entry => (
                                <span
                                    key={entry.key}
                                    className={styles.actionItem}
                                >
                                    {entry.element}
                                </span>
                            ))}
                        </span>
                    )
                },
                type: 'element',
            },
        ] : []
        const historyOnlyColumn: TableColumn<SubmissionRow> | undefined = (!actionColumns.length
            && canViewHistory
            && isSubmissionTab
            && shouldShowHistoryActions)
            ? {
                className: styles.textBlue,
                columnId: 'submission-history',
                label: 'Actions',
                renderer: (data: SubmissionRow) => {
                    const historyKeyForRow = getSubmissionHistoryKey(data.memberId, data.id)
                    const rowHistory = historyByMember.get(historyKeyForRow) ?? []

                    if (rowHistory.length === 0) {
                        return <span className={styles.notReviewed}>--</span>
                    }

                    return (
                        <button
                            type='button'
                            className={styles.historyButton}
                            data-member-id={data.memberId ?? ''}
                            data-submission-id={data.id}
                            onClick={handleHistoryButtonClick}
                        >
                            View Submission History
                        </button>
                    )
                },
                type: 'element',
            }
            : undefined

        if (includes([APPROVAL], tab)) {
            return [
                ...initalColumns,
                ...(historyOnlyColumn ? [historyOnlyColumn] : []),
            ] as TableColumn<SubmissionRow>[]
        }

        if (!allowsAppeals) {
            return [
                ...initalColumns,
                ...actionColumns,
                ...(historyOnlyColumn ? [historyOnlyColumn] : []),
            ] as TableColumn<SubmissionRow>[]
        }
        // For Review tab: do not show Appeals column
        if (tab === 'Review') {
            return [
                ...initalColumns,
                ...actionColumns,
                ...(historyOnlyColumn ? [historyOnlyColumn] : []),
            ] as TableColumn<SubmissionRow>[]
        }

        // Build Appeals column
        const appealsCol: TableColumn<SubmissionRow> = {
            columnId: 'appeals-default',
            label: 'Appeals',
            renderer: (data: SubmissionRow) => {
                if (!data.review || !data.review.id) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                const reviewId = data.review.id
                const appealInfo = mappingReviewAppeal[reviewId]
                if (!appealInfo) {
                    return (
                        <span className={styles.notReviewed}>
                            loading...
                        </span>
                    )
                }

                const reviewStatus = (data.review?.status ?? '').toUpperCase()
                const hasAppeals = appealInfo.totalAppeals > 0

                if (!hasAppeals && reviewStatus !== 'COMPLETED') {
                    return undefined
                }

                if (tab === 'Appeals Response') {
                    return (
                        <Link
                            to={`./../review/${reviewId}`}
                            className={styles.appealsLink}
                        >
                            <span className={styles.textBlue}>
                                {appealInfo.totalAppeals}
                            </span>
                        </Link>
                    )
                }

                return (
                    <Link
                        to={`./../review/${reviewId}`}
                        className={styles.appealsLink}
                    >
                        <span className={styles.textBlue}>
                            {appealInfo.totalAppeals}
                        </span>
                    </Link>
                )
            },
            type: 'element',
        }

        // For Appeals Response: add Remaining and Respond action
        if (tab === 'Appeals Response') {
            const remainingCol: TableColumn<SubmissionRow> = {
                columnId: 'appeals-remaining',
                label: 'Remaining',
                renderer: (data: SubmissionRow) => {
                    if (!data.review || !data.review.id) {
                        return <span className={styles.notReviewed}>--</span>
                    }
                    const reviewId = data.review.id
                    const appealInfo = mappingReviewAppeal[reviewId]
                    const total = appealInfo?.totalAppeals ?? 0
                    const finished = appealInfo?.finishAppeals ?? 0
                    const remaining = Math.max(total - finished, 0)
                    return <span className={styles.textBlue}>{remaining}</span>
                },
                type: 'element',
            }

            const respondActionCol: TableColumn<SubmissionRow> = {
                className: styles.textBlue,
                columnId: 'respond-action',
                label: 'Action',
                renderer: (data: SubmissionRow) => {
                    const reviewId = data.review?.id
                    if (!reviewId) {
                        return (
                            <span className={classNames(styles.notReviewed, 'last-element')}>
                                --
                            </span>
                        )
                    }

                    // Determine remaining appeals for this submission/review
                    const appealInfo = mappingReviewAppeal[reviewId]
                    const total = appealInfo?.totalAppeals ?? 0
                    const finished = appealInfo?.finishAppeals ?? 0
                    const remaining = Math.max(total - finished, 0)

                    // Only render the action when the Appeals Response phase is open
                    // and there are remaining appeals for this reviewer on this submission
                    if (isAppealsResponsePhaseOpen && remaining > 0) {
                        return (
                            <Link
                                to={`./../review/${reviewId}`}
                                className={classNames(styles.submit, 'last-element')}
                            >
                                Respond to Appeals
                            </Link>
                        )
                    }

                    return (
                        <span className={classNames(styles.notReviewed, 'last-element')}>
                            --
                        </span>
                    )
                },
                type: 'element',
            }

            return [
                ...initalColumns,
                appealsCol,
                remainingCol,
                // Include Respond action column only when phase is open
                ...(isAppealsResponsePhaseOpen ? [respondActionCol] : []),
                ...(historyOnlyColumn ? [historyOnlyColumn] : []),
            ] as TableColumn<SubmissionRow>[]
        }

        // Appeals tab (non-aggregated reviewer view)
        return [
            ...initalColumns,
            appealsCol,
            ...actionColumns,
            ...(historyOnlyColumn ? [historyOnlyColumn] : []),
        ] as TableColumn<SubmissionRow>[]
    }, [
        actionChallengeRole,
        allowsAppeals,
        canManageCompletedReviews,
        challengeInfo,
        isAppealsResponsePhaseOpen,
        isAggregatedView,
        isSubmissionDownloadRestricted,
        maxReviewCount,
        downloadSubmission,
        hideHandleColumn,
        isDownloading,
        mappingReviewAppeal,
        isReopening,
        pendingReopen,
        openReopenDialog,
        canViewHistory,
        handleHistoryButtonClick,
        isSubmissionTab,
        tab,
        restrictionMessage,
        historyByMember,
        shouldShowHistoryActions,
        myResources,
    ])

    /* eslint-enable indent, padding-line-between-statements */
    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(column => {
            if (column.label === 'Action' || column.label === 'Actions') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
                {
                    ...column,
                    className: '',
                    label: `${column.label as string} label`,
                    mobileType: 'label',
                    renderer: () => (
                        <div>
                            {column.label as string}
                            :
                        </div>
                    ),
                    type: 'element',
                },
                {
                    ...column,
                    mobileType: 'last-value',
                },
            ] as MobileTableColumn<SubmissionRow>[]
        }),
        [columns],
    )

    const submissions: SubmissionRow[] = useMemo(() => {
        if (isAggregatedView) {
            return aggregatedSubmissionRows
        }

        if (includes([APPROVAL], tab)) {
            return firstSubmissions
                ? [{ ...firstSubmissions } as SubmissionRow]
                : []
        }

        if (!restrictToLatest) {
            return datas as SubmissionRow[]
        }

        const latestRows = datas.filter(submission => latestSubmissionIds.has(submission.id))
        return latestRows as SubmissionRow[]
    }, [
        aggregatedSubmissionRows,
        datas,
        firstSubmissions,
        isAggregatedView,
        latestSubmissionIds,
        restrictToLatest,
        tab,
    ])

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                wrapperClassName,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={submissions} />
            ) : (
                <Table
                    columns={columns}
                    data={submissions}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}

            <SubmissionHistoryModal
                open={Boolean(historyKey)}
                onClose={closeHistoryModal}
                submissions={historyEntriesForModal}
                downloadSubmission={downloadSubmission}
                isDownloading={isDownloading}
                getRestriction={getHistoryRestriction}
                getSubmissionMeta={resolveSubmissionMeta}
            />

            <ConfirmModal
                title='Reopen Scorecard Confirmation'
                open={Boolean(pendingReopen)}
                onClose={closeReopenDialog}
                onConfirm={handleConfirmReopen}
                cancelText='Cancel'
                action='Confirm'
                isLoading={isReopening}
            >
                <div>
                    {pendingReopen?.isOwnReview
                        ? REOPEN_MESSAGE_SELF
                        : REOPEN_MESSAGE_OTHER}
                </div>
            </ConfirmModal>
        </TableWrapper>
    )
}

export default TableReviewAppeals

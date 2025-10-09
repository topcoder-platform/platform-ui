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
import { mutate } from 'swr'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'
import { copyTextToClipboard, handleError, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import { APPROVAL, NO_RESOURCE_ID, REVIEWER, WITHOUT_APPEAL } from '../../../config/index.config'
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
    getHandleUrl,
    isReviewPhase,
} from '../../utils'
import { ConfirmModal } from '../ConfirmModal'
import { updateReview } from '../../services'
import { TableWrapper } from '../TableWrapper'

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

const REOPEN_MESSAGE_SELF = [
    'The scorecard will be reopened and you will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

const REOPEN_MESSAGE_OTHER = [
    'The scorecard will be reopened and the reviewer will be able to edit it before submitting the scorecard again.',
    'Are you sure you want to reopen the scorecard?',
].join(' ')

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
        isSubmissionDownloadRestricted,
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
    const wrapperClassName = props.className

    // Aggregated mode is used on the Appeals tab for admins/copilots (not for reviewers)
    const hasReviewerRole = useMemo(
        () => myRoles.some(role => role?.toLowerCase()
            .includes('reviewer')),
        [myRoles],
    )
    const hasCopilotRole = useMemo(
        () => myRoles.some(role => role?.toLowerCase()
            .includes('copilot')),
        [myRoles],
    )
    const hasAdminRole = useMemo(
        () => myRoles.some(role => role?.toLowerCase()
            .includes('admin')),
        [myRoles],
    )

    // Aggregated view groups one row per submission and shows
    // reviewer columns + average score. Use it for Appeals and Review tabs.
    const isAggregatedView = (tab === 'Appeals' || tab === 'Review')

    const aggregatedRows = useMemo(() => {
        if (!isAggregatedView) {
            return [] as AggregatedSubmissionReviews[]
        }

        return aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers,
            submissions: datas,
        })
    }, [datas, isAggregatedView, mappingReviewAppeal, reviewers])

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
        () => aggregatedRows.map(row => ({
            ...row.submission,
            aggregated: row,
        })),
        [aggregatedRows],
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

    const isTopcoderAdmin = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === 'administrator',
        ) ?? false,
        [loginUserInfo?.roles],
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
            await updateReview(reviewId, { status: 'IN_PROGRESS' })
            toast.success('Scorecard reopened.')
            closeReopenDialog()

            const challengeId = challengeInfo?.id

            if (challengeId) {
                const mutateKeys = new Set<string>()
                const reviewerIdsAll = reviewers.map(reviewer => reviewer.id)
                const reviewerKeyAll = reviewerIdsAll.slice()
                    .sort()
                    .join(',')
                mutateKeys.add(`reviewBaseUrl/reviews/${challengeId}/${reviewerKeyAll}`)

                const memberId = loginUserInfo?.userId
                    ? `${loginUserInfo.userId}`
                    : undefined

                if (memberId) {
                    const reviewerIdsSelf = reviewers
                        .filter(reviewer => reviewer.memberId === memberId)
                        .map(reviewer => reviewer.id)

                    if (reviewerIdsSelf.length) {
                        const reviewerKeySelf = reviewerIdsSelf.slice()
                            .sort()
                            .join(',')
                        mutateKeys.add(`reviewBaseUrl/reviews/${challengeId}/${reviewerKeySelf}`)
                    }
                }

                mutateKeys.add(`reviewBaseUrl/submissions/${challengeId}`)

                await Promise.all(Array.from(mutateKeys)
                    .map(key => mutate(key)))
            }
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
            className: classNames(styles.textBlue, styles.submissionColumn),
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
                        className={classNames(styles.textBlue, styles.linkButton)}
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
                    renderer: (data: SubmissionRow) => (
                        <a
                            href={getHandleUrl(data.userInfo)}
                            target='_blank'
                            rel='noreferrer'
                            style={{ color: data.aggregated?.submitterHandleColor }}
                            onClick={function onClick() {
                                window.open(getHandleUrl(data.userInfo), '_blank')
                            }}
                        >
                            {data.aggregated?.submitterHandle ?? data.userInfo?.memberHandle ?? ''}
                        </a>
                    ),
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
                    if (!scoreDisplay) {
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
                const resourceId = reviewDetail?.resourceId || NO_RESOURCE_ID
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
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
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
                const resourceId = reviewDetail?.resourceId || NO_RESOURCE_ID

                if (!reviewInfo || !reviewInfo.id) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                const totalAppeals = reviewDetail?.totalAppeals ?? 0
                const unresolvedAppeals = reviewDetail?.unresolvedAppeals ?? 0

                if (!totalAppeals && (reviewInfo.status ?? '').toUpperCase() !== 'COMPLETED') {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                return (
                    <Link
                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                        className={styles.appealsLink}
                    >
                        [
                        {' '}
                        <span className={styles.textBlue}>{unresolvedAppeals}</span>
                        {' '}
                        /
                        {' '}
                        <span className={styles.textBlue}>{totalAppeals}</span>
                        {' '}
                        ]
                    </Link>
                )
            }

            const aggregatedColumns: TableColumn<SubmissionRow>[] = [
                submissionColumn,
                ...(handleColumnAgg ? [handleColumnAgg] : []),
                reviewDateColumn,
                reviewScoreColumn,
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
                        label: `Appeals ${index + 1}`,
                        renderer: (data: SubmissionRow) => renderAppealsCell(data, index),
                        type: 'element',
                    })
                }

                // Per-review action columns removed in favor of a single combined Actions column below
            }

            // Add a single combined Actions column
            const myReviewerResourceIds = new Set(
                myResources
                    .filter(r => (r.roleName || '')
                        .toLowerCase()
                        .includes('reviewer')
                        && !(r.roleName || '').toLowerCase()
                            .includes('iterative'))
                    .map(r => r.id),
            )

            if ((myReviewerResourceIds.size > 0 || canManageCompletedReviews) && isReviewPhase(challengeInfo)) {
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

                        // Prefer the resourceId from my review if found; otherwise use one of mine
                        const fallbackResourceId = Array.from(myReviewerResourceIds)[0]
                        const resourceId = myReviewDetail?.resourceId
                            || myReviewDetail?.reviewInfo?.resourceId
                            || fallbackResourceId
                            || NO_RESOURCE_ID

                        const status = (myReviewDetail?.reviewInfo?.status ?? '').toUpperCase()

                        // Collect action elements
                        const elements: JSX.Element[] = []

                        const hasReviewRole = myReviewerResourceIds.size > 0
                        if (hasReviewRole) {
                            if (includes(['COMPLETED', 'SUBMITTED'], status)) {
                                elements.push(
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
                                    </div>,
                                )
                            } else {
                                elements.push(
                                    <Link
                                        key='complete-review'
                                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                        className={classNames(
                                            styles.submit,
                                        )}
                                    >
                                        <i className='icon-upload' />
                                        Complete Review
                                    </Link>,
                                )
                            }
                        }

                        // Add reopen actions for completed reviews if user can manage
                        if (canManageCompletedReviews) {
                            (data.aggregated?.reviews || []).forEach(rv => {
                                const reviewInfo = rv?.reviewInfo
                                if (!reviewInfo?.id) return
                                const st = (reviewInfo.status ?? '').toUpperCase()
                                if (st !== 'COMPLETED') return
                                const isTargetReview = pendingReopen?.review?.reviewInfo?.id === reviewInfo.id

                                function handleReopenClick(): void {
                                    openReopenDialog(data, {
                                        ...rv,
                                        reviewInfo,
                                    } as AggregatedReviewDetail)
                                }

                                elements.push(
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
                        }

                        // Mark last interactive element for row border styling
                        if (elements.length > 0) {
                            const last = elements[elements.length - 1]
                            elements[elements.length - 1] = (
                                <span key='last-wrap' className='last-element'>
                                    {last}
                                </span>
                            )
                        }

                        return (
                            <span>
                                {elements.map((el, i) => (
                                    <span
                                        key={`wrap-${String((el as any).key)}`}
                                        style={{ marginRight: i < elements.length - 1 ? 12 : 0 }}
                                    >
                                        {el}
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
                renderer: (data: SubmissionRow) => (
                    <a
                        href={getHandleUrl(data.userInfo)}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                            color: data.userInfo?.handleColor,
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
                ),
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

                const status = (data.review?.status ?? '').toUpperCase()
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)
                const finalScore = data.review?.finalScore

                if (isCompleted && typeof finalScore === 'number' && Number.isFinite(finalScore)) {
                    const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                    const formattedScore = finalScore.toFixed(2)
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
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

        // Actions on Review tab only (complete/reopen/submit review)
        const actionColumns = (actionChallengeRole === REVIEWER
            && isReviewPhase(challengeInfo)
            && tab === 'Review') ? [
            {
                className: styles.textBlue,
                columnId: 'action',
                label: 'Action',
                renderer: (data: SubmissionRow) => {
                    const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                    const reviewStatus = (data.review?.status ?? '').toUpperCase()
                    const hasReview = !!data.review?.id
                    const actionLink = (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={classNames(
                                styles.submit,
                                'last-element',
                            )}
                        >
                            <i className='icon-upload' />
                            Submit Review
                        </Link>
                    )

                    if (includes(['COMPLETED', 'SUBMITTED'], reviewStatus)) {
                        return (
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
                    }

                    if (
                        includes(['PENDING', 'IN_PROGRESS'], reviewStatus)
                    ) {
                        return actionLink
                    }

                    if (!reviewStatus && hasReview) {
                        return (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
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
                },
                type: 'element',
            },
        ] : []

        if (includes([APPROVAL], tab)) {
            return [...initalColumns] as TableColumn<SubmissionRow>[]
        }

        if (!allowsAppeals) {
            return [
                ...initalColumns,
                ...actionColumns,
            ] as TableColumn<SubmissionRow>[]
        }
        // For Review tab: do not show Appeals column
        if (tab === 'Review') {
            return [
                ...initalColumns,
                ...actionColumns,
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

                const appealInfo = mappingReviewAppeal[data.review.id]
                if (!appealInfo) {
                    return (
                        <span className={styles.notReviewed}>
                            loading...
                        </span>
                    )
                }

                const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                const reviewStatus = (data.review?.status ?? '').toUpperCase()
                const hasAppeals = appealInfo.totalAppeals > 0

                if (!hasAppeals && reviewStatus !== 'COMPLETED') {
                    return undefined
                }

                return (
                    <>
                        [
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.appealsLink}
                        >
                            <span className={styles.textBlue}>{appealInfo.finishAppeals}</span>
                            {' '}
                            /
                            {' '}
                            <span className={styles.textBlue}>
                                {appealInfo.totalAppeals}
                            </span>
                        </Link>
                        ]
                    </>
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
                    const appealInfo = mappingReviewAppeal[data.review.id]
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
                    const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                    if (!data.review?.id) {
                        return (
                            <span className={classNames(styles.notReviewed, 'last-element')}>
                                --
                            </span>
                        )
                    }

                    // Only render the action when the Appeals Response phase is open
                    if (isAppealsResponsePhaseOpen) {
                        return (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
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
            ] as TableColumn<SubmissionRow>[]
        }

        // Appeals tab (non-aggregated reviewer view)
        return [
            ...initalColumns,
            appealsCol,
            ...actionColumns,
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
        tab,
        restrictionMessage,
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

        return datas as SubmissionRow[]
    }, [
        aggregatedSubmissionRows,
        datas,
        firstSubmissions,
        isAggregatedView,
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

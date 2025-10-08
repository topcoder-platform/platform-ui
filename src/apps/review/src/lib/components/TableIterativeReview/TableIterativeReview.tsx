/**
 * Table Iterative Review.
 */
import {
    FC,
    MouseEvent,
    useContext,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'
import {
    copyTextToClipboard,
    useWindowSize,
    WindowSize,
} from '~/libs/shared'

import { NO_RESOURCE_ID } from '../../../config/index.config'
import { ChallengeDetailContextModel, ReviewInfo, SubmissionInfo } from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { getHandleUrl, isReviewPhase } from '../../utils'
import { TableWrapper } from '../TableWrapper'
import { ProgressBar } from '../ProgressBar'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableIterativeReview.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    hideHandleColumn?: boolean
    columnLabel?: string
}

interface ScoreMetadata {
    outcome?: unknown
    score?: unknown
}

const toFiniteNumber = (value: unknown): number | undefined => {
    if (typeof value === 'number') {
        return Number.isFinite(value) ? value : undefined
    }

    if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed) ? parsed : undefined
    }

    return undefined
}

const getReviewScore = (review: ReviewInfo | undefined): number | undefined => {
    if (!review) {
        return undefined
    }

    const metadata = review.metadata as ScoreMetadata | undefined
    const metadataScore = metadata ? toFiniteNumber(metadata.score) : undefined
    const finalScore = toFiniteNumber(review.finalScore)
    const initialScore = toFiniteNumber(review.initialScore)

    return metadataScore ?? finalScore ?? initialScore ?? undefined
}

const formatScore = (score: number): string => (
    Number.isInteger(score) ? `${score}` : score.toFixed(2)
)

const formatOutcome = (value: unknown): string | undefined => {
    if (typeof value !== 'string') {
        return undefined
    }

    const trimmed = value.trim()

    if (!trimmed) {
        return undefined
    }

    return _.upperFirst(_.toLower(trimmed))
}

const formatStatusLabel = (status: string): string => {
    const trimmedStatus = status.trim()
    const normalised = trimmedStatus ? _.toUpper(trimmedStatus) : ''

    switch (normalised) {
        case 'IN_PROGRESS':
            return 'In Progress'
        case 'PENDING':
            return 'Pending Review'
        case 'QUEUED':
            return 'Queued'
        default:
            return _.upperFirst(_.toLower(normalised))
    }
}

const hasActiveReview = (review: ReviewInfo | undefined): boolean => (
    Boolean(review?.id)
)

export const TableIterativeReview: FC<Props> = (props: Props) => {
    const className = props.className
    const datas = props.datas
    const downloadSubmission = props.downloadSubmission
    const hideHandleColumn = props.hideHandleColumn
    const isDownloading = props.isDownloading
    const columnLabel = props.columnLabel || 'Iterative Review'
    const { challengeInfo, myRoles }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const submissionColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (data: SubmissionInfo) => {
                const isRestrictedForMember = isSubmissionDownloadRestrictedForMember(
                    data.memberId,
                )
                const tooltipMessage = getRestrictionMessageForMember(
                    data.memberId,
                ) ?? restrictionMessage

                const isButtonDisabled = Boolean(
                    isDownloading[data.id]
                    || isRestrictedForMember,
                )

                const downloadButton = (
                    <button
                        onClick={function onClick() {
                            if (isRestrictedForMember) {
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

                const shouldShowTooltip = isRestrictedForMember
                    || isSubmissionDownloadRestricted

                const renderedDownloadButton = shouldShowTooltip ? (
                    <Tooltip
                        content={tooltipMessage}
                        triggerOn='click-hover'
                    >
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
        }),
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            downloadSubmission,
            isDownloading,
            restrictionMessage,
        ],
    )

    const handleColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (hideHandleColumn) {
            return undefined
        }

        return {
            columnId: 'handle',
            label: 'Handle',
            propertyName: 'handle',
            renderer: (data: SubmissionInfo) => (
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
    }, [hideHandleColumn])

    const reviewColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            columnId: 'iterative-review',
            label: columnLabel,
            renderer: (data: SubmissionInfo) => {
                const review = data.review

                if (!hasActiveReview(review)) {
                    return (
                        <span className={styles.pendingText}>
                            Pending
                        </span>
                    )
                }

                const status = (review?.status ?? '').toUpperCase()
                const reviewScore = getReviewScore(review)
                const outcomeLabel = formatOutcome(
                    (review?.metadata as ScoreMetadata | undefined)?.outcome,
                )
                const resourceId = review?.resourceId || NO_RESOURCE_ID

                if (['COMPLETED', 'SUBMITTED'].includes(status) && reviewScore !== undefined) {
                    const normalisedOutcome = outcomeLabel?.toLowerCase()
                    const isPassOutcome = normalisedOutcome === 'pass'
                    const isFailOutcome = normalisedOutcome === 'fail'
                    const outcomeIndicator = isPassOutcome ? (
                        <span
                            className={classNames(styles.statusIcon, styles.passIcon)}
                            aria-label='Pass'
                        >
                            <IconOutline.CheckCircleIcon aria-hidden />
                        </span>
                    ) : isFailOutcome ? (
                        <span
                            className={classNames(styles.statusIcon, styles.failIcon)}
                            aria-label='Fail'
                        >
                            <IconOutline.XCircleIcon aria-hidden />
                        </span>
                    ) : undefined

                    return (
                        <div className={styles.reviewCell}>
                            <div className={styles.scoreRow}>
                                {outcomeIndicator}
                                <Link
                                    to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                    className={styles.scoreLink}
                                >
                                    {formatScore(reviewScore)}
                                </Link>
                            </div>
                            {!outcomeIndicator && outcomeLabel ? (
                                <span className={styles.outcome}>
                                    {outcomeLabel}
                                </span>
                            ) : undefined}
                        </div>
                    )
                }

                if (['COMPLETED', 'SUBMITTED'].includes(status)) {
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.scoreLink}
                        >
                            View Scorecard
                        </Link>
                    )
                }

                if (review?.reviewProgress) {
                    return (
                        <div className={styles.reviewCell}>
                            <ProgressBar progress={review.reviewProgress} />
                            <span className={styles.statusBadgePending}>
                                In Progress
                            </span>
                        </div>
                    )
                }

                if (status) {
                    return (
                        <span className={styles.statusBadgePending}>
                            {formatStatusLabel(status)}
                        </span>
                    )
                }

                return (
                    <span className={styles.pendingText}>
                        Pending
                    </span>
                )
            },
            type: 'element',
        }),
        [columnLabel],
    )

    const reviewDateColumn: TableColumn<SubmissionInfo> = useMemo(
        () => ({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: (data: SubmissionInfo) => {
                const review = data.review

                const status = (review?.status ?? '').toUpperCase()
                const isCompleted = ['COMPLETED', 'SUBMITTED'].includes(status)

                if (!hasActiveReview(review) || !isCompleted) {
                    return (
                        <span className={styles.pendingText}>
                            Not Reviewed
                        </span>
                    )
                }

                const reviewDate = review?.updatedAtString
                    || review?.reviewDateString
                    || review?.createdAtString

                return reviewDate ? (
                    <span>{reviewDate}</span>
                ) : (
                    <span className={styles.pendingText}>Not Reviewed</span>
                )
            },
            type: 'element',
        }),
        [],
    )

    const hasIterativeReviewerRole = useMemo(
        () => (myRoles ?? [])
            .some(role => role?.toLowerCase()
                .includes('iterative reviewer')),
        [myRoles],
    )

    const actionColumn: TableColumn<SubmissionInfo> | undefined = useMemo(() => {
        if (!hasIterativeReviewerRole || !isReviewPhase(challengeInfo)) {
            return undefined
        }

        return {
            columnId: 'action',
            label: 'Action',
            renderer: (data: SubmissionInfo) => {
                const review = data.review
                const resourceId = review?.resourceId || NO_RESOURCE_ID
                const status = (review?.status ?? '').toUpperCase()
                const hasReview = !!review?.id

                // Completed or submitted
                if (['COMPLETED', 'SUBMITTED'].includes(status)) {
                    return (
                        <div
                            aria-label='Review completed'
                            className={classNames(styles.completedAction, 'last-element')}
                            title='Review completed'
                        >
                            <span className={styles.completedIcon} aria-hidden='true'>
                                &check;
                            </span>
                        </div>
                    )
                }

                // Allow navigating to complete the review if pending or in progress
                if (['PENDING', 'IN_PROGRESS'].includes(status) || (
                    !status && hasReview
                ) || review?.reviewProgress) {
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={classNames(styles.submit, 'last-element')}
                        >
                            <i className='icon-upload' />
                            Complete Review
                        </Link>
                    )
                }

                return undefined
            },
            type: 'element',
        }
    }, [challengeInfo, hasIterativeReviewerRole])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            submissionColumn,
            ...(handleColumn ? [handleColumn] : []),
            reviewColumn,
            reviewDateColumn,
        ],
        [handleColumn, reviewColumn, reviewDateColumn, submissionColumn],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(() => (
        (actionColumn ? [...columns, actionColumn] : columns).map(column => ([
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
        ] as MobileTableColumn<SubmissionInfo>[]))
    ), [actionColumn, columns])

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={datas} />
            ) : (
                <Table
                    columns={actionColumn ? [...columns, actionColumn] : columns}
                    data={datas}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableIterativeReview

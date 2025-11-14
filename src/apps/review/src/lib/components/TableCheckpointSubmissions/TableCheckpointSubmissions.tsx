/**
 * Table Checkpoint Submissions.
 */
import { FC, MouseEvent, useCallback, useContext, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'
import { UserRole } from '~/libs/core'
import { handleError } from '~/apps/admin/src/lib/utils'

import {
    ChallengeDetailContextModel,
    ReviewAppContextModel,
    Screening,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import {
    getHandleUrl,
    isReviewPhaseCurrentlyOpen,
    refreshChallengeReviewData,
    REOPEN_MESSAGE_OTHER,
    REOPEN_MESSAGE_SELF,
} from '../../utils'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { updateReview } from '../../services'
import { ConfirmModal } from '../ConfirmModal'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableCheckpointSubmissions.module.scss'

interface Props {
    className?: string
    datas: Screening[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mode?: 'submission' | 'screening' | 'review'
}

const isInProgressStatus = (value: string | undefined): boolean => (
    typeof value === 'string'
    && value.trim()
        .toUpperCase() === 'IN_PROGRESS'
)

const isReviewRowInProgress = (entry: Screening): boolean => (
    isInProgressStatus(entry.reviewStatus)
    || isInProgressStatus(entry.myReviewStatus)
)

export const TableCheckpointSubmissions: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const mode = props.mode ?? 'submission'
    const datas: Screening[] | undefined = props.datas
    const downloadSubmission = props.downloadSubmission
    const isDownloading = props.isDownloading

    const {
        challengeInfo,
        myResources,
        myRoles,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)

    const normalisedRoles = useMemo(
        () => (myRoles ?? []).map(role => role.toLowerCase()),
        [myRoles],
    )

    const hasCopilotRole = useMemo(
        () => normalisedRoles.some(role => role.includes('copilot')),
        [normalisedRoles],
    )

    const isAdminUser = useMemo(
        () => loginUserInfo?.roles?.some(
            role => typeof role === 'string'
                && role.toLowerCase() === UserRole.administrator,
        ) ?? false,
        [loginUserInfo?.roles],
    )

    const myResourceIds = useMemo(
        () => new Set(
            (myResources ?? [])
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const canReopenGlobally = isAdminUser || hasCopilotRole
    const challengeId = challengeInfo?.id

    const [pendingReopen, setPendingReopen] = useState<{
        reviewId: string
        isOwnReview: boolean
    } | undefined>(undefined)
    const [isReopening, setIsReopening] = useState(false)

    const {
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const openReopenDialog = useCallback(
        (entry: Screening, isOwnReview: boolean): void => {
            if (!entry.reviewId) {
                return
            }

            setPendingReopen({
                isOwnReview,
                reviewId: entry.reviewId,
            })
        },
        [],
    )

    const closeReopenDialog = useCallback((): void => {
        setPendingReopen(undefined)
    }, [])

    const handleConfirmReopen = useCallback(async (): Promise<void> => {
        const reviewId = pendingReopen?.reviewId

        if (!reviewId) {
            closeReopenDialog()
            return
        }

        setIsReopening(true)

        try {
            await updateReview(reviewId, { committed: false, status: 'PENDING' })
            toast.success('Scorecard reopened.')
            closeReopenDialog()
            await refreshChallengeReviewData(challengeId)
        } catch (error) {
            handleError(error)
        } finally {
            setIsReopening(false)
        }
    }, [
        pendingReopen?.reviewId,
        closeReopenDialog,
        challengeId,
    ])

    const visibleRows = useMemo<Screening[]>(
        () => datas ?? [],
        [datas],
    )

    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
            const tableMode = mode
            const rows = visibleRows
            const submissionColumn: TableColumn<Screening> = {
                className: styles.submissionColumn,
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: Screening) => {
                    const isRestrictedBase = isSubmissionDownloadRestrictedForMember(data.memberId)
                    const normalizedVirusScan = data.isFileSubmission === false
                        ? undefined
                        : data.virusScan
                    const failedScan = normalizedVirusScan === false
                    const isRestrictedForRow = isRestrictedBase || failedScan
                    const tooltipMessage = failedScan
                        ? 'Submission failed virus scan'
                        : (getRestrictionMessageForMember(data.memberId) ?? restrictionMessage)
                    const isButtonDisabled = Boolean(
                        isDownloading[data.submissionId]
                        || isRestrictedForRow,
                    )

                    const downloadButton = (
                        <button
                            onClick={function onClick() {
                                if (isRestrictedForRow) {
                                    return
                                }

                                downloadSubmission(data.submissionId)
                            }}
                            className={styles.textBlue}
                            disabled={isButtonDisabled}
                            type='button'
                        >
                            {data.submissionId}
                        </button>
                    )

                    async function handleCopySubmissionId(
                        event: MouseEvent<HTMLButtonElement>,
                    ): Promise<void> {
                        event.stopPropagation()
                        event.preventDefault()

                        if (!data.submissionId) {
                            return
                        }

                        await copyTextToClipboard(data.submissionId)
                        toast.success('Submission ID copied to clipboard', {
                            toastId: `challenge-submission-id-copy-${data.submissionId}`,
                        })
                    }

                    const renderedDownloadButton = isRestrictedForRow ? (
                        <Tooltip content={tooltipMessage} triggerOn='click-hover'>
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
                                disabled={!data.submissionId}
                            >
                                <IconOutline.DocumentDuplicateIcon />
                            </button>
                        </span>
                    )
                },
                type: 'element',
            }

            const handleColumn: TableColumn<Screening> = {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: Screening) => (
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

            const submissionDateColumn: TableColumn<Screening> = {
                label: 'Submission Date',
                propertyName: 'createdAt',
                renderer: (data: Screening) => (
                    <span>{data.createdAtString}</span>
                ),
                type: 'element',
            }

            const baseColumns: TableColumn<Screening>[] = [
                submissionColumn,
                handleColumn,
                submissionDateColumn,
            ]

            const computeReopenEligibility = (entry: Screening): { canReopen: boolean; isOwnReview: boolean } => {
                if (!entry.reviewId) {
                    return { canReopen: false, isOwnReview: false }
                }

                if (!isReviewPhaseCurrentlyOpen(challengeInfo, entry.reviewPhaseId)) {
                    return { canReopen: false, isOwnReview: false }
                }

                const status = (entry.reviewStatus ?? entry.myReviewStatus ?? '').toUpperCase()
                if (status !== 'COMPLETED') {
                    return { canReopen: false, isOwnReview: false }
                }

                const candidateIds = [
                    entry.myReviewResourceId,
                    entry.screenerId,
                ].filter((id): id is string => Boolean(id))

                const isOwnReview = candidateIds.some(id => myResourceIds.has(id))
                return {
                    canReopen: canReopenGlobally || isOwnReview,
                    isOwnReview,
                }
            }

            if (tableMode === 'submission') {
                return baseColumns
            }

            if (tableMode === 'screening') {
                const screeningColumns: TableColumn<Screening>[] = [
                    ...baseColumns,
                    {
                        label: 'Checkpoint Screener',
                        propertyName: 'screenerHandle',
                        renderer: (data: Screening) => (data.screener?.id ? (
                            <a
                                href={getHandleUrl(data.screener)}
                                target='_blank'
                                rel='noreferrer'
                                style={{
                                    color: data.screener?.handleColor,
                                }}
                                onClick={function onClick() {
                                    window.open(
                                        getHandleUrl(data.screener),
                                        '_blank',
                                    )
                                }}
                            >
                                {data.screener?.memberHandle ?? ''}
                            </a>
                        ) : (
                            <span
                                style={{
                                    color: data.screener?.handleColor,
                                }}
                            >
                                {data.screener?.memberHandle ?? ''}
                            </span>
                        )),
                        type: 'element',
                    },
                    {
                        label: 'Screening Score',
                        propertyName: 'score',
                        renderer: (data: Screening) => {
                            const reviewId = data.reviewId
                            const scoreLabel = data.score ?? 'Pending'

                            if (!reviewId) {
                                return <span>{scoreLabel}</span>
                            }

                            return (
                                <Link
                                    to={`./../review/${reviewId}`}
                                    className={classNames(
                                        styles.scoreLink,
                                        {
                                            [styles.pendingScore]: !data.score || data.score === 'Pending',
                                        },
                                    )}
                                >
                                    {scoreLabel}
                                </Link>
                            )
                        },
                        type: 'element',
                    },
                    {
                        label: 'Screening Result',
                        propertyName: 'result',
                        renderer: (data: Screening) => {
                            if (isReviewRowInProgress(data)) {
                                return <span>-</span>
                            }

                            const val = (data.result || '').toUpperCase()
                            if (val === 'PASS') {
                                return (
                                    <span className={styles.resultPass}>
                                        Pass
                                    </span>
                                )
                            }

                            if (val === 'NO PASS' || val === 'FAIL') {
                                return (
                                    <span className={styles.resultFail}>
                                        Fail
                                    </span>
                                )
                            }

                            return <span>-</span>
                        },
                        type: 'element',
                    },
                ]

                const hasAnyMyAssignment = rows.some(row => Boolean(row.myReviewResourceId))
                const canShowReopenActions = rows.some(row => computeReopenEligibility(row).canReopen)
                if (!hasAnyMyAssignment && !canShowReopenActions) {
                    return screeningColumns
                }

                const actionColumn: TableColumn<Screening> = {
                    label: 'Action',
                    propertyName: 'action',
                    renderer: (data: Screening) => {
                        const actions: Array<{ key: string; render: (isLast: boolean) => JSX.Element }> = []
                        const status = (data.myReviewStatus || '').toUpperCase()

                        if (
                            data.myReviewResourceId
                        && ['COMPLETED', 'SUBMITTED'].includes(status)
                        ) {
                            actions.push({
                                key: `completed-${data.submissionId}`,
                                render: isLast => (
                                    <div
                                        aria-label='Screening completed'
                                        className={classNames(styles.completedAction, { 'last-element': isLast })}
                                        title='Screening completed'
                                    >
                                        <span className={styles.completedIcon} aria-hidden='true'>
                                            <IconOutline.CheckIcon />
                                        </span>
                                        <span className={styles.completedPill}>Screening Complete</span>
                                    </div>
                                ),
                            })
                        } else if (data.myReviewId) {
                            actions.push({
                                key: `complete-${data.myReviewId}`,
                                render: isLast => (
                                    <Link
                                        to={`./../review/${data.myReviewId}`}
                                        className={classNames(styles.submit, { 'last-element': isLast })}
                                    >
                                        <i className='icon-upload' />
                                        Complete Screening
                                    </Link>
                                ),
                            })
                        }

                        const reopenEligibility = computeReopenEligibility(data)
                        const canReopen: boolean = reopenEligibility.canReopen
                        const isOwnReview: boolean = reopenEligibility.isOwnReview
                        if (canReopen) {
                            actions.push({
                                key: `reopen-${data.reviewId}`,
                                render: isLast => (
                                    <button
                                        type='button'
                                        className={classNames(
                                            styles.submit,
                                            styles.textBlue,
                                            { 'last-element': isLast },
                                        )}
                                        // eslint-disable-next-line react/jsx-no-bind
                                        onClick={() => openReopenDialog(data, isOwnReview)}
                                        disabled={isReopening && pendingReopen?.reviewId === data.reviewId}
                                    >
                                        <i className='icon-reopen' />
                                        Reopen Review
                                    </button>
                                ),
                            })
                        }

                        if (!actions.length) {
                            return <span>--</span>
                        }

                        return (
                            <div className={styles.actionsContainer}>
                                {actions.map((action, index) => {
                                    const isLast = index === actions.length - 1
                                    return (
                                        <div
                                            key={action.key}
                                            className={classNames({ 'last-element': isLast })}
                                        >
                                            {action.render(isLast)}
                                        </div>
                                    )
                                })}
                            </div>
                        )
                    },
                    type: 'element',
                }

                return [
                    ...screeningColumns,
                    actionColumn,
                ]
            }

            // mode === 'review'
            const reviewColumns: TableColumn<Screening>[] = [
                ...baseColumns,
                {
                    label: 'Review Score',
                    propertyName: 'score',
                    renderer: (data: Screening) => {
                        const reviewId = data.reviewId
                        const scoreLabel = data.score ?? 'Pending'

                        if (!reviewId) {
                            return <span>{scoreLabel}</span>
                        }

                        return (
                            <Link
                                to={`./../review/${reviewId}`}
                                className={classNames(
                                    styles.scoreLink,
                                    {
                                        [styles.pendingScore]: !data.score || data.score === 'Pending',
                                    },
                                )}
                            >
                                {scoreLabel}
                            </Link>
                        )
                    },
                    type: 'element',
                },
                {
                    label: 'Checkpoint Reviewer',
                    propertyName: 'checkpointReviewer',
                    renderer: (data: Screening) => (data.checkpointReviewer?.id ? (
                        <a
                            href={getHandleUrl(data.checkpointReviewer)}
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                color: data.checkpointReviewer?.handleColor,
                            }}
                            onClick={function onClick() {
                                window.open(
                                    getHandleUrl(data.checkpointReviewer),
                                    '_blank',
                                )
                            }}
                        >
                            {data.checkpointReviewer?.memberHandle ?? ''}
                        </a>
                    ) : (
                        <span
                            style={{
                                color: data.checkpointReviewer?.handleColor,
                            }}
                        >
                            {data.checkpointReviewer?.memberHandle ?? ''}
                        </span>
                    )),
                    type: 'element',
                },
            ]

            const hasAnyMyAssignment = rows.some(row => Boolean(row.myReviewResourceId))
            const canShowReopenActions = rows.some(row => computeReopenEligibility(row).canReopen)
            if (!hasAnyMyAssignment && !canShowReopenActions) {
                return reviewColumns
            }

            const actionColumn: TableColumn<Screening> = {
                label: 'Action',
                propertyName: 'action',
                renderer: (data: Screening) => {
                    const actions: Array<{ key: string; render: (isLast: boolean) => JSX.Element }> = []
                    const status = (data.myReviewStatus || '').toUpperCase()

                    if (
                        data.myReviewResourceId
                    && ['COMPLETED', 'SUBMITTED'].includes(status)
                    ) {
                        actions.push({
                            key: `completed-${data.submissionId}`,
                            render: isLast => (
                                <div
                                    aria-label='Review completed'
                                    className={classNames(styles.completedAction, { 'last-element': isLast })}
                                    title='Review completed'
                                >
                                    <span className={styles.completedIcon} aria-hidden='true'>
                                        <IconOutline.CheckIcon />
                                    </span>
                                    <span className={styles.completedPill}>Review Complete</span>
                                </div>
                            ),
                        })
                    } else if (data.myReviewId) {
                        actions.push({
                            key: `complete-${data.myReviewId}`,
                            render: isLast => (
                                <Link
                                    to={`./../reviews/${data.submissionId}?reviewId=${data.myReviewId}`}
                                    className={classNames(styles.submit, { 'last-element': isLast })}
                                >
                                    <i className='icon-upload' />
                                    Complete Review
                                </Link>
                            ),
                        })
                    }

                    const reopenEligibility = computeReopenEligibility(data)
                    const canReopen: boolean = reopenEligibility.canReopen
                    const isOwnReview: boolean = reopenEligibility.isOwnReview
                    if (canReopen) {
                        actions.push({
                            key: `reopen-${data.reviewId}`,
                            render: isLast => (
                                <button
                                    type='button'
                                    className={classNames(
                                        styles.submit,
                                        styles.textBlue,
                                        { 'last-element': isLast },
                                    )}
                                    // eslint-disable-next-line react/jsx-no-bind
                                    onClick={() => openReopenDialog(data, isOwnReview)}
                                    disabled={isReopening && pendingReopen?.reviewId === data.reviewId}
                                >
                                    <i className='icon-reopen' />
                                    Reopen Review
                                </button>
                            ),
                        })
                    }

                    if (!actions.length) {
                        return <span>--</span>
                    }

                    return (
                        <div className={styles.actionsContainer}>
                            {actions.map((action, index) => {
                                const isLast = index === actions.length - 1
                                return (
                                    <div
                                        key={action.key}
                                        className={classNames({ 'last-element': isLast })}
                                    >
                                        {action.render(isLast)}
                                    </div>
                                )
                            })}
                        </div>
                    )
                },
                type: 'element',
            }

            return [
                ...reviewColumns,
                actionColumn,
            ]
        },
        [
            challengeInfo,
            mode,
            visibleRows,
            downloadSubmission,
            isDownloading,
            restrictionMessage,
            isSubmissionDownloadRestrictedForMember,
            getRestrictionMessageForMember,
            canReopenGlobally,
            myResourceIds,
            openReopenDialog,
            isReopening,
            pendingReopen?.reviewId,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<Screening>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<Screening>[],
        ),
        [columns],
    )

    const hasCheckpointData = visibleRows.length > 0
    const shouldShowEmptyState = !hasCheckpointData && (mode === 'screening' || mode === 'review')

    return (
        <TableWrapper
            className={classNames(styles.container, props.className, 'enhanced-table')}
        >
            {shouldShowEmptyState ? (
                <p className={styles.emptyState}>
                    No checkpoint submissions yet
                </p>
            ) : isTablet ? (
                <TableMobile columns={columnsMobile} data={visibleRows} />
            ) : (
                <Table
                    columns={columns}
                    data={visibleRows}
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

export default TableCheckpointSubmissions

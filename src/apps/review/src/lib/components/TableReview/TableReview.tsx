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
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { handleError, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn } from '~/libs/ui'

import { ChallengeDetailContext } from '../../contexts'
import { useRole, useSubmissionDownloadAccess } from '../../hooks'
import { useSubmissionHistory } from '../../hooks/useSubmissionHistory'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import {
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    SubmissionInfo,
} from '../../models'
import {
    AggregatedReviewDetail,
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    isReviewPhase,
    isReviewPhaseCurrentlyOpen,
    refreshChallengeReviewData,
    REOPEN_MESSAGE_OTHER,
    REOPEN_MESSAGE_SELF,
} from '../../utils'
import { getSubmissionHistoryKey } from '../../utils/submissionHistory'
import { updateReview } from '../../services'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'
import { ConfirmModal } from '../ConfirmModal'
import { createSubmissionMetaMap } from '../common/columnUtils'
import {
    renderReviewDateCell,
    renderReviewScoreCell,
    renderReviewerCell,
    renderScoreCell,
    renderSubmissionIdCell,
    renderSubmitterHandleCell,
} from '../common/TableColumnRenderers'
import type { SubmissionRow } from '../common/types'

import styles from './TableReview.module.scss'

export interface TableReviewProps {
    className?: string
    datas: SubmissionInfo[]
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
    hideHandleColumn?: boolean
    isActiveChallenge?: boolean
}

interface PendingReopenState {
    review?: AggregatedReviewDetail
    submission?: SubmissionRow
    isOwnReview?: boolean
}

type RestrictionResult = {
    restricted: boolean
    message?: string
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
            <button
                key={`reopen-${reviewInfo.id}`}
                type='button'
                className={classNames(styles.actionButton, styles.textBlue)}
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

export const TableReview: FC<TableReviewProps> = ({
    className,
    datas,
    isDownloading,
    downloadSubmission,
    mappingReviewAppeal,
    hideHandleColumn,
}) => {
    const {
        challengeInfo,
        reviewers,
    myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole } = useRole()
    const { hasCopilotRole, isAdmin, ownedMemberIds, canManageCompletedReviews } = useRolePermissions()
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const submissionTypes = useMemo(
        () => new Set(
            datas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [datas],
    )

    const filteredChallengeSubmissions = useMemo(
        () => {
            const challengeSubmissions = challengeInfo?.submissions ?? []

            if (!submissionTypes.size) {
                return challengeSubmissions
            }

            return challengeSubmissions.filter(submission => (
                submission.type ? submissionTypes.has(submission.type) : false
            ))
        },
        [challengeInfo, submissionTypes],
    )

    const {
        closeHistoryModal,
        historyByMember,
        historyEntriesForModal,
        historyKey,
        latestSubmissionIds,
        latestSubmissions,
        openHistoryModal,
        shouldShowHistoryActions,
    } = useSubmissionHistory({
        datas,
        filteredAll: filteredChallengeSubmissions,
        isSubmissionTab: true,
    })

    const restrictToLatest = useMemo(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const submissionMetaById = useMemo(
        () => createSubmissionMetaMap(filteredChallengeSubmissions, datas),
        [datas, filteredChallengeSubmissions],
    )

    const resolveSubmissionMeta = useCallback((submissionId: string) => (
        submissionMetaById.get(submissionId)
    ), [submissionMetaById])

    const getHistoryRestriction = useCallback((submission: SubmissionInfo): RestrictionResult => {
        const memberId = submission.memberId
        const restricted = isSubmissionDownloadRestrictedForMember(memberId) || isSubmissionDownloadRestricted
        const memberMessage = getRestrictionMessageForMember(memberId)
        const message = memberMessage ?? restrictionMessage

        return {
            restricted,
            message,
        }
    }, [
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    ])

    const handleHistoryButtonClick = useCallback((event: MouseEvent<HTMLButtonElement>): void => {
        const submissionId = event.currentTarget.dataset.submissionId
        const memberId = event.currentTarget.dataset.memberId

        if (!submissionId) {
            return
        }

        openHistoryModal(memberId || undefined, submissionId)
    }, [openHistoryModal])

    const myReviewerResourceIds = useMemo(
        () => new Set(
            myResources
                .filter(resource => {
                    const roleName = (resource.roleName || '').toLowerCase()
                    return roleName.includes('reviewer') && !roleName.includes('iterative')
                })
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const submissionsForAggregation = useMemo(
        () => (restrictToLatest ? latestSubmissions : datas),
        [datas, latestSubmissions, restrictToLatest],
    )

    const aggregatedSubmissionRows = useMemo(() => (
        aggregateSubmissionReviews({
            submissions: submissionsForAggregation,
            mappingReviewAppeal,
            reviewers,
        })
    ), [mappingReviewAppeal, reviewers, submissionsForAggregation])

    const aggregatedRows = useMemo<SubmissionRow[]>(() => {
        const rows = aggregatedSubmissionRows.map(aggregated => ({
            ...(aggregated.submission ?? {}),
            ...aggregated.submission,
            aggregated,
        })) as SubmissionRow[]

        if (!restrictToLatest) {
            return rows
        }

        return rows.filter(row => row.id && latestSubmissionIds.has(row.id))
    }, [aggregatedSubmissionRows, latestSubmissionIds, restrictToLatest])

    const maxReviewCount = useMemo(
        () => aggregatedSubmissionRows.reduce(
            (max, aggregated) => Math.max(max, aggregated.reviews?.length ?? 0),
            0,
        ),
        [aggregatedSubmissionRows],
    )

    const [isReopening, setIsReopening] = useState(false)
    const [pendingReopen, setPendingReopen] = useState<PendingReopenState | undefined>(undefined)

    const openReopenDialog = useCallback((submission: SubmissionRow, review: AggregatedReviewDetail): void => {
        const resourceId = review.reviewInfo?.resourceId ?? review.resourceId
        const isOwnReview = resourceId ? myReviewerResourceIds.has(resourceId) : false

        setPendingReopen({
            isOwnReview,
            review,
            submission,
        })
    }, [myReviewerResourceIds])

    const closeReopenDialog = useCallback((): void => {
        setPendingReopen(undefined)
    }, [])

    const handleConfirmReopen = useCallback(async (): Promise<void> => {
        const reviewId = pendingReopen?.review?.reviewInfo?.id
        if (!reviewId) {
            closeReopenDialog()
            return
        }

        setIsReopening(true)

        try {
            await updateReview(reviewId, {
                committed: false,
                status: 'PENDING',
            })
            toast.success('Scorecard reopened.')
            closeReopenDialog()
            if (challengeInfo?.id) {
                await refreshChallengeReviewData(challengeInfo.id)
            }
        } catch (error) {
            handleError(error)
        } finally {
            setIsReopening(false)
        }
    }, [challengeInfo?.id, closeReopenDialog, pendingReopen])

    const tableKey = useMemo(
        () => (actionChallengeRole ? `table-review-${actionChallengeRole}` : 'table-review'),
        [actionChallengeRole],
    )

    const canViewHistory = useMemo(
        () => isAdmin || hasCopilotRole,
        [isAdmin, hasCopilotRole],
    )

    const shouldShowAggregatedActions = useMemo(
        () => isReviewPhase(challengeInfo) && (myReviewerResourceIds.size > 0 || canManageCompletedReviews),
        [canManageCompletedReviews, challengeInfo, myReviewerResourceIds],
    )

    const scoreVisibilityConfig = useMemo(
        () => ({
            canDisplayScores: () => true,
            canViewScorecard: true,
            isAppealsTab: false,
        }),
        [],
    )

    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const submissionIdColumn: TableColumn<SubmissionRow> = {
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (submission: SubmissionRow) => renderSubmissionIdCell(submission, {
                isDownloading,
                downloadSubmission,
                shouldRestrictSubmitterToOwnSubmission: false,
                isSubmissionDownloadRestrictedForMember,
                getRestrictionMessageForMember,
                isSubmissionDownloadRestricted,
                restrictionMessage,
                ownedMemberIds,
            }),
            type: 'element',
        }

        const baseColumns: TableColumn<SubmissionRow>[] = [submissionIdColumn]

        if (!hideHandleColumn) {
            baseColumns.push({
                columnId: 'handle-aggregated',
                label: 'Handle',
                propertyName: 'handle',
                renderer: renderSubmitterHandleCell,
                type: 'element',
            })
        }

        baseColumns.push(
            {
                columnId: 'review-date',
                label: 'Review Date',
                renderer: renderReviewDateCell,
                type: 'element',
            },
            {
                columnId: 'review-score',
                label: 'Review Score',
                renderer: (submission: SubmissionRow) => renderReviewScoreCell(submission, scoreVisibilityConfig),
                type: 'element',
            },
        )

        for (let index = 0; index < maxReviewCount; index += 1) {
            baseColumns.push(
                {
                    columnId: `reviewer-${index}`,
                    label: `Reviewer ${index + 1}`,
                    renderer: (submission: SubmissionRow) => renderReviewerCell(submission, index),
                    type: 'element',
                },
                {
                    columnId: `score-${index}`,
                    label: `Score ${index + 1}`,
                    renderer: (submission: SubmissionRow) => renderScoreCell(submission, index, scoreVisibilityConfig),
                    type: 'element',
                },
            )
        }

        if (shouldShowAggregatedActions) {
            baseColumns.push({
                className: styles.textBlue,
                columnId: 'actions',
                label: 'Actions',
                renderer: (submission: SubmissionRow) => {
                    const reviews = submission.aggregated?.reviews ?? []
                    const myReviewDetail = reviews.find(review => {
                        const resourceId = review.reviewInfo?.resourceId ?? review.resourceId
                        return resourceId ? myReviewerResourceIds.has(resourceId) : false
                    })

                    const reviewId = myReviewDetail?.reviewInfo?.id ?? myReviewDetail?.reviewId
                    const status = (myReviewDetail?.reviewInfo?.status ?? '').toUpperCase()
                    const historyKeyForRow = getSubmissionHistoryKey(submission.memberId, submission.id)
                    const rowHistory = historyByMember.get(historyKeyForRow) ?? []
                    const hasReviewRole = myReviewerResourceIds.size > 0

                    let primaryAction: JSX.Element | undefined
                    if (hasReviewRole) {
                        if (status === 'COMPLETED' || status === 'SUBMITTED') {
                            primaryAction = (
                                <div className={styles.completedAction} key='completed-indicator'>
                                    <span className={styles.completedIcon}>
                                        <IconOutline.CheckIcon />
                                    </span>
                                    <span className={styles.completedPill}>
                                        Review Complete
                                    </span>
                                </div>
                            )
                        } else if (reviewId) {
                            primaryAction = (
                                <Link
                                    key='complete-review'
                                    to={`./../review/${reviewId}`}
                                    className={styles.submit}
                                >
                                    <i className='icon-upload' />
                                    Complete Review
                                </Link>
                            )
                        }
                    }

                    const reopenButtons = createReopenActionButtons(
                        challengeInfo,
                        submission,
                        reviews,
                        {
                            canManageCompletedReviews,
                            isReopening,
                            openReopenDialog,
                            pendingReopen,
                        },
                    )

                    let historyAction: JSX.Element | undefined
                    if (canViewHistory && shouldShowHistoryActions && rowHistory.length > 0) {
                        historyAction = (
                            <button
                                key='view-submission-history'
                                type='button'
                                className={styles.historyButton}
                                data-member-id={submission.memberId ?? ''}
                                data-submission-id={submission.id}
                                onClick={handleHistoryButtonClick}
                            >
                                View Submission History
                            </button>
                        )
                    }

                    const actions = [primaryAction, historyAction, ...reopenButtons].filter(Boolean) as JSX.Element[]

                    if (!actions.length) {
                        return <span className={styles.notReviewed}>--</span>
                    }

                    if (actions.length === 1) {
                        return actions[0] ?? null
                    }

                    return (
                        <span className={styles.actionsCell}>
                            {actions.map((action, index) => (
                                <span
                                    key={`action-${index}`}
                                    className={styles.actionItem}
                                >
                                    {action}
                                </span>
                            ))}
                        </span>
                    )
                },
                type: 'element',
            })
        }

        return baseColumns
    }, [
        canManageCompletedReviews,
        canViewHistory,
        challengeInfo,
        downloadSubmission,
        getRestrictionMessageForMember,
        handleHistoryButtonClick,
        hideHandleColumn,
        historyByMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        maxReviewCount,
        myReviewerResourceIds,
        openReopenDialog,
        ownedMemberIds,
        pendingReopen,
        restrictionMessage,
        scoreVisibilityConfig,
        shouldShowAggregatedActions,
        shouldShowHistoryActions,
        isReopening,
    ])

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

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={aggregatedRows} />
            ) : (
                <Table
                    key={tableKey}
                    columns={columns}
                    data={aggregatedRows}
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

export default TableReview

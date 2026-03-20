import {
    FC,
    useContext,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'

import { WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import {
    ChallengeDetailContextModel,
    ChallengeInfo,
    MappingReviewAppeal,
    SubmissionInfo,
} from '../../models'
import {
    aggregateSubmissionReviews,
} from '../../utils/aggregateSubmissionReviews'
import { challengeHasSubmissionLimit } from '../../utils/challenge'
import { hasIsLatestFlag } from '../../utils'
import { getReviewRoute } from '../../utils/routes'
import { TableWrapper } from '../TableWrapper'
import {
    renderAppealsCell,
    renderRemainingCell,
    renderReviewDateCell,
    renderReviewerCell,
    renderReviewScoreCell,
    renderScoreCell,
    renderSubmissionIdCell,
    renderSubmitterHandleCell,
} from '../common/TableColumnRenderers'
import type {
    DownloadButtonConfig,
    ScoreVisibilityConfig,
    SubmissionReviewerRow,
    SubmissionRow,
} from '../common/types'
import type { AggregatedSubmissionReviews } from '../../utils/aggregateSubmissionReviews'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'
import { buildSubmissionReviewerRows } from '../common/reviewResult'

import styles from './TableAppealsResponse.module.scss'

export interface TableAppealsResponseProps {
    className?: string
    datas: SubmissionInfo[]
    aiReviewers?: { aiWorkflowId: string }[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
    hideHandleColumn?: boolean
}

export const TableAppealsResponse: FC<TableAppealsResponseProps> = (props: TableAppealsResponseProps) => {
    const className: string | undefined = props.className
    const datas: SubmissionInfo[] = props.datas
    const downloadSubmission: (submissionId: string) => void = props.downloadSubmission
    const hideHandleColumn: boolean | undefined = props.hideHandleColumn
    const isDownloading: IsRemovingType = props.isDownloading
    const mappingReviewAppeal: MappingReviewAppeal = props.mappingReviewAppeal
    const {
        challengeInfo,
        myResources,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()

    const myReviewerResourceIds = useMemo<Set<string>>(
        () => new Set<string>(
            myResources
                .filter(resource => (resource.roleName || '').toLowerCase()
                    .includes('reviewer'))
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const downloadAccess: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    }: UseSubmissionDownloadAccessResult = downloadAccess
    const {
        hasCopilotRole,
        hasReviewerRole,
        hasSubmitterRole,
        isAdmin,
        ownedMemberIds,
    }: UseRolePermissionsResult = useRolePermissions()

    const canViewAllAppeals = isAdmin || hasCopilotRole
    const canViewAsReviewer = hasReviewerRole
    const canViewAsSubmitter = hasSubmitterRole
    const canRender = canViewAllAppeals || canViewAsReviewer || canViewAsSubmitter
    const canRespondToAppeals = hasReviewerRole || isAdmin

    const isAppealsResponsePhaseOpen = useMemo<boolean>(
        () => (challengeInfo?.phases ?? []).some(phase => phase?.name?.toLowerCase() === 'appeals response'
            && phase.isOpen),
        [challengeInfo?.phases],
    )

    const challengeType: ChallengeInfo['type'] | undefined = challengeInfo?.type
    const challengeTrack: ChallengeInfo['track'] | undefined = challengeInfo?.track

    const hasAppealsPhase = useMemo<boolean>(
        () => (challengeInfo?.phases ?? []).some(phase => {
            const normalizedName = phase?.name?.toLowerCase()
            return normalizedName === 'appeals'
                || normalizedName === 'appeals response'
        }),
        [challengeInfo?.phases],
    )

    const allowsAppeals = useMemo<boolean>(
        () => hasAppealsPhase
            && !(
                includes(WITHOUT_APPEAL, challengeType?.name)
                || includes(WITHOUT_APPEAL, challengeTrack?.name)
            ),
        [
            challengeTrack?.name,
            challengeType?.name,
            hasAppealsPhase,
        ],
    )

    const normalizedChallengeStatus = useMemo<string>(
        () => (challengeInfo?.status ?? '')
            .trim()
            .toUpperCase(),
        [challengeInfo?.status],
    )

    const submitterCanViewAllRows = useMemo<boolean>(
        () => normalizedChallengeStatus.startsWith('COMPLETED'),
        [normalizedChallengeStatus],
    )

    const submissionTypes = useMemo<Set<string>>(
        () => new Set<string>(
            datas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [datas],
    )

    const filteredChallengeSubmissions = useMemo<SubmissionInfo[]>(
        () => {
            const submissions = challengeInfo?.submissions ?? []
            if (!submissionTypes.size) {
                return submissions
            }

            return submissions.filter(submission => submission.type
                && submissionTypes.has(submission.type))
        },
        [challengeInfo?.submissions, submissionTypes],
    )

    const restrictToLatest = useMemo<boolean>(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const hasLatestFlag = useMemo<boolean>(
        () => hasIsLatestFlag(datas),
        [datas],
    )

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => (restrictToLatest && hasLatestFlag
            ? datas.filter(submission => submission.isLatest)
            : datas),
        [datas, hasLatestFlag, restrictToLatest],
    )

    const aggregatedResults = useMemo<AggregatedSubmissionReviews[]>(
        () => aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers: reviewers ?? [],
            submissions: submissionsForAggregation,
        }),
        [mappingReviewAppeal, reviewers, submissionsForAggregation],
    )

    const aggregatedRows = useMemo<SubmissionRow[]>(() => {
        const challengeSubmissionIds = new Set<string>(
            (filteredChallengeSubmissions ?? [])
                .map(submission => submission?.id)
                .filter((id): id is string => Boolean(id)),
        )

        const rows = aggregatedResults
            .filter(result => {
                if (!result.id) {
                    return true
                }

                if (challengeSubmissionIds.size && !challengeSubmissionIds.has(result.id)) {
                    return false
                }

                return true
            })
            .map(result => ({
                ...result.submission,
                aggregated: result,
            }))

        return rows
    }, [
        aggregatedResults,
        filteredChallengeSubmissions,
    ])

    const visibleRows = useMemo<SubmissionRow[]>(() => {
        if (!canRender) {
            return []
        }

        if (canViewAllAppeals) {
            return aggregatedRows
        }

        if (canViewAsSubmitter && submitterCanViewAllRows) {
            return aggregatedRows
        }

        const matchesSubmitter = (row: SubmissionRow): boolean => {
            if (!canViewAsSubmitter) {
                return false
            }

            const memberId = row.memberId
            if (!memberId || !ownedMemberIds.has(memberId)) {
                return false
            }

            const submissionType = row.type?.toUpperCase()
            if (!submissionType) {
                return true
            }

            return submissionType === 'CONTEST_SUBMISSION'
        }

        const matchesReviewer = (row: SubmissionRow): boolean => {
            if (!canViewAsReviewer) {
                return false
            }

            const reviews = row.aggregated?.reviews ?? []
            return reviews.some(review => review.resourceId && myReviewerResourceIds.has(review.resourceId))
        }

        return aggregatedRows.filter(row => matchesSubmitter(row) || matchesReviewer(row))
    }, [
        aggregatedRows,
        canRender,
        canViewAllAppeals,
        canViewAsReviewer,
        canViewAsSubmitter,
        myReviewerResourceIds,
        ownedMemberIds,
        submitterCanViewAllRows,
    ])

    const reviewerRows = useMemo<SubmissionReviewerRow[]>(
        () => buildSubmissionReviewerRows(visibleRows),
        [visibleRows],
    )

    const downloadButtonConfig = useMemo<DownloadButtonConfig>(
        () => ({
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission,
        }),
        [
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission,
        ],
    )

    const scoreVisibilityConfig = useMemo<ScoreVisibilityConfig>(
        () => ({
            canDisplayScores: () => true,
            canRespondToAppeals,
            canViewScorecard: true,
            isAppealsTab: false,
        }),
        [canRespondToAppeals],
    )

    const columns = useMemo<TableColumn<SubmissionReviewerRow>[]>(() => {
        const submissionIdColumn: TableColumn<SubmissionReviewerRow> = {
            className: classNames(styles.submissionColumn, 'no-row-border'),
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (row: SubmissionReviewerRow) => (
                row.isFirstReviewerRow
                    ? renderSubmissionIdCell(row, downloadButtonConfig)
                    : <span />
            ),
            type: 'element',
        }

        const baseColumns: TableColumn<SubmissionReviewerRow>[] = [submissionIdColumn]

        if (!hideHandleColumn) {
            baseColumns.push({
                className: 'no-row-border',
                columnId: 'handle-aggregated',
                label: 'Submitter',
                propertyName: 'handle',
                renderer: (row: SubmissionReviewerRow) => (
                    row.isFirstReviewerRow
                        ? renderSubmitterHandleCell(row)
                        : <span />
                ),
                type: 'element',
            })
        }

        baseColumns.push({
            className: 'no-row-border',
            columnId: 'review-score',
            label: 'Review Score',
            renderer: (row: SubmissionReviewerRow) => (
                row.isFirstReviewerRow
                    ? renderReviewScoreCell(row, scoreVisibilityConfig)
                    : <span />
            ),
            type: 'element',
        })

        baseColumns.push(
            {
                columnId: 'reviewer',
                label: 'Reviewer',
                renderer: (row: SubmissionReviewerRow) => renderReviewerCell(
                    row,
                    row.reviewerIndex,
                ),
                type: 'element',
            },
            {
                columnId: 'review-date',
                label: 'Review Date',
                renderer: (row: SubmissionReviewerRow) => renderReviewDateCell(row),
                type: 'element',
            },
            {
                columnId: 'score',
                label: 'Score',
                renderer: (row: SubmissionReviewerRow) => renderScoreCell(
                    row,
                    row.reviewerIndex,
                    scoreVisibilityConfig,
                ),
                type: 'element',
            },
        )

        if (allowsAppeals) {
            baseColumns.push(
                {
                    className: styles.tableCellNoWrap,
                    columnId: 'appeals',
                    label: 'Appeals',
                    renderer: (row: SubmissionReviewerRow) => renderAppealsCell(
                        row,
                        row.reviewerIndex,
                        scoreVisibilityConfig,
                    ),
                    type: 'element',
                },
                {
                    className: styles.tableCellNoWrap,
                    columnId: 'remaining',
                    label: 'Remaining',
                    renderer: (row: SubmissionReviewerRow) => renderRemainingCell(
                        row,
                        row.reviewerIndex,
                    ),
                    type: 'element',
                },
            )
        }

        if (isAppealsResponsePhaseOpen && canRespondToAppeals) {
            baseColumns.push({
                columnId: 'actions',
                label: 'Actions',
                renderer: (row: SubmissionReviewerRow) => {
                    const reviewDetail = row.aggregated?.reviews?.[row.reviewerIndex]
                    const reviewId = reviewDetail?.reviewInfo?.id ?? reviewDetail?.reviewId
                    const rowReviewerResourceId = reviewDetail?.resourceId ?? reviewDetail?.reviewInfo?.resourceId
                    const canRespondThisRow = isAdmin
                        || (!!rowReviewerResourceId && myReviewerResourceIds.has(rowReviewerResourceId))

                    if (!reviewDetail || !reviewId) {
                        return (
                            <span className={styles.notReviewed}>
                                --
                            </span>
                        )
                    }

                    const totalAppeals = reviewDetail.totalAppeals ?? 0
                    const finishedAppeals = reviewDetail.finishedAppeals ?? 0
                    const remaining = Math.max(totalAppeals - finishedAppeals, 0)

                    if (remaining <= 0) {
                        return (
                            <span className={styles.notReviewed}>
                                --
                            </span>
                        )
                    }

                    if (!canRespondThisRow) {
                        return (
                            <span className={styles.notReviewed}>
                                --
                            </span>
                        )
                    }

                    return (
                        <span className={styles.actionsCell}>
                            <span
                                className={classNames(
                                    styles.actionItem,
                                    'last-element',
                                )}
                            >
                                <Link
                                    className={styles.respondButton}
                                    to={getReviewRoute(row.id, reviewId, canRespondThisRow)}
                                >
                                    Respond to Appeals
                                </Link>
                            </span>
                        </span>
                    )
                },
                type: 'element',
            })
        }

        if (props.aiReviewers) {
            baseColumns.push({
                columnId: 'ai-reviews-table',
                isExpand: true,
                label: '',
                renderer: (row: SubmissionReviewerRow, allRows: SubmissionReviewerRow[]) => {
                    if (!row.isLastReviewerRow || !props.aiReviewers) {
                        return <span />
                    }

                    const firstIndexForSubmission = allRows.findIndex(candidate => (
                        candidate.id === row.id && candidate.isFirstReviewerRow
                    ))
                    const defaultOpen = firstIndexForSubmission === 0

                    return (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers}
                            submission={row as any}
                            defaultOpen={defaultOpen}
                        />
                    )
                },
                type: 'element',
            })
        }

        return baseColumns
    }, [
        allowsAppeals,
        downloadButtonConfig,
        hideHandleColumn,
        canRespondToAppeals,
        isAppealsResponsePhaseOpen,
        isAdmin,
        myReviewerResourceIds,
        scoreVisibilityConfig,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionReviewerRow>[][]>(
        () => columns.map(column => {
            const label = typeof column.label === 'function'
                ? column.label()
                : column.label ?? ''

            const labelColumn: MobileTableColumn<SubmissionReviewerRow> = {
                columnId: `${column.columnId}-label`,
                label: '',
                mobileType: 'label',
                renderer: () => (
                    <span className={styles.mobileLabel}>
                        {label}
                    </span>
                ),
                type: 'element',
            }

            const valueColumn: MobileTableColumn<SubmissionReviewerRow> = {
                ...column,
                colSpan: label ? 1 : 2,
                columnId: `${column.columnId}-value`,
                label: '',
                mobileType: 'last-value',
                ...(column.columnId === 'actions' ? { colSpan: 2 } : {}),
            }

            return [!!label && labelColumn, valueColumn].filter(Boolean) as MobileTableColumn<SubmissionReviewerRow>[]
        }),
        [columns],
    )

    const isTablet = useMemo<boolean>(
        () => screenWidth <= 744,
        [screenWidth],
    )

    if (!canRender) {
        return <></>
    }

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={reviewerRows} />
            ) : (
                <Table
                    showExpand
                    expandMode='always'
                    columns={columns}
                    data={reviewerRows}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

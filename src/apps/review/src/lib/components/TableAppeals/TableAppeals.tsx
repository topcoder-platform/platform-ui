import {
    FC,
    useContext,
    useMemo,
} from 'react'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'

import { WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import {
    ChallengeDetailContextModel,
    ChallengeInfo,
    MappingReviewAppeal,
    ReviewAppContextModel,
    SubmissionInfo,
} from '../../models'
import { TableWrapper } from '../TableWrapper'
import {
    aggregateSubmissionReviews,
} from '../../utils/aggregateSubmissionReviews'
import { challengeHasSubmissionLimit } from '../../utils/challenge'
import {
    renderAppealsCell,
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
import { buildSubmissionReviewerRows } from '../common/types'
import type { AggregatedSubmissionReviews } from '../../utils/aggregateSubmissionReviews'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TableAppeals.module.scss'

export interface TableAppealsProps {
    className?: string
    aiReviewers?: { aiWorkflowId: string }[]
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
    hideHandleColumn?: boolean
}

export const TableAppeals: FC<TableAppealsProps> = (props: TableAppealsProps) => {
    const className: string | undefined = props.className
    const datas: SubmissionInfo[] = props.datas
    const downloadSubmission: (submissionId: string) => void = props.downloadSubmission
    const hideHandleColumn: boolean | undefined = props.hideHandleColumn
    const isDownloading: IsRemovingType = props.isDownloading
    const mappingReviewAppeal: MappingReviewAppeal = props.mappingReviewAppeal
    const {
        challengeInfo,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
    const downloadAccess: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = downloadAccess
    const {
        hasCopilotRole,
        hasReviewerRole,
        isAdmin,
        ownedMemberIds,
    }: UseRolePermissionsResult = useRolePermissions()

    const shouldShowAggregatedReviewScore = useMemo<boolean>(
        () => !(
            hasReviewerRole
            && !hasCopilotRole
            && !isAdmin
        ),
        [
            hasCopilotRole,
            hasReviewerRole,
            isAdmin,
        ],
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

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => (restrictToLatest
            ? datas.filter(submission => submission.isLatest)
            : datas),
        [datas, restrictToLatest],
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
        const latestSubmissionIds = restrictToLatest
            ? new Set(
                datas
                    .filter(submission => submission.isLatest && submission.id)
                    .map(submission => submission.id as string),
            )
            : undefined

        const challengeSubmissionIds = new Set<string>(
            filteredChallengeSubmissions
                .map(submission => submission?.id)
                .filter((id): id is string => Boolean(id)),
        )

        return aggregatedResults
            .filter(result => {
                if (!result.id) {
                    return true
                }

                if (challengeSubmissionIds.size && !challengeSubmissionIds.has(result.id)) {
                    return false
                }

                if (!latestSubmissionIds) {
                    return true
                }

                return latestSubmissionIds.has(result.id)
            })
            .map(result => ({
                ...result.submission,
                aggregated: result,
            }))
    }, [
        aggregatedResults,
        datas,
        filteredChallengeSubmissions,
        restrictToLatest,
    ])

    const reviewerRows = useMemo<SubmissionReviewerRow[]>(
        () => buildSubmissionReviewerRows(aggregatedRows),
        [aggregatedRows],
    )

    const { canViewAllSubmissions }: UseRolePermissionsResult = useRolePermissions()

    const isCompletedDesignChallenge = useMemo(() => {
        if (!challengeInfo) return false
        const type = challengeInfo.track.name ? String(challengeInfo.track.name)
            .toLowerCase() : ''
        const status = challengeInfo.status ? String(challengeInfo.status)
            .toLowerCase() : ''
        return type === 'design' && (
            status === 'completed'
        )
    }, [challengeInfo])

    const isSubmissionsViewable = useMemo(() => {
        if (!challengeInfo?.metadata?.length) return false
        return challengeInfo.metadata.some(m => m.name === 'submissionsViewable' && String(m.value)
            .toLowerCase() === 'true')
    }, [challengeInfo])

    const canViewSubmissions = useMemo(() => {
        if (isCompletedDesignChallenge) {
            return canViewAllSubmissions || isSubmissionsViewable
        }

        return true
    }, [isCompletedDesignChallenge, isSubmissionsViewable, canViewAllSubmissions])

    const isSubmissionNotViewable = (submission: SubmissionRow): boolean => (
        !canViewSubmissions && String(submission.memberId) !== String(loginUserInfo?.userId)
    )

    const downloadButtonConfig = useMemo<DownloadButtonConfig>(
        () => ({
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            isSubmissionNotViewable,
            ownedMemberIds,
            restrictionMessage,
            shouldRestrictSubmitterToOwnSubmission: false,
        }),
        [
            downloadSubmission,
            getRestrictionMessageForMember,
            isDownloading,
            isSubmissionDownloadRestricted,
            isSubmissionDownloadRestrictedForMember,
            ownedMemberIds,
            restrictionMessage,
        ],
    )

    const scoreVisibilityConfig = useMemo<ScoreVisibilityConfig>(
        () => {
            const canAccessScorecards = isAdmin || hasCopilotRole || hasReviewerRole

            return {
                canDisplayScores: (submission: SubmissionRow) => {
                    if (canAccessScorecards) {
                        return true
                    }

                    const submissionOwnerId = submission.memberId
                    return submissionOwnerId
                        ? ownedMemberIds.has(submissionOwnerId)
                        : false
                },
                canRespondToAppeals: isAdmin || hasReviewerRole,
                canViewScorecard: canAccessScorecards,
                isAppealsTab: true,
            }
        },
        [
            hasCopilotRole,
            hasReviewerRole,
            isAdmin,
            ownedMemberIds,
        ],
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

        if (shouldShowAggregatedReviewScore) {
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
        }

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
            baseColumns.push({
                className: styles.tableCellNoWrap,
                columnId: 'appeals',
                label: 'Appeals',
                renderer: (row: SubmissionReviewerRow) => renderAppealsCell(
                    row,
                    row.reviewerIndex,
                    scoreVisibilityConfig,
                ),
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
        scoreVisibilityConfig,
        shouldShowAggregatedReviewScore,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionReviewerRow>[][]>(
        () => columns.map(column => ([
            column.label && {
                columnId: `${column.columnId}-label`,
                label: '',
                mobileType: 'label',
                renderer: () => (
                    <span className={styles.mobileLabel}>
                        {typeof column.label === 'function'
                            ? column.label()
                            : column.label ?? ''}
                    </span>
                ),
                type: 'element',
            },
            {
                ...column,
                colSpan: column.label ? 1 : 2,
                columnId: `${column.columnId}-value`,
                label: '',
                mobileType: 'last-value',
            },
        ]).filter(Boolean) as MobileTableColumn<SubmissionReviewerRow>[]),
        [columns],
    )

    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

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
                    columns={columns}
                    data={reviewerRows}
                    showExpand
                    expandMode='always'
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

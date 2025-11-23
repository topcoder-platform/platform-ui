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
    SubmissionRow,
} from '../common/types'
import type { AggregatedSubmissionReviews } from '../../utils/aggregateSubmissionReviews'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

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
    const canRespondToAppeals = hasReviewerRole

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

    const maxReviewCount = useMemo<number>(
        () => visibleRows.reduce(
            (maxCount, row) => {
                const reviewCount = row.aggregated?.reviews?.length ?? 0
                return reviewCount > maxCount ? reviewCount : maxCount
            },
            0,
        ),
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
            renderer: (submission: SubmissionRow) => renderSubmissionIdCell(
                submission,
                downloadButtonConfig,
            ),
            type: 'element',
        }

        const baseColumns: TableColumn<SubmissionRow>[] = [submissionIdColumn]

        if (!hideHandleColumn) {
            baseColumns.push({
                columnId: 'handle-aggregated',
                label: 'Submitter',
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
                renderer: (submission: SubmissionRow) => renderReviewScoreCell(
                    submission,
                    scoreVisibilityConfig,
                ),
                type: 'element',
            },
        )

        for (let index = 0; index < maxReviewCount; index += 1) {
            const reviewerLabel = maxReviewCount === 1 ? 'Reviewer' : `Reviewer ${index + 1}`
            const scoreLabel = maxReviewCount === 1 ? 'Score' : `Score ${index + 1}`
            const appealsLabel = maxReviewCount === 1 ? 'Appeals' : `Appeals ${index + 1}`
            const remainingLabel = maxReviewCount === 1 ? 'Remaining' : `Remaining ${index + 1}`

            baseColumns.push({
                columnId: `reviewer-${index}`,
                label: reviewerLabel,
                renderer: (submission: SubmissionRow) => renderReviewerCell(
                    submission,
                    index,
                ),
                type: 'element',
            })

            baseColumns.push({
                columnId: `score-${index}`,
                label: scoreLabel,
                renderer: (submission: SubmissionRow) => renderScoreCell(
                    submission,
                    index,
                    scoreVisibilityConfig,
                ),
                type: 'element',
            })

            if (allowsAppeals) {
                baseColumns.push({
                    className: styles.tableCellNoWrap,
                    columnId: `appeals-${index}`,
                    label: appealsLabel,
                    renderer: (submission: SubmissionRow) => renderAppealsCell(
                        submission,
                        index,
                        scoreVisibilityConfig,
                    ),
                    type: 'element',
                })

                baseColumns.push({
                    className: styles.tableCellNoWrap,
                    columnId: `remaining-${index}`,
                    label: remainingLabel,
                    renderer: (submission: SubmissionRow) => renderRemainingCell(
                        submission,
                        index,
                    ),
                    type: 'element',
                })
            }
        }

        if (isAppealsResponsePhaseOpen && canRespondToAppeals) {
            baseColumns.push({
                columnId: 'actions',
                label: 'Actions',
                renderer: (submission: SubmissionRow) => {
                    const reviews = submission.aggregated?.reviews ?? []

                    const actionableReviews = reviews
                        .map(review => {
                            const reviewId = review.reviewInfo?.id ?? review.reviewId
                            if (!reviewId) {
                                return undefined
                            }

                            const totalAppeals = review.totalAppeals ?? 0
                            const finishedAppeals = review.finishedAppeals ?? 0
                            const remaining = Math.max(totalAppeals - finishedAppeals, 0)

                            if (remaining <= 0) {
                                return undefined
                            }

                            return reviewId
                        })
                        .filter((reviewId): reviewId is string => Boolean(reviewId))

                    if (!actionableReviews.length) {
                        return (
                            <span className={styles.notReviewed}>
                                --
                            </span>
                        )
                    }

                    return (
                        <span className={styles.actionsCell}>
                            {actionableReviews.map((reviewId, index, array) => (
                                <span
                                    key={`respond-${reviewId}`}
                                    className={classNames(
                                        styles.actionItem,
                                        index === array.length - 1 && 'last-element',
                                    )}
                                >
                                    <Link
                                        className={styles.respondButton}
                                        to={getReviewRoute(submission.id, reviewId)}
                                    >
                                        Respond to Appeals
                                    </Link>
                                </span>
                            ))}
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
                renderer: (submission: SubmissionRow, allRows: SubmissionRow[]) => (
                    props.aiReviewers && (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers}
                            submission={submission as any}
                            defaultOpen={allRows ? !allRows.indexOf(submission) : false}
                        />
                    )
                ),
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
        maxReviewCount,
        scoreVisibilityConfig,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(column => {
            const label = typeof column.label === 'function'
                ? column.label()
                : column.label ?? ''

            const labelColumn: MobileTableColumn<SubmissionRow> = {
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

            const valueColumn: MobileTableColumn<SubmissionRow> = {
                ...column,
                colSpan: label ? 1 : 2,
                columnId: `${column.columnId}-value`,
                label: '',
                mobileType: 'last-value',
                ...(column.columnId === 'actions' ? { colSpan: 2 } : {}),
            }

            return [!!label && labelColumn, valueColumn].filter(Boolean) as MobileTableColumn<SubmissionRow>[]
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
                <TableMobile columns={columnsMobile} data={visibleRows} />
            ) : (
                <Table
                    showExpand
                    expandMode='always'
                    columns={columns}
                    data={visibleRows}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

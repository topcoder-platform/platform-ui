import {
    FC,
    useContext,
    useMemo,
} from 'react'
import _, { includes } from 'lodash'
import classNames from 'classnames'
import { Link } from 'react-router-dom'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'

import { WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import {
    ChallengeDetailContextModel,
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
    renderReviewScoreCell,
    renderReviewerCell,
    renderScoreCell,
    renderSubmissionIdCell,
    renderSubmitterHandleCell,
} from '../common/TableColumnRenderers'
import type {
    DownloadButtonConfig,
    ScoreVisibilityConfig,
    SubmissionRow,
} from '../common/types'

import styles from './TableAppealsResponse.module.scss'

export interface TableAppealsResponseProps {
    className?: string
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
    hideHandleColumn?: boolean
    isActiveChallenge?: boolean
}

export const TableAppealsResponse: FC<TableAppealsResponseProps> = ({
    className,
    datas,
    isDownloading,
    downloadSubmission,
    mappingReviewAppeal,
    hideHandleColumn,
}) => {
    const {
        challengeInfo,
        myResources,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()

    const myReviewerResourceIds = useMemo(
        () => new Set(
            myResources
                .filter(resource => (resource.roleName || '').toLowerCase().includes('reviewer'))
                .map(resource => resource.id)
                .filter((id): id is string => Boolean(id)),
        ),
        [myResources],
    )

    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    } = useSubmissionDownloadAccess()
    const { hasCopilotRole, hasReviewerRole, hasSubmitterRole, isAdmin, ownedMemberIds } = useRolePermissions()

    const canViewAllAppeals = isAdmin || hasCopilotRole
    const canViewAsReviewer = hasReviewerRole
    const canViewAsSubmitter = hasSubmitterRole

    if (!canViewAllAppeals && !canViewAsReviewer && !canViewAsSubmitter) {
        return null
    }

    const isAppealsResponsePhaseOpen = useMemo(
        () => (challengeInfo?.phases ?? []).some(phase => phase?.name?.toLowerCase() === 'appeals response'
            && phase.isOpen),
        [challengeInfo?.phases],
    )

    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track

    const hasAppealsPhase = useMemo(
        () => (challengeInfo?.phases ?? []).some(phase => {
            const normalizedName = phase?.name?.toLowerCase()
            return normalizedName === 'appeals'
                || normalizedName === 'appeals response'
        }),
        [challengeInfo?.phases],
    )

    const allowsAppeals = useMemo(
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

    const submissionTypes = useMemo(
        () => new Set<string>(
            datas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [datas],
    )

    const filteredChallengeSubmissions = useMemo(
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

    const restrictToLatest = useMemo(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const hasLatestFlag = useMemo(
        () => hasIsLatestFlag(datas),
        [datas],
    )

    const submissionsForAggregation = useMemo(
        () => (restrictToLatest && hasLatestFlag
            ? datas.filter(submission => submission.isLatest)
            : datas),
        [datas, hasLatestFlag, restrictToLatest],
    )

    const aggregatedResults = useMemo(
        () => aggregateSubmissionReviews({
            submissions: submissionsForAggregation,
            mappingReviewAppeal,
            reviewers: reviewers ?? [],
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

        if (!restrictToLatest || !hasLatestFlag) {
            return rows
        }

        return rows.filter(row => row.isLatest)
    }, [
        aggregatedResults,
        filteredChallengeSubmissions,
        hasLatestFlag,
        restrictToLatest,
    ])

    const visibleRows = useMemo(() => {
        if (canViewAllAppeals) {
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
        canViewAllAppeals,
        canViewAsReviewer,
        canViewAsSubmitter,
        myReviewerResourceIds,
        ownedMemberIds,
    ])

    const maxReviewCount = useMemo(
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
            isDownloading,
            downloadSubmission,
            shouldRestrictSubmitterToOwnSubmission,
            isSubmissionDownloadRestrictedForMember,
            getRestrictionMessageForMember,
            isSubmissionDownloadRestricted,
            restrictionMessage,
            ownedMemberIds,
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

        if (isAppealsResponsePhaseOpen) {
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
                                        to={getReviewRoute(reviewId)}
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

        return baseColumns
    }, [
        allowsAppeals,
        downloadButtonConfig,
        hideHandleColumn,
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
                columnId: `${column.columnId}-value`,
                label: '',
                mobileType: 'last-value',
                ...(column.columnId === 'actions' ? { colSpan: 2 } : {}),
            }

            return [labelColumn, valueColumn]
        }),
        [columns],
    )

    const isTablet = useMemo(
        () => screenWidth <= 744,
        [screenWidth],
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
        </TableWrapper>
    )
}

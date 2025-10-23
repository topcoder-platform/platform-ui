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
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks/useSubmissionDownloadAccess'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { useRolePermissions } from '../../hooks/useRolePermissions'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import {
    ChallengeDetailContextModel,
    ChallengeInfo,
    MappingReviewAppeal,
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
    SubmissionRow,
} from '../common/types'
import type { AggregatedSubmissionReviews } from '../../utils/aggregateSubmissionReviews'

import styles from './TableAppeals.module.scss'

export interface TableAppealsProps {
    className?: string
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

    const maxReviewCount = useMemo<number>(
        () => aggregatedResults.reduce(
            (maxCount, result) => {
                const reviewCount = result.reviews?.length ?? 0
                return reviewCount > maxCount ? reviewCount : maxCount
            },
            0,
        ),
        [aggregatedResults],
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

        baseColumns.push({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: renderReviewDateCell,
            type: 'element',
        })

        if (shouldShowAggregatedReviewScore) {
            baseColumns.push({
                columnId: 'review-score',
                label: 'Review Score',
                renderer: (submission: SubmissionRow) => renderReviewScoreCell(
                    submission,
                    scoreVisibilityConfig,
                ),
                type: 'element',
            })
        }

        for (let index = 0; index < maxReviewCount; index += 1) {
            const reviewerLabel = maxReviewCount === 1
                ? 'Reviewer'
                : `Reviewer ${index + 1}`
            const scoreLabel = maxReviewCount === 1
                ? 'Score'
                : `Score ${index + 1}`
            const appealsLabel = maxReviewCount === 1
                ? 'Appeals'
                : `Appeals ${index + 1}`

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
            }
        }

        return baseColumns
    }, [
        allowsAppeals,
        downloadButtonConfig,
        hideHandleColumn,
        maxReviewCount,
        scoreVisibilityConfig,
        shouldShowAggregatedReviewScore,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(column => ([
            {
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
                columnId: `${column.columnId}-value`,
                label: '',
                mobileType: 'last-value',
            },
        ]) as MobileTableColumn<SubmissionRow>[]),
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
                <TableMobile columns={columnsMobile} data={aggregatedRows} />
            ) : (
                <Table
                    columns={columns}
                    data={aggregatedRows}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

import {
    FC,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import { includes, noop } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'

import {
    ChallengeDetailContextModel,
    ChallengeInfo,
    MappingReviewAppeal,
    SubmissionInfo,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { TableWrapper } from '../TableWrapper'
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
import {
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    filterSubmissionRowsByOwnership,
    isAppealsPhase,
    isAppealsResponsePhase,
    partitionSubmissionHistory,
} from '../../utils'
import type {
    AggregatedSubmissionReviews,
    SubmissionHistoryPartition,
} from '../../utils'
import {
    useRolePermissions,
    useScoreVisibility,
    useSubmissionDownloadAccess,
} from '../../hooks'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import type { UseScoreVisibilityResult } from '../../hooks/useScoreVisibility'
import {
    FIRST2FINISH,
    TRACK_CHALLENGE,
    WITHOUT_APPEAL,
} from '../../../config/index.config'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'
import { buildSubmissionReviewerRows } from '../common/reviewResult'

import styles from './TableAppealsForSubmitter.module.scss'

export interface TableAppealsForSubmitterProps {
    className?: string
    aiReviewers?: { aiWorkflowId: string }[]
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
}

export const TableAppealsForSubmitter: FC<TableAppealsForSubmitterProps> = (props: TableAppealsForSubmitterProps) => {
    const className: string | undefined = props.className
    const datas: SubmissionInfo[] = props.datas
    const downloadSubmission: (submissionId: string) => void = props.downloadSubmission
    const isDownloading: IsRemovingType = props.isDownloading
    const mappingReviewAppeal: MappingReviewAppeal = props.mappingReviewAppeal
    const {
        challengeInfo,
        reviewers,
        myResources,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const downloadAccess: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = downloadAccess

    const {
        ownedMemberIds: ownedMemberIdsFromRole,
    }: UseRolePermissionsResult = useRolePermissions()
    const { width: screenWidth = 0 }: WindowSize = useWindowSize()

    const ownedMemberIds = useMemo<Set<string>>(() => {
        if (ownedMemberIdsFromRole.size) {
            return ownedMemberIdsFromRole
        }

        const fallbackSet = new Set<string>()
        for (const resource of myResources ?? []) {
            const memberId = resource?.memberId
            if (memberId) {
                fallbackSet.add(memberId)
            }
        }

        return fallbackSet
    }, [myResources, ownedMemberIdsFromRole])

    const challengeType: ChallengeInfo['type'] | undefined = challengeInfo?.type
    const challengeTrack: ChallengeInfo['track'] | undefined = challengeInfo?.track
    const ownedSubmissionIds = useMemo<Set<string>>(
        () => {
            const ids = new Set<string>()
            const submissions = [
                ...(challengeInfo?.submissions ?? []),
                ...datas,
            ]

            submissions.forEach(submission => {
                const memberId = `${submission.memberId ?? ''}`.trim()
                const submissionId = `${submission.id ?? ''}`.trim()
                if (
                    memberId.length
                    && submissionId.length
                    && ownedMemberIds.has(memberId)
                ) {
                    ids.add(submissionId)
                }
            })

            return ids
        },
        [challengeInfo?.submissions, datas, ownedMemberIds],
    )
    const ownedDatas = useMemo<SubmissionInfo[]>(
        () => filterSubmissionRowsByOwnership(
            datas,
            ownedMemberIds,
            ownedSubmissionIds,
        ),
        [datas, ownedMemberIds, ownedSubmissionIds],
    )

    const hasAppealsPhase = useMemo<boolean>(() => {
        const phases = challengeInfo?.phases ?? []
        return phases.some(phase => {
            const name = (phase?.name || '').toLowerCase()
            return name === 'appeals' || name === 'appeals response'
        })
    }, [challengeInfo?.phases])

    const allowsAppeals = useMemo<boolean>(
        () => hasAppealsPhase && !(
            includes(WITHOUT_APPEAL, challengeType?.name)
            || includes(WITHOUT_APPEAL, challengeTrack?.name)
        ),
        [challengeTrack?.name, challengeType?.name, hasAppealsPhase],
    )

    const isFirst2FinishChallenge = useMemo<boolean>(
        () => [challengeType?.name, challengeTrack?.name]
            .some(type => type === FIRST2FINISH),
        [challengeTrack?.name, challengeType?.name],
    )

    const isStandardChallenge = useMemo<boolean>(
        () => [challengeType?.name, challengeTrack?.name]
            .some(type => type === TRACK_CHALLENGE),
        [challengeTrack?.name, challengeType?.name],
    )

    const isAppealsWindowOpen = useMemo<boolean>(
        () => isAppealsPhase(challengeInfo)
            || isAppealsResponsePhase(challengeInfo),
        [challengeInfo],
    )

    const submissionTypes = useMemo<Set<string>>(
        () => new Set<string>(
            ownedDatas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [ownedDatas],
    )

    const filteredAll = useMemo<SubmissionInfo[]>(
        () => {
            const allSubmissions = filterSubmissionRowsByOwnership(
                challengeInfo?.submissions ?? [],
                ownedMemberIds,
                ownedSubmissionIds,
            )
            const typedFiltered = allSubmissions.filter(
                submission => submission.type && submissionTypes.has(submission.type),
            )
            const fallbackIds = new Set(
                ownedDatas
                    .map(submission => submission.id)
                    .filter((id): id is string => Boolean(id)),
            )
            const filtered = allSubmissions.filter(
                submission => submission.id && fallbackIds.has(submission.id),
            )

            return submissionTypes.size ? typedFiltered : filtered
        },
        [
            challengeInfo?.submissions,
            ownedDatas,
            ownedMemberIds,
            ownedSubmissionIds,
            submissionTypes,
        ],
    )

    const submissionHistory = useMemo<SubmissionHistoryPartition>(
        () => partitionSubmissionHistory(ownedDatas, filteredAll),
        [filteredAll, ownedDatas],
    )

    const restrictToLatest = useMemo<boolean>(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => {
            const sourceSubmissions = restrictToLatest
                ? submissionHistory.latestSubmissions
                : ownedDatas

            if (!filteredAll.length) {
                return sourceSubmissions
            }

            const metaById = new Map<string, SubmissionInfo>()
            filteredAll.forEach(submission => {
                if (submission.id) {
                    metaById.set(submission.id, submission)
                }
            })

            return sourceSubmissions.map(submission => {
                if (!submission.id) {
                    return submission
                }

                const meta = metaById.get(submission.id)
                if (!meta) {
                    return submission
                }

                return {
                    ...meta,
                    ...submission,
                    type: submission.type ?? meta.type,
                }
            })
        },
        [filteredAll, ownedDatas, restrictToLatest, submissionHistory],
    )

    const aggregatedRows = useMemo<AggregatedSubmissionReviews[]>(
        () => aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers,
            submissions: submissionsForAggregation,
        }),
        [mappingReviewAppeal, reviewers, submissionsForAggregation],
    )

    const submissionRows = useMemo<SubmissionRow[]>(
        () => aggregatedRows.map(row => ({
            ...row.submission,
            aggregated: row,
        })),
        [aggregatedRows],
    )

    const reviewerRows = useMemo<SubmissionReviewerRow[]>(
        () => buildSubmissionReviewerRows(submissionRows),
        [submissionRows],
    )

    const {
        canDisplayScores,
        isChallengeCompleted,
    }: UseScoreVisibilityResult = useScoreVisibility({
        allowsAppeals,
        challengeInfo,
        isAppealsWindowOpen,
        isFirst2FinishChallenge,
        isStandardChallenge,
    })

    const downloadConfigBase = useMemo<DownloadButtonConfig>(() => ({
        downloadSubmission,
        getRestrictionMessageForMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        ownedMemberIds,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission: true,
    }), [
        downloadSubmission,
        getRestrictionMessageForMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        ownedMemberIds,
        restrictionMessage,
    ])

    const isOwned = useCallback<(
        submission: SubmissionRow) => boolean
        >(
        (submission: SubmissionRow) => {
            const memberId = `${submission.memberId ?? ''}`.trim()
            if (memberId.length) {
                return ownedMemberIds.has(memberId)
            }

            return ownedSubmissionIds.has(`${submission.id ?? ''}`.trim())
        },
        [ownedMemberIds, ownedSubmissionIds],
        )

    const columns = useMemo<TableColumn<SubmissionReviewerRow>[]>(() => {
        const baseColumns: TableColumn<SubmissionReviewerRow>[] = []

        baseColumns.push({
            className: classNames(styles.submissionColumn, 'no-row-border'),
            columnId: 'submission-id',
            label: 'Submission ID',
            renderer: submission => (
                submission.isFirstReviewerRow
                    ? renderSubmissionIdCell(submission, downloadConfigBase)
                    : <span />
            ),
            type: 'element',
        })

        if (isChallengeCompleted) {
            baseColumns.push({
                className: 'no-row-border',
                columnId: 'submitter',
                label: 'Submitter',
                renderer: submission => (
                    submission.isFirstReviewerRow
                        ? renderSubmitterHandleCell(submission)
                        : <span />
                ),
                type: 'element',
            })
        }

        baseColumns.push({
            className: 'no-row-border',
            columnId: 'review-score',
            label: 'Review Score',
            renderer: submission => {
                if (!submission.isFirstReviewerRow) {
                    return <span />
                }

                const isOwnedSubmission = isOwned(submission)
                const scoreConfig: ScoreVisibilityConfig = {
                    canDisplayScores,
                    canViewScorecard: isOwnedSubmission,
                    isAppealsTab: true,
                }

                return renderReviewScoreCell(submission, scoreConfig)
            },
            type: 'element',
        })

        baseColumns.push({
            columnId: 'reviewer',
            label: 'Reviewer',
            renderer: submission => renderReviewerCell(submission, submission.reviewerIndex),
            type: 'element',
        })

        baseColumns.push({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: submission => renderReviewDateCell(submission),
            type: 'element',
        })

        baseColumns.push({
            columnId: 'score',
            label: 'Score',
            renderer: submission => {
                const isOwnedSubmission = isOwned(submission)
                const scoreConfig: ScoreVisibilityConfig = {
                    canDisplayScores,
                    canViewScorecard: isOwnedSubmission,
                    isAppealsTab: true,
                }

                return renderScoreCell(submission, submission.reviewerIndex, scoreConfig)
            },
            type: 'element',
        })

        if (allowsAppeals) {
            baseColumns.push({
                className: styles.tableCellNoWrap,
                columnId: 'appeals',
                label: 'Appeals',
                renderer: submission => {
                    const isOwnedSubmission = isOwned(submission)
                    const scoreConfig: ScoreVisibilityConfig = {
                        canDisplayScores,
                        canViewScorecard: isOwnedSubmission,
                        isAppealsTab: true,
                    }

                    return renderAppealsCell(submission, submission.reviewerIndex, scoreConfig)
                },
                type: 'element',
            })
        }

        if (props.aiReviewers) {
            baseColumns.push({
                columnId: 'ai-reviews-table',
                isExpand: true,
                label: '',
                renderer: (submission: SubmissionReviewerRow, allRows: SubmissionReviewerRow[]) => {
                    if (!submission.isLastReviewerRow || !props.aiReviewers) {
                        return <span />
                    }

                    const firstIndexForSubmission = allRows.findIndex(candidate => (
                        candidate.id === submission.id && candidate.isFirstReviewerRow
                    ))
                    const defaultOpen = firstIndexForSubmission === 0

                    return (
                        <CollapsibleAiReviewsRow
                            className={styles.aiReviews}
                            aiReviewers={props.aiReviewers}
                            submission={submission as any}
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
        canDisplayScores,
        downloadConfigBase,
        isChallengeCompleted,
        isOwned,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionReviewerRow>[][]>(
        () => columns.map(column => (
            [
                column.label && {
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
                    colSpan: column.label ? 1 : 2,
                    mobileType: 'last-value',
                },
            ].filter(Boolean) as MobileTableColumn<SubmissionReviewerRow>[]
        )),
        [columns],
    )

    const isTablet = useMemo<boolean>(() => screenWidth <= 1120, [screenWidth])

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
                    onToggleSort={noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

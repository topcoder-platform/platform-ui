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
    SubmissionRow,
} from '../common/types'
import {
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
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
        shouldRestrictSubmitterToOwnSubmission,
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
            datas
                .map(submission => submission.type)
                .filter((type): type is string => Boolean(type)),
        ),
        [datas],
    )

    const filteredAll = useMemo<SubmissionInfo[]>(
        () => {
            const allSubmissions = challengeInfo?.submissions ?? []
            const typedFiltered = allSubmissions.filter(
                submission => submission.type && submissionTypes.has(submission.type),
            )
            const fallbackIds = new Set(
                datas
                    .map(submission => submission.id)
                    .filter((id): id is string => Boolean(id)),
            )
            const filtered = allSubmissions.filter(
                submission => submission.id && fallbackIds.has(submission.id),
            )

            return submissionTypes.size ? typedFiltered : filtered
        },
        [challengeInfo?.submissions, datas, submissionTypes],
    )

    const submissionHistory = useMemo<SubmissionHistoryPartition>(
        () => partitionSubmissionHistory(datas, filteredAll),
        [datas, filteredAll],
    )

    const restrictToLatest = useMemo<boolean>(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => {
            const sourceSubmissions = restrictToLatest
                ? submissionHistory.latestSubmissions
                : datas

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
        [datas, filteredAll, restrictToLatest, submissionHistory],
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

    const maxReviewCount = useMemo<number>(
        () => aggregatedRows.reduce(
            (count, row) => Math.max(count, row.reviews.length),
            0,
        ),
        [aggregatedRows],
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
        shouldRestrictSubmitterToOwnSubmission,
    }), [
        downloadSubmission,
        getRestrictionMessageForMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        ownedMemberIds,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    ])

    const isOwned = useCallback<(
        submission: SubmissionRow) => boolean
        >(
        (submission: SubmissionRow) => (
            submission.memberId ? ownedMemberIds.has(submission.memberId) : false
        ),
        [ownedMemberIds],
        )

    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const baseColumns: TableColumn<SubmissionRow>[] = []

        baseColumns.push({
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            renderer: submission => renderSubmissionIdCell(submission, downloadConfigBase),
            type: 'element',
        })

        if (isChallengeCompleted) {
            baseColumns.push({
                columnId: 'submitter',
                label: 'Submitter',
                renderer: submission => renderSubmitterHandleCell(submission),
                type: 'element',
            })
        }

        baseColumns.push({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: submission => renderReviewDateCell(submission),
            type: 'element',
        })

        baseColumns.push({
            columnId: 'review-score',
            label: 'Review Score',
            renderer: submission => {
                const isOwnedSubmission = isOwned(submission)
                const scoreConfig: ScoreVisibilityConfig = {
                    canDisplayScores,
                    canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                    isAppealsTab: true,
                }

                return renderReviewScoreCell(submission, scoreConfig)
            },
            type: 'element',
        })

        for (let index = 0; index < maxReviewCount; index += 1) {
            baseColumns.push({
                columnId: `reviewer-${index}`,
                label: `Reviewer ${index + 1}`,
                renderer: submission => renderReviewerCell(submission, index),
                type: 'element',
            })

            baseColumns.push({
                columnId: `score-${index}`,
                label: `Score ${index + 1}`,
                renderer: submission => {
                    const isOwnedSubmission = isOwned(submission)
                    const scoreConfig: ScoreVisibilityConfig = {
                        canDisplayScores,
                        canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                        isAppealsTab: true,
                    }

                    return renderScoreCell(submission, index, scoreConfig)
                },
                type: 'element',
            })

            if (allowsAppeals) {
                baseColumns.push({
                    className: styles.tableCellNoWrap,
                    columnId: `appeals-${index}`,
                    label: `Appeals ${index + 1}`,
                    renderer: submission => {
                        const isOwnedSubmission = isOwned(submission)
                        const scoreConfig: ScoreVisibilityConfig = {
                            canDisplayScores,
                            canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                            isAppealsTab: true,
                        }

                        return renderAppealsCell(submission, index, scoreConfig)
                    },
                    type: 'element',
                })
            }
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
        canDisplayScores,
        downloadConfigBase,
        isChallengeCompleted,
        isOwned,
        maxReviewCount,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
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
            ].filter(Boolean) as MobileTableColumn<SubmissionRow>[]
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
                <TableMobile columns={columnsMobile} data={submissionRows} />
            ) : (
                <Table
                    columns={columns}
                    data={submissionRows}
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

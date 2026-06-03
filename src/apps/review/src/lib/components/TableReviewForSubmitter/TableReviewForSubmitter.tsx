import {
    FC,
    MouseEvent,
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
    ReviewAppContextModel,
    SubmissionInfo,
} from '../../models'
import { ChallengeDetailContext, ReviewAppContext } from '../../contexts'
import { TableWrapper } from '../TableWrapper'
import { SubmissionHistoryModal } from '../SubmissionHistoryModal'
import {
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
    getSubmissionHistoryKey,
    isAppealsPhase,
    isAppealsResponsePhase,
    isMarathonMatchChallenge,
} from '../../utils'
import type { AggregatedSubmissionReviews } from '../../utils'
import {
    useRolePermissions,
    useScorecardPassingScores,
    useScoreVisibility,
    useSubmissionDownloadAccess,
    useSubmissionHistory,
} from '../../hooks'
import type { UseRolePermissionsResult } from '../../hooks/useRolePermissions'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import type { UseSubmissionHistoryResult } from '../../hooks/useSubmissionHistory'
import type { UseScoreVisibilityResult } from '../../hooks/useScoreVisibility'
import {
    FIRST2FINISH,
    TRACK_CHALLENGE,
    WITHOUT_APPEAL,
} from '../../../config/index.config'
import { buildSubmissionReviewerRows, resolveSubmissionReviewResult } from '../common/reviewResult'
import { CollapsibleAiReviewsRow } from '../CollapsibleAiReviewsRow'

import styles from './TableReviewForSubmitter.module.scss'

export interface TableReviewForSubmitterProps {
    className?: string
    datas: SubmissionInfo[]
    aiReviewers?: { aiWorkflowId: string }[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
}

type HistoryRestriction = {
    message?: string
    restricted: boolean
}

export const TableReviewForSubmitter: FC<TableReviewForSubmitterProps> = (props: TableReviewForSubmitterProps) => {
    const className: string | undefined = props.className
    const datas: SubmissionInfo[] = props.datas
    const downloadSubmission: (submissionId: string) => void = props.downloadSubmission
    const isDownloading: IsRemovingType = props.isDownloading
    const mappingReviewAppeal: MappingReviewAppeal = props.mappingReviewAppeal
    const { loginUserInfo }: ReviewAppContextModel = useContext(ReviewAppContext)
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
        canViewAllSubmissions,
    }: UseRolePermissionsResult = useRolePermissions()
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
    const { width: screenWidth = 0 }: WindowSize = useWindowSize()

    const challengeType: ChallengeInfo['type'] | undefined = challengeInfo?.type
    const challengeTrack: ChallengeInfo['track'] | undefined = challengeInfo?.track

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

    const {
        closeHistoryModal,
        historyByMember,
        historyEntriesForModal,
        historyKey,
        latestSubmissionIds,
        latestSubmissions,
        openHistoryModal,
        shouldShowHistoryActions,
    }: UseSubmissionHistoryResult = useSubmissionHistory({
        datas,
        filteredAll,
        isSubmissionTab: true,
    })

    const restrictToLatest = useMemo<boolean>(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )
    const useAggregateReviewScore = useMemo<boolean>(
        () => isMarathonMatchChallenge(challengeInfo),
        [challengeInfo],
    )

    const submissionMetaById = useMemo<Map<string, SubmissionInfo>>(() => {
        const map = new Map<string, SubmissionInfo>()
        filteredAll.forEach(submission => {
            if (submission?.id) {
                map.set(submission.id, submission)
            }
        })
        datas.forEach(submission => {
            if (submission?.id) {
                map.set(submission.id, submission)
            }
        })
        return map
    }, [datas, filteredAll])

    const resolveSubmissionMeta = useCallback(
        (submissionId: string): SubmissionInfo | undefined => submissionMetaById.get(submissionId),
        [submissionMetaById],
    )

    const getHistoryRestriction = useCallback(
        (submission: SubmissionInfo): HistoryRestriction => {
            const restrictedForMember = isSubmissionDownloadRestrictedForMember(submission.memberId)
            const message = restrictedForMember
                ? getRestrictionMessageForMember(submission.memberId) ?? restrictionMessage
                : undefined

            return {
                message,
                restricted: restrictedForMember,
            }
        },
        [
            getRestrictionMessageForMember,
            isSubmissionDownloadRestrictedForMember,
            restrictionMessage,
        ],
    )

    const handleHistoryButtonClick = useCallback(
        (event: MouseEvent<HTMLButtonElement>): void => {
            const submissionId = event.currentTarget.dataset.submissionId
            if (!submissionId) {
                return
            }

            const memberIdValue = event.currentTarget.dataset.memberId
            const normalizedMemberId = memberIdValue && memberIdValue.length ? memberIdValue : undefined
            openHistoryModal(normalizedMemberId, submissionId)
        },
        [openHistoryModal],
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

    const submissionsForAggregation = useMemo<SubmissionInfo[]>(
        () => (restrictToLatest ? latestSubmissions : datas),
        [datas, latestSubmissions, restrictToLatest],
    )

    const aggregatedRows = useMemo<AggregatedSubmissionReviews[]>(
        () => aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers: reviewers ?? [],
            submissions: submissionsForAggregation,
        }),
        [mappingReviewAppeal, reviewers, submissionsForAggregation],
    )

    const isSubmissionNotViewable = (submission: SubmissionRow): boolean => (
        !canViewSubmissions && String(submission.memberId) !== String(loginUserInfo?.userId)
    )

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
        () => aggregatedRows.map(row => ({
            ...row.submission,
            aggregated: row,
        })),
        [aggregatedRows],
    )

    const reviewerRows = useMemo<SubmissionReviewerRow[]>(
        () => buildSubmissionReviewerRows(aggregatedSubmissionRows),
        [aggregatedSubmissionRows],
    )

    const scorecardIds = useMemo<Set<string>>(() => {
        const ids = new Set<string>()

        aggregatedRows.forEach(row => {
            const primary = row.submission?.review?.scorecardId?.trim()
            if (primary) {
                ids.add(primary)
            }

            row.reviews.forEach(review => {
                const derived = review.reviewInfo?.scorecardId?.trim()
                if (derived) {
                    ids.add(derived)
                }
            })
        })

        return ids
    }, [aggregatedRows])

    const minimumPassingScoreByScorecardId = useScorecardPassingScores(scorecardIds)

    const isOwned = useCallback<(
        submission: SubmissionInfo | SubmissionRow) => boolean
        >(
        (submission: SubmissionInfo | SubmissionRow) => {
            const memberId = submission?.memberId
            return Boolean(memberId && ownedMemberIds.has(memberId))
        },
        [ownedMemberIds],
        )

    const downloadConfigBase = useMemo<DownloadButtonConfig>(() => ({
        downloadSubmission,
        getRestrictionMessageForMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        isSubmissionNotViewable,
        ownedMemberIds,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    }), [
        downloadSubmission,
        getRestrictionMessageForMember,
        isDownloading,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        isSubmissionNotViewable,
        ownedMemberIds,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
        canViewSubmissions,
    ])

    const columns = useMemo<TableColumn<SubmissionReviewerRow>[]>(() => {
        const columnsList: TableColumn<SubmissionReviewerRow>[] = []

        columnsList.push({
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
            columnsList.push({
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

        columnsList.push({
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
                    canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                    isAppealsTab: false,
                    useAggregateScore: useAggregateReviewScore,
                }

                return renderReviewScoreCell(submission, scoreConfig)
            },
            type: 'element',
        })

        columnsList.push({
            className: 'no-row-border',
            columnId: 'review-result',
            label: 'Review Result',
            renderer: submission => {
                if (!submission.isFirstReviewerRow) {
                    return <span />
                }

                const result = resolveSubmissionReviewResult(submission, {
                    minimumPassingScoreByScorecardId,
                    preferAggregateScore: useAggregateReviewScore,
                })
                if (result === 'PASS') {
                    return (
                        <span className={styles.resultPass}>
                            Pass
                        </span>
                    )
                }

                if (result === 'FAIL') {
                    return (
                        <span className={styles.resultFail}>
                            Fail
                        </span>
                    )
                }

                return <span>--</span>
            },
            type: 'element',
        })

        columnsList.push({
            columnId: 'reviewer',
            label: 'Reviewer',
            renderer: submission => renderReviewerCell(submission, submission.reviewerIndex),
            type: 'element',
        })

        columnsList.push({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: submission => renderReviewDateCell(submission),
            type: 'element',
        })

        columnsList.push({
            columnId: 'score',
            label: 'Score',
            renderer: submission => {
                const isOwnedSubmission = isOwned(submission)
                const scoreConfig: ScoreVisibilityConfig = {
                    canDisplayScores,
                    canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                    isAppealsTab: false,
                    useAggregateScore: useAggregateReviewScore,
                }

                return renderScoreCell(submission, submission.reviewerIndex, scoreConfig)
            },
            type: 'element',
        })

        const showActionsColumn = shouldShowHistoryActions && !shouldRestrictSubmitterToOwnSubmission

        if (showActionsColumn) {
            columnsList.push({
                columnId: 'actions',
                label: 'Actions',
                renderer: submission => {
                    if (!submission.isFirstReviewerRow || !submission.id) {
                        return <span />
                    }

                    const isOwnedSubmission = isOwned(submission)

                    if (!isOwnedSubmission) {
                        return <span>--</span>
                    }

                    const historyKeyForSubmission = getSubmissionHistoryKey(
                        submission.memberId,
                        submission.id,
                    )
                    const historyEntries = historyByMember.get(historyKeyForSubmission) ?? []
                    const filteredHistory = restrictToLatest
                        ? historyEntries.filter(entry => entry.id && !latestSubmissionIds.has(entry.id))
                        : historyEntries

                    if (!filteredHistory.length) {
                        return <span>--</span>
                    }

                    return (
                        <span className={styles.actionsCell}>
                            <button
                                type='button'
                                className={classNames(styles.historyButton, styles.actionItem)}
                                data-submission-id={submission.id}
                                data-member-id={submission.memberId ?? ''}
                                onClick={handleHistoryButtonClick}
                            >
                                View Submission History
                            </button>
                        </span>
                    )
                },
                type: 'element',
            })
        }

        if (props.aiReviewers) {
            columnsList.push({
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

        return columnsList
    }, [
        canDisplayScores,
        downloadConfigBase,
        handleHistoryButtonClick,
        historyByMember,
        isChallengeCompleted,
        latestSubmissionIds,
        minimumPassingScoreByScorecardId,
        isOwned,
        restrictToLatest,
        shouldShowHistoryActions,
        shouldRestrictSubmitterToOwnSubmission,
        useAggregateReviewScore,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionReviewerRow>[][]>(
        () => columns.map(column => {
            const resolvedLabel = typeof column.label === 'function'
                ? column.label() ?? ''
                : (column.label ?? '')
            const labelForAction = typeof column.label === 'string'
                ? column.label
                : resolvedLabel

            if (labelForAction === 'Action' || labelForAction === 'Actions') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            const labelText = resolvedLabel || ''

            return [
                (labelText && (
                    {
                        ...column,
                        className: '',
                        label: labelText ? `${labelText} label` : 'label',
                        mobileType: 'label',
                        renderer: () => (
                            <div>
                                {labelText}
                                :
                            </div>
                        ),
                        type: 'element',
                    }
                )),
                {
                    ...column,
                    colSpan: labelText ? 1 : 2,
                    mobileType: 'last-value',
                },
            ].filter(Boolean) as MobileTableColumn<SubmissionReviewerRow>[]
        }),
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
            <SubmissionHistoryModal
                open={Boolean(historyKey)}
                onClose={closeHistoryModal}
                submissions={historyEntriesForModal}
                downloadSubmission={downloadSubmission}
                isDownloading={isDownloading}
                getRestriction={getHistoryRestriction}
                getSubmissionMeta={resolveSubmissionMeta}
                aiReviewers={props.aiReviewers}
            />
        </TableWrapper>
    )
}

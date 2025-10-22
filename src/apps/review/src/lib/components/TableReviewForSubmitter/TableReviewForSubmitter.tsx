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
    SubmissionInfo,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
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
    SubmissionRow,
} from '../common/types'
import {
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    getSubmissionHistoryKey,
    isAppealsPhase,
    isAppealsResponsePhase,
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
import { resolveSubmissionReviewResult } from '../common/reviewResult'

import styles from './TableReviewForSubmitter.module.scss'

export interface TableReviewForSubmitterProps {
    className?: string
    datas: SubmissionInfo[]
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

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
        () => aggregatedRows.map(row => ({
            ...row.submission,
            aggregated: row,
        })),
        [aggregatedRows],
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

    const maxReviewCount = useMemo<number>(
        () => aggregatedRows.reduce(
            (max, row) => Math.max(max, row.reviews.length),
            0,
        ),
        [aggregatedRows],
    )

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

    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const columnsList: TableColumn<SubmissionRow>[] = []

        columnsList.push({
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            renderer: submission => renderSubmissionIdCell(submission, downloadConfigBase),
            type: 'element',
        })

        if (isChallengeCompleted) {
            columnsList.push({
                columnId: 'submitter',
                label: 'Submitter',
                renderer: submission => renderSubmitterHandleCell(submission),
                type: 'element',
            })
        }

        columnsList.push({
            columnId: 'review-date',
            label: 'Review Date',
            renderer: submission => renderReviewDateCell(submission),
            type: 'element',
        })

        columnsList.push({
            columnId: 'review-score',
            label: 'Review Score',
            renderer: submission => {
                const isOwnedSubmission = isOwned(submission)
                const scoreConfig: ScoreVisibilityConfig = {
                    canDisplayScores,
                    canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                    isAppealsTab: false,
                }

                return renderReviewScoreCell(submission, scoreConfig)
            },
            type: 'element',
        })

        columnsList.push({
            columnId: 'review-result',
            label: 'Review Result',
            renderer: submission => {
                const result = resolveSubmissionReviewResult(submission, {
                    minimumPassingScoreByScorecardId,
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

        for (let index = 0; index < maxReviewCount; index += 1) {
            columnsList.push({
                columnId: `reviewer-${index}`,
                label: `Reviewer ${index + 1}`,
                renderer: submission => renderReviewerCell(submission, index),
                type: 'element',
            })

            columnsList.push({
                columnId: `score-${index}`,
                label: `Score ${index + 1}`,
                renderer: submission => {
                    const isOwnedSubmission = isOwned(submission)
                    const scoreConfig: ScoreVisibilityConfig = {
                        canDisplayScores,
                        canViewScorecard: isChallengeCompleted || isOwnedSubmission,
                        isAppealsTab: false,
                    }

                    return renderScoreCell(submission, index, scoreConfig)
                },
                type: 'element',
            })
        }

        if (shouldShowHistoryActions) {
            columnsList.push({
                columnId: 'actions',
                label: 'Actions',
                renderer: submission => {
                    if (!submission.id) {
                        return <span>--</span>
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

        return columnsList
    }, [
        canDisplayScores,
        downloadConfigBase,
        handleHistoryButtonClick,
        historyByMember,
        isChallengeCompleted,
        latestSubmissionIds,
        maxReviewCount,
        minimumPassingScoreByScorecardId,
        isOwned,
        restrictToLatest,
        shouldShowHistoryActions,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(column => (
            [
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
                <TableMobile columns={columnsMobile} data={aggregatedSubmissionRows} />
            ) : (
                <Table
                    columns={columns}
                    data={aggregatedSubmissionRows}
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
            />
        </TableWrapper>
    )
}

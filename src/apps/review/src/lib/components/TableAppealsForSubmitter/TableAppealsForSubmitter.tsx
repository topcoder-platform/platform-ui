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
import { useWindowSize } from '~/libs/shared'
import { Table, TableColumn } from '~/libs/ui'

import {
    ChallengeDetailContextModel,
    MappingReviewAppeal,
    SubmissionInfo,
} from '../../models'
import { ChallengeDetailContext } from '../../contexts'
import { TableWrapper } from '../TableWrapper'
import {
    renderAppealsCell,
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
import {
    aggregateSubmissionReviews,
    challengeHasSubmissionLimit,
    isAppealsPhase,
    isAppealsResponsePhase,
    partitionSubmissionHistory,
} from '../../utils'
import {
    useRolePermissions,
    useScoreVisibility,
    useSubmissionDownloadAccess,
} from '../../hooks'
import {
    FIRST2FINISH,
    TRACK_CHALLENGE,
    WITHOUT_APPEAL,
} from '../../../config/index.config'

import styles from './TableAppealsForSubmitter.module.scss'

export interface TableAppealsForSubmitterProps {
    className?: string
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal
}

export const TableAppealsForSubmitter: FC<TableAppealsForSubmitterProps> = ({
    className,
    datas,
    downloadSubmission,
    isDownloading,
    mappingReviewAppeal,
}) => {
    const {
        challengeInfo,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)

    const {
        getRestrictionMessageForMember,
        isSubmissionDownloadRestricted,
        isSubmissionDownloadRestrictedForMember,
        restrictionMessage,
        shouldRestrictSubmitterToOwnSubmission,
    } = useSubmissionDownloadAccess()

    const { ownedMemberIds } = useRolePermissions()
    const { width: screenWidth = 0 } = useWindowSize()

    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track

    const hasAppealsPhase = useMemo(() => {
        const phases = challengeInfo?.phases ?? []
        return phases.some(phase => {
            const name = (phase?.name || '').toLowerCase()
            return name === 'appeals' || name === 'appeals response'
        })
    }, [challengeInfo?.phases])

    const allowsAppeals = useMemo(
        () => hasAppealsPhase && !(
            includes(WITHOUT_APPEAL, challengeType?.name)
            || includes(WITHOUT_APPEAL, challengeTrack?.name)
        ),
        [challengeTrack?.name, challengeType?.name, hasAppealsPhase],
    )

    const isFirst2FinishChallenge = useMemo(
        () => [challengeType?.name, challengeTrack?.name]
            .some(type => type === FIRST2FINISH),
        [challengeTrack?.name, challengeType?.name],
    )

    const isStandardChallenge = useMemo(
        () => [challengeType?.name, challengeTrack?.name]
            .some(type => type === TRACK_CHALLENGE),
        [challengeTrack?.name, challengeType?.name],
    )

    const isAppealsWindowOpen = useMemo(
        () => isAppealsPhase(challengeInfo)
            || isAppealsResponsePhase(challengeInfo),
        [challengeInfo],
    )

    const submissionTypes = useMemo(
        () => new Set(
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

    const submissionHistory = useMemo(
        () => partitionSubmissionHistory(datas, filteredAll),
        [datas, filteredAll],
    )

    const restrictToLatest = useMemo(
        () => challengeHasSubmissionLimit(challengeInfo),
        [challengeInfo],
    )

    const submissionsForAggregation = useMemo(
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

    const aggregatedRows = useMemo(
        () => aggregateSubmissionReviews({
            submissions: submissionsForAggregation,
            mappingReviewAppeal,
            reviewers,
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

    const maxReviewCount = useMemo(
        () => aggregatedRows.reduce(
            (count, row) => Math.max(count, row.reviews.length),
            0,
        ),
        [aggregatedRows],
    )

    const {
        canDisplayScores,
        isChallengeCompleted,
    } = useScoreVisibility({
        challengeInfo,
        allowsAppeals,
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

    const isOwned = useCallback(
        (submission: SubmissionRow): boolean => (
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
        () => columns.map(column => [
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
        ] as MobileTableColumn<SubmissionRow>[]),
        [columns],
    )

    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])

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
                    disableSorting
                    onToggleSort={noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

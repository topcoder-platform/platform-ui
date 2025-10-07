/**
 * Table Winners.
 */
import {
    FC,
    MouseEvent,
    useCallback,
    useContext,
    useMemo,
} from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { includes, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, MappingReviewAppeal, SubmissionInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'
import {
    AggregatedReviewDetail,
    AggregatedSubmissionReviews,
    aggregateSubmissionReviews,
    isAppealsPhase,
    isAppealsResponsePhase,
} from '../../utils'
import {
    FIRST2FINISH,
    NO_RESOURCE_ID,
    TRACK_CHALLENGE,
    WITHOUT_APPEAL,
} from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableReviewAppealsForSubmitter.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
}

type SubmissionRow = SubmissionInfo & {
    aggregated?: AggregatedSubmissionReviews
}

export const TableReviewAppealsForSubmitter: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const {
        challengeInfo,
        reviewers,
    }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1120, [screenWidth])

    const datas = props.datas
    const downloadSubmission = props.downloadSubmission
    const isDownloading = props.isDownloading
    const mappingReviewAppeal = props.mappingReviewAppeal
    const wrapperClassName = props.className
    const challengeStatus = challengeInfo?.status?.toUpperCase()
    const isChallengeCompleted = challengeStatus === 'COMPLETED'

    // Show Appeals columns only if the challenge includes an Appeals phase
    const hasAppealsPhase = useMemo(() => {
        const phases = challengeInfo?.phases ?? []
        return phases.some(p => {
            const name = (p?.name || '').toLowerCase()
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

    const shouldShowAppealsColumn = useMemo(
        () => allowsAppeals && (isAppealsWindowOpen || isChallengeCompleted),
        [allowsAppeals, isAppealsWindowOpen, isChallengeCompleted],
    )

    const aggregatedRows = useMemo(() => aggregateSubmissionReviews({
        mappingReviewAppeal,
        reviewers,
        submissions: datas,
    }), [datas, mappingReviewAppeal, reviewers])

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
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

    const canDisplayScores = useCallback(
        (submission: SubmissionRow): boolean => {
            if (isChallengeCompleted) {
                return true
            }

            if (isFirst2FinishChallenge) {
                const reviews = submission.aggregated?.reviews ?? []
                if (!reviews.length) {
                    return false
                }

                const allReviewsCompleted = reviews.every(review => {
                    const status = (review.reviewInfo?.status ?? '').toUpperCase()
                    const committed = review.reviewInfo?.committed ?? false

                    return committed
                        || includes(['COMPLETED', 'SUBMITTED'], status)
                })

                return allReviewsCompleted
            }

            if (isStandardChallenge) {
                return isAppealsWindowOpen
            }

            return true
        },
        [
            isAppealsWindowOpen,
            isChallengeCompleted,
            isFirst2FinishChallenge,
            isStandardChallenge,
        ],
    )

    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const submissionColumn: TableColumn<SubmissionRow> = {
            className: styles.submissionColumn,
            columnId: 'submission-id',
            label: 'Submission ID',
            propertyName: 'id',
            renderer: (data: SubmissionRow) => {
                const isButtonDisabled = Boolean(
                    isDownloading[data.id]
                    || isSubmissionDownloadRestricted,
                )

                const downloadButton = (
                    <button
                        onClick={function onClick() {
                            if (isSubmissionDownloadRestricted) {
                                return
                            }

                            downloadSubmission(data.id)
                        }}
                        className={styles.textBlue}
                        disabled={isButtonDisabled}
                        type='button'
                    >
                        {data.id}
                    </button>
                )

                async function handleCopySubmissionId(
                    event: MouseEvent<HTMLButtonElement>,
                ): Promise<void> {
                    event.stopPropagation()
                    event.preventDefault()

                    if (!data.id) {
                        return
                    }

                    await copyTextToClipboard(data.id)
                    toast.success('Submission ID copied to clipboard', {
                        toastId: `challenge-submission-id-copy-${data.id}`,
                    })
                }

                const renderedDownloadButton = isSubmissionDownloadRestricted ? (
                    <Tooltip content={restrictionMessage} triggerOn='click-hover'>
                        <span className={styles.tooltipTrigger}>
                            {downloadButton}
                        </span>
                    </Tooltip>
                ) : (
                    downloadButton
                )

                return (
                    <span className={styles.submissionCell}>
                        {renderedDownloadButton}
                        <button
                            type='button'
                            className={styles.copyButton}
                            aria-label='Copy submission ID'
                            title='Copy submission ID'
                            onClick={handleCopySubmissionId}
                            disabled={!data.id}
                        >
                            <IconOutline.DocumentDuplicateIcon />
                        </button>
                    </span>
                )
            },
            type: 'element',
        }

        const submitterColumn: TableColumn<SubmissionRow> = {
            columnId: 'submitter-handle',
            label: 'Submitter',
            renderer: (data: SubmissionRow) => {
                const submitterHandle = data.aggregated?.submitterHandle
                if (!submitterHandle) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                const submitterHandleColor = data.aggregated?.submitterHandleColor
                    ?? '#2a2a2a'
                const profileUrl = `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(submitterHandle)}`

                return (
                    <a
                        href={profileUrl}
                        style={{ color: submitterHandleColor }}
                        target='_blank'
                        rel='noreferrer'
                    >
                        {submitterHandle}
                    </a>
                )
            },
            type: 'element',
        }

        const reviewDateColumn: TableColumn<SubmissionRow> = {
            columnId: 'review-date',
            label: 'Review Date',
            renderer: (data: SubmissionRow) => {
                const reviewDateDisplay = data.aggregated?.latestReviewDateString
                if (!reviewDateDisplay) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                return <span>{reviewDateDisplay}</span>
            },
            type: 'element',
        }

        const reviewScoreColumn: TableColumn<SubmissionRow> = {
            columnId: 'review-score',
            label: 'Review Score',
            renderer: (data: SubmissionRow) => {
                if (!canDisplayScores(data)) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                const scoreDisplay = data.aggregated?.averageFinalScoreDisplay
                if (!scoreDisplay) {
                    return (
                        <span className={styles.notReviewed}>
                            --
                        </span>
                    )
                }

                return <span>{scoreDisplay}</span>
            },
            type: 'element',
        }

        const renderReviewerCell = (
            data: SubmissionRow,
            reviewIndex: number,
        ): JSX.Element => {
            const reviewDetail: AggregatedReviewDetail | undefined
                = data.aggregated?.reviews[reviewIndex]

            if (!reviewDetail) {
                return <span>--</span>
            }

            const reviewerName = reviewDetail.reviewerHandle
                ? reviewDetail.reviewerHandle
                : 'Not assigned'
            const reviewerColor = reviewDetail.reviewerHandleColor ?? '#2a2a2a'
            const reviewerHandle = reviewDetail.reviewerHandle?.trim()
            const reviewerProfileUrl = reviewerHandle
                ? `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(reviewerHandle)}`
                : undefined

            return (
                <span className={styles.reviewer}>
                    {reviewerProfileUrl ? (
                        <a
                            href={reviewerProfileUrl}
                            style={{ color: reviewerColor }}
                            target='_blank'
                            rel='noreferrer'
                        >
                            {reviewerHandle}
                        </a>
                    ) : (
                        <span style={{ color: reviewerColor }}>
                            {reviewerName}
                        </span>
                    )}
                </span>
            )
        }

        const renderScoreCell = (
            data: SubmissionRow,
            reviewIndex: number,
        ): JSX.Element => {
            const reviewDetail: AggregatedReviewDetail | undefined
                = data.aggregated?.reviews[reviewIndex]

            const reviewInfo = reviewDetail?.reviewInfo
            const resourceId = reviewDetail?.resourceId || NO_RESOURCE_ID

            if (!reviewInfo || !reviewInfo.id) {
                return (
                    <span className={styles.notReviewed}>
                        --
                    </span>
                )
            }

            if (!canDisplayScores(data)) {
                return (
                    <span className={styles.notReviewed}>
                        --
                    </span>
                )
            }

            const finalScore = reviewDetail?.finalScore
            const formattedScore = typeof finalScore === 'number' && Number.isFinite(finalScore)
                ? finalScore.toFixed(2)
                : undefined
            return (
                <Link
                    to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                    className={styles.textBlue}
                >
                    {formattedScore ?? '--'}
                </Link>
            )
        }

        const renderAppealsCell = (
            data: SubmissionRow,
            reviewIndex: number,
        ): JSX.Element => {
            const reviewDetail: AggregatedReviewDetail | undefined
                = data.aggregated?.reviews[reviewIndex]

            const reviewInfo = reviewDetail?.reviewInfo
            const resourceId = reviewDetail?.resourceId || NO_RESOURCE_ID

            if (!reviewInfo || !reviewInfo.id) {
                return (
                    <span className={styles.notReviewed}>
                        --
                    </span>
                )
            }

            const totalAppeals = reviewDetail?.totalAppeals ?? 0
            const unresolvedAppeals = reviewDetail?.unresolvedAppeals ?? 0

            if (!totalAppeals && (reviewInfo.status ?? '').toUpperCase() !== 'COMPLETED') {
                return (
                    <span className={styles.notReviewed}>
                        --
                    </span>
                )
            }

            return (
                <Link
                    className={classNames(
                        styles.appealsLink,
                        'last-element',
                    )}
                    to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                >
                    [
                    {' '}
                    <span className={styles.textBlue}>{unresolvedAppeals}</span>
                    {' '}
                    /
                    {' '}
                    <span className={styles.textBlue}>{totalAppeals}</span>
                    {' '}
                    ]
                </Link>
            )
        }

        const aggregatedColumns: TableColumn<SubmissionRow>[] = [
            submissionColumn,
        ]

        if (isChallengeCompleted) {
            aggregatedColumns.push(submitterColumn)
        }

        aggregatedColumns.push(
            reviewDateColumn,
            reviewScoreColumn,
        )

        for (let index = 0; index < maxReviewCount; index += 1) {
            aggregatedColumns.push({
                columnId: `reviewer-${index}`,
                label: `Reviewer ${index + 1}`,
                renderer: (data: SubmissionRow) => renderReviewerCell(data, index),
                type: 'element',
            })

            aggregatedColumns.push({
                columnId: `score-${index}`,
                label: `Score ${index + 1}`,
                renderer: (data: SubmissionRow) => renderScoreCell(data, index),
                type: 'element',
            })

            if (shouldShowAppealsColumn) {
                aggregatedColumns.push({
                    className: styles.tableCellNoWrap,
                    columnId: `appeals-${index}`,
                    label: `Appeals ${index + 1}`,
                    renderer: (data: SubmissionRow) => renderAppealsCell(data, index),
                    type: 'element',
                })
            }
        }

        return aggregatedColumns
    }, [
        allowsAppeals,
        canDisplayScores,
        downloadSubmission,
        isSubmissionDownloadRestricted,
        isDownloading,
        isChallengeCompleted,
        maxReviewCount,
        shouldShowAppealsColumn,
        restrictionMessage,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(
            column => [{
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
            ] as MobileTableColumn<SubmissionRow>[],
        ),
        [columns],
    )

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                wrapperClassName,
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
        </TableWrapper>
    )
}

export default TableReviewAppealsForSubmitter

/**
 * Table Winners.
 */
import { FC, MouseEvent, useContext, useMemo } from 'react'
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
} from '../../utils'
import { NO_RESOURCE_ID, WITHOUT_APPEAL } from '../../../config/index.config'
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

    const allowsAppeals = useMemo(
        () => !(
            includes(WITHOUT_APPEAL, challengeType)
            || includes(WITHOUT_APPEAL, challengeTrack)
        ),
        [challengeTrack, challengeType],
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
            reviewDateColumn,
            reviewScoreColumn,
        ]

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

            if (allowsAppeals) {
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
        downloadSubmission,
        isSubmissionDownloadRestricted,
        isDownloading,
        maxReviewCount,
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

/**
 * Table Review Appeals.
 */
import { FC, MouseEvent, useContext, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _, { includes } from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { EnvironmentConfig } from '~/config'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import { APPROVAL, NO_RESOURCE_ID, REVIEWER, WITHOUT_APPEAL } from '../../../config/index.config'
import { ChallengeDetailContext } from '../../contexts'
import { useRole, useRoleProps, useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'
import { ChallengeDetailContextModel, MappingReviewAppeal, SubmissionInfo } from '../../models'
import {
    AggregatedReviewDetail,
    AggregatedSubmissionReviews,
    aggregateSubmissionReviews,
    getHandleUrl,
    isReviewPhase,
} from '../../utils'
import { ProgressBar } from '../ProgressBar'
import { TableWrapper } from '../TableWrapper'

import styles from './TableReviewAppeals.module.scss'

interface Props {
    className?: string
    datas: SubmissionInfo[]
    tab: string
    firstSubmissions?: SubmissionInfo
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mappingReviewAppeal: MappingReviewAppeal // from review id to appeal info
    hideHandleColumn?: boolean
}

type SubmissionRow = SubmissionInfo & {
    aggregated?: AggregatedSubmissionReviews
}

export const TableReviewAppeals: FC<Props> = (props: Props) => {
    // get challenge info from challenge detail context
    const {
        challengeInfo,
        reviewers,
    }: ChallengeDetailContextModel = useContext(ChallengeDetailContext)
    const { width: screenWidth }: WindowSize = useWindowSize()
    const { actionChallengeRole }: useRoleProps = useRole()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])
    const challengeType = challengeInfo?.type
    const challengeTrack = challengeInfo?.track
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const datas = props.datas
    const downloadSubmission = props.downloadSubmission
    const firstSubmissions = props.firstSubmissions
    const hideHandleColumn = props.hideHandleColumn
    const isDownloading = props.isDownloading
    const mappingReviewAppeal = props.mappingReviewAppeal
    const tab = props.tab
    const wrapperClassName = props.className

    const isReviewAppealsTab = tab === 'Review / Appeals'
    const aggregatedRows = useMemo(() => {
        if (!isReviewAppealsTab) {
            return [] as AggregatedSubmissionReviews[]
        }

        return aggregateSubmissionReviews({
            mappingReviewAppeal,
            reviewers,
            submissions: datas,
        })
    }, [datas, isReviewAppealsTab, mappingReviewAppeal, reviewers])

    const aggregatedSubmissionRows = useMemo<SubmissionRow[]>(
        () => aggregatedRows.map(row => ({
            ...row.submission,
            aggregated: row,
        })),
        [aggregatedRows],
    )

    const maxReviewCount = useMemo(
        () => (isReviewAppealsTab
            ? aggregatedRows.reduce(
                (count, row) => Math.max(count, row.reviews.length),
                0,
            )
            : 0),
        [aggregatedRows, isReviewAppealsTab],
    )

    const allowsAppeals = useMemo(
        () => !(
            includes(WITHOUT_APPEAL, challengeType)
            || includes(WITHOUT_APPEAL, challengeTrack)
        ),
        [challengeTrack, challengeType],
    )

    const columns = useMemo<TableColumn<SubmissionRow>[]>(() => {
        const submissionColumn: TableColumn<SubmissionRow> = {
            className: classNames(styles.textBlue, styles.submissionColumn),
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

        if (isReviewAppealsTab) {
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
                const reviewerColor = reviewDetail.reviewerHandleColor
                    ?? '#2a2a2a'
                const reviewerHandle = reviewDetail.reviewerHandle?.trim()
                const reviewerProfileUrl = reviewerHandle
                    ? `${EnvironmentConfig.REVIEW.PROFILE_PAGE_URL}/${encodeURIComponent(reviewerHandle)}`
                    : undefined

                return (
                    <span className={styles.reviewerCell}>
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
                const reviewStatus = (reviewInfo?.status ?? '').toUpperCase()

                if (!reviewInfo || !reviewInfo.id) {
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.textBlue}
                        >
                            Start Review
                        </Link>
                    )
                }

                const finalScore = reviewDetail?.finalScore
                if (typeof finalScore === 'number' && Number.isFinite(finalScore)) {
                    const formattedScore = finalScore.toFixed(2)
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.textBlue}
                        >
                            {formattedScore}
                        </Link>
                    )
                }

                if (reviewInfo.reviewProgress) {
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.progressLink}
                        >
                            <ProgressBar
                                progress={reviewInfo.reviewProgress}
                            />
                        </Link>
                    )
                }

                if (includes(['PENDING', 'IN_PROGRESS'], reviewStatus)) {
                    return (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.textBlue}
                        >
                            Continue Review
                        </Link>
                    )
                }

                return (
                    <Link
                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                        className={styles.textBlue}
                    >
                        Open Review
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
                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                        className={styles.appealsLink}
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
                        columnId: `appeals-${index}`,
                        label: `Appeals ${index + 1}`,
                        renderer: (data: SubmissionRow) => renderAppealsCell(data, index),
                        type: 'element',
                    })
                }
            }

            return aggregatedColumns
        }

        const handleColumn: TableColumn<SubmissionRow> | undefined = hideHandleColumn
            ? undefined
            : {
                columnId: 'handle',
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: SubmissionRow) => (
                    <a
                        href={getHandleUrl(data.userInfo)}
                        target='_blank'
                        rel='noreferrer'
                        style={{
                            color: data.userInfo?.handleColor,
                        }}
                        onClick={function onClick() {
                            window.open(
                                getHandleUrl(data.userInfo),
                                '_blank',
                            )
                        }}
                    >
                        {data.userInfo?.memberHandle ?? ''}
                    </a>
                ),
                type: 'element',
            }

        const reviewDateColumn: TableColumn<SubmissionRow> = {
            columnId: 'review-date-default',
            label: 'Review Date',
            renderer: (data: SubmissionRow) => {
                if (!data.review || !data.review.id) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                if (data.review) {
                    return (
                        <span>
                            {data.review.updatedAtString
                                || data.review.createdAtString}
                        </span>
                    )
                }

                return <></>
            },
            type: 'element',
        }

        const scoreColumn: TableColumn<SubmissionRow> = {
            columnId: 'score-default',
            label: 'Score',
            renderer: (data: SubmissionRow) => {
                if (!data.review || !data.review.id) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                if (!data.review.initialScore) {
                    if (!data.review.reviewProgress) {
                        return (
                            <span className={styles.notReviewed}>
                                Not Reviewed
                            </span>
                        )
                    }

                    return (
                        <ProgressBar
                            progress={data.review.reviewProgress}
                        />
                    )
                }

                const resourceId = data.review?.resourceId || NO_RESOURCE_ID

                return (
                    <Link
                        to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                        className={styles.textBlue}
                    >
                        {data.review.initialScore}
                    </Link>
                )
            },
            type: 'element',
        }

        const initalColumns: TableColumn<SubmissionRow>[] = [
            submissionColumn,
            ...(handleColumn ? [handleColumn] : []),
            reviewDateColumn,
            scoreColumn,
        ]

        const actionColumns = actionChallengeRole === REVIEWER && isReviewPhase(challengeInfo) ? [
            {
                className: styles.textBlue,
                columnId: 'action',
                label: 'Action',
                renderer: (data: SubmissionRow) => {
                    const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                    const reviewStatus = (data.review?.status ?? '').toUpperCase()
                    const hasReview = !!data.review?.id
                    const actionLink = (
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={classNames(
                                styles.submit,
                                'last-element',
                            )}
                        >
                            <i className='icon-upload' />
                            Submit Review
                        </Link>
                    )

                    if (includes(['COMPLETED', 'SUBMITTED'], reviewStatus)) {
                        return (
                            <div
                                aria-label='Review completed'
                                className={classNames(
                                    styles.completedAction,
                                    'last-element',
                                )}
                                title='Review completed'
                            >
                                <span className={styles.completedIcon} aria-hidden='true'>
                                    &check;
                                </span>
                            </div>
                        )
                    }

                    if (
                        includes(['PENDING', 'IN_PROGRESS'], reviewStatus)
                    ) {
                        return actionLink
                    }

                    if (!reviewStatus && hasReview) {
                        return (
                            <Link
                                to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                                className={classNames(
                                    styles.submit,
                                    'last-element',
                                )}
                            >
                                <i className='icon-reopen' />
                                Reopen Review
                            </Link>
                        )
                    }

                    return actionLink
                },
                type: 'element',
            },
        ] : []

        if (includes([APPROVAL], tab)) {
            return [...initalColumns] as TableColumn<SubmissionRow>[]
        }

        if (!allowsAppeals) {
            return [
                ...initalColumns,
                ...actionColumns,
            ] as TableColumn<SubmissionRow>[]
        }

        return [...initalColumns, {
            columnId: 'appeals-default',
            label: 'Appeals',
            renderer: (data: SubmissionRow) => {
                if (!data.review || !data.review.id) {
                    return (
                        <span className={styles.notReviewed}>
                            Not Reviewed
                        </span>
                    )
                }

                const appealInfo = mappingReviewAppeal[data.review.id]
                if (!appealInfo) {
                    return (
                        <span className={styles.notReviewed}>
                            loading...
                        </span>
                    )
                }

                const resourceId = data.review?.resourceId || NO_RESOURCE_ID
                const reviewStatus = (data.review?.status ?? '').toUpperCase()
                const hasAppeals = appealInfo.totalAppeals > 0

                if (!hasAppeals && reviewStatus !== 'COMPLETED') {
                    return undefined
                }

                return (
                    <>
                        [
                        <Link
                            to={`./../scorecard-details/${data.id}/review/${resourceId}`}
                            className={styles.appealsLink}
                        >
                            <span className={styles.textBlue}>{appealInfo.finishAppeals}</span>
                            {' '}
                            /
                            {' '}
                            <span className={styles.textBlue}>
                                {appealInfo.totalAppeals}
                            </span>
                        </Link>
                        ]
                    </>
                )
            },
            type: 'element',
        }, ...actionColumns] as TableColumn<SubmissionRow>[]
    }, [
        actionChallengeRole,
        allowsAppeals,
        challengeInfo,
        isReviewAppealsTab,
        isSubmissionDownloadRestricted,
        maxReviewCount,
        downloadSubmission,
        hideHandleColumn,
        isDownloading,
        mappingReviewAppeal,
        tab,
        restrictionMessage,
    ])

    const columnsMobile = useMemo<MobileTableColumn<SubmissionRow>[][]>(
        () => columns.map(column => {
            if (column.label === 'Action') {
                return [
                    {
                        ...column,
                        colSpan: 2,
                        mobileType: 'last-value',
                    },
                ]
            }

            return [
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
        }),
        [columns],
    )

    const submissions: SubmissionRow[] = useMemo(() => {
        if (isReviewAppealsTab) {
            return aggregatedSubmissionRows
        }

        if (includes([APPROVAL], tab)) {
            return firstSubmissions
                ? [{ ...firstSubmissions } as SubmissionRow]
                : []
        }

        return datas as SubmissionRow[]
    }, [
        aggregatedSubmissionRows,
        datas,
        firstSubmissions,
        isReviewAppealsTab,
        tab,
    ])

    return (
        <TableWrapper
            className={classNames(
                styles.container,
                wrapperClassName,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={submissions} />
            ) : (
                <Table
                    columns={columns}
                    data={submissions}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableReviewAppeals

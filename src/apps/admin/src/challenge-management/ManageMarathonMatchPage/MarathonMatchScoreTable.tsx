import {
    FC,
    useMemo,
    useState,
} from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { EnvironmentConfig } from '~/config'
import { getRatingColor } from '~/libs/core'
import { Table, TableColumn } from '~/libs/ui'

import { TABLE_DATE_FORMAT } from '../../config/index.config'
import { ConfirmModal } from '../../lib/components'
import { TableWrapper } from '../../lib/components/common/TableWrapper'
import {
    IsRemovingType,
    Submission,
    SubmissionReviewSummation,
} from '../../lib/models'

import { MarathonMatchScoreTableActions } from './MarathonMatchScoreTableActions'
import styles from './MarathonMatchScoreTable.module.scss'

function normalizeDateValue(
    value?: Date | string | number | null,
): number | undefined {
    if (!value && value !== 0) {
        return undefined
    }

    const timestamp = typeof value === 'number'
        ? value
        : new Date(value)
            .getTime()

    return Number.isNaN(timestamp) ? undefined : timestamp
}

type FinalScoresRow = {
    submission: Submission
    reviewSummation?: SubmissionReviewSummation
}

type TableData = SubmissionReviewSummation[] | FinalScoresRow[]

interface NormalizedScoreRow {
    aggregateScore?: number
    createdAt?: number
    maxRating?: number
    memberCreatedBy?: string
    memberHandle?: string
    reviewSummationId?: string
    submissionId: string
}

interface Props {
    className?: string
    data: TableData
    isFinalScores?: boolean
    testType: 'provisional' | 'system'
    isRunningTest: IsRemovingType
    doPostBusEvent: (submissionId: string, testType: string) => void
    isRemovingSubmission: IsRemovingType
    doRemoveSubmission: (submissionId: string) => void
    doRemoveReviewSummations?: (reviewSummationId: string) => void
    isRemovingReviewSummations?: IsRemovingType
    isDownloadingSubmission: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const MarathonMatchScoreTable: FC<Props> = props => {
    const className = props.className
    const tableData = props.data
    const isFinalScores = props.isFinalScores
    const downloadSubmission = props.downloadSubmission
    const isDownloadingSubmission = props.isDownloadingSubmission
    const doPostBusEvent = props.doPostBusEvent
    const isRemovingSubmission = props.isRemovingSubmission
    const isRunningTest = props.isRunningTest
    const testType = props.testType
    const doRemoveSubmission = props.doRemoveSubmission
    const doRemoveReviewSummations = props.doRemoveReviewSummations
    const isRemovingReviewSummations = props.isRemovingReviewSummations

    const [showConfirmDeleteDialog, setShowConfirmDeleteDialog]
        = useState<string | undefined>()
    const [
        showConfirmDeleteReviewSummationDialog,
        setShowConfirmDeleteReviewSummationDialog,
    ] = useState<string | undefined>()

    const normalizedData = useMemo<NormalizedScoreRow[]>(() => {
        if (isFinalScores) {
            const finalRows = tableData as FinalScoresRow[]

            return finalRows.map(item => {
                const createdAt = normalizeDateValue(
                    item.submission.createdAt
                    ?? item.submission.submittedDate
                    ?? item.submission.updatedAt
                    ?? undefined,
                )

                return {
                    aggregateScore: item.reviewSummation?.aggregateScore,
                    createdAt,
                    maxRating: typeof item.submission.submitterMaxRating === 'number'
                        ? item.submission.submitterMaxRating
                        : undefined,
                    memberCreatedBy: item.submission.createdBy ?? undefined,
                    memberHandle: item.submission.submitterHandle
                        ?? item.submission.createdBy
                        ?? undefined,
                    reviewSummationId: item.reviewSummation?.id,
                    submissionId: item.submission.id,
                }
            })
        }

        const provisionalRows = tableData as SubmissionReviewSummation[]

        return provisionalRows.map(item => ({
            aggregateScore: item.aggregateScore,
            createdAt: normalizeDateValue(item.createdAt ?? undefined),
            maxRating: typeof item.submitterMaxRating === 'number'
                ? item.submitterMaxRating
                : undefined,
            memberCreatedBy: item.submitterHandle ?? undefined,
            memberHandle: item.submitterHandle ?? undefined,
            reviewSummationId: item.id,
            submissionId: item.submissionId,
        }))
    }, [isFinalScores, tableData])

    const columns = useMemo<TableColumn<NormalizedScoreRow>[]>(
        () => ([
            {
                label: 'Member',
                propertyName: 'memberHandle',
                renderer: data => {
                    const handle = data.memberHandle ?? undefined
                    const rating = typeof data.maxRating === 'number'
                        ? data.maxRating
                        : undefined
                    const href = handle
                        ? `${EnvironmentConfig.URLS.USER_PROFILE}/${encodeURIComponent(handle)}`
                        : undefined
                    const color = getRatingColor(rating)

                    if (handle && href) {
                        return (
                            <a
                                href={href}
                                target='_blank'
                                rel='noreferrer'
                                style={{ color }}
                            >
                                {handle}
                            </a>
                        )
                    }

                    return (
                        <span>
                            {data.memberCreatedBy ?? '--'}
                        </span>
                    )
                },
                type: 'element',
            },
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: data => {
                    const isDownloading = Boolean(
                        isDownloadingSubmission[data.submissionId],
                    )

                    function handleDownload(): void {
                        downloadSubmission(data.submissionId)
                    }

                    return (
                        <button
                            type='button'
                            className={classNames(
                                styles.downloadLink,
                                isDownloading && styles.isDownloading,
                            )}
                            onClick={handleDownload}
                            disabled={isDownloading}
                        >
                            {isDownloading ? 'Downloading…' : data.submissionId}
                        </button>
                    )
                },
                type: 'element',
            },
            {
                defaultSortDirection: 'desc',
                label: 'Score',
                propertyName: 'aggregateScore',
                renderer: data => {
                    if (typeof data.aggregateScore === 'number') {
                        return (
                            <span>{data.aggregateScore}</span>
                        )
                    }

                    return <span className={styles.noScore}>N/A</span>
                },
                type: 'element',
            },
            {
                defaultSortDirection: 'desc',
                isDefaultSort: true,
                label: 'Created',
                propertyName: 'createdAt',
                renderer: data => {
                    if (!data.createdAt) {
                        return <span>--</span>
                    }

                    return (
                        <span>
                            {moment(data.createdAt)
                                .local()
                                .format(TABLE_DATE_FORMAT)}
                        </span>
                    )
                },
                type: 'element',
            },
            {
                label: '',
                renderer: data => (
                    <MarathonMatchScoreTableActions
                        submissionId={data.submissionId}
                        reviewSummationId={data.reviewSummationId}
                        testType={testType}
                        isRunningTest={isRunningTest}
                        doPostBusEvent={doPostBusEvent}
                        isRemovingSubmission={isRemovingSubmission}
                        setShowConfirmDeleteDialog={setShowConfirmDeleteDialog}
                        doRemoveReviewSummations={doRemoveReviewSummations}
                        isRemovingReviewSummations={isRemovingReviewSummations}
                        setShowConfirmDeleteReviewSummationDialog={
                            setShowConfirmDeleteReviewSummationDialog
                        }
                    />
                ),
                type: 'element',
            },
        ]),
        [
            doPostBusEvent,
            downloadSubmission,
            isDownloadingSubmission,
            isRemovingSubmission,
            isRunningTest,
            doRemoveReviewSummations,
            isRemovingReviewSummations,
            testType,
        ],
    )

    function handleCloseConfirmModal(): void {
        setShowConfirmDeleteDialog(undefined)
    }

    function handleConfirmDelete(): void {
        if (!showConfirmDeleteDialog) {
            return
        }

        doRemoveSubmission(showConfirmDeleteDialog)
        setShowConfirmDeleteDialog(undefined)
    }

    function handleCloseConfirmReviewSummationModal(): void {
        setShowConfirmDeleteReviewSummationDialog(undefined)
    }

    function handleConfirmDeleteReviewSummation(): void {
        if (!showConfirmDeleteReviewSummationDialog || !doRemoveReviewSummations) {
            return
        }

        doRemoveReviewSummations(showConfirmDeleteReviewSummationDialog)
        setShowConfirmDeleteReviewSummationDialog(undefined)
    }

    return (
        <TableWrapper className={classNames(styles.container, className)}>
            <Table
                columns={columns}
                data={normalizedData}
                initSort={{ direction: 'desc', fieldName: 'createdAt' }}
                className={styles.table}
            />

            {showConfirmDeleteDialog && (
                <ConfirmModal
                    title='Delete Submission'
                    action='Delete'
                    onClose={handleCloseConfirmModal}
                    onConfirm={handleConfirmDelete}
                    open
                >
                    <div>Are you sure you want to delete this submission?</div>
                </ConfirmModal>
            )}

            {showConfirmDeleteReviewSummationDialog && (
                <ConfirmModal
                    title='Delete Review Summation'
                    action='Delete'
                    onClose={handleCloseConfirmReviewSummationModal}
                    onConfirm={handleConfirmDeleteReviewSummation}
                    open
                >
                    <div>
                        Are you sure you want to delete this review summation?
                    </div>
                </ConfirmModal>
            )}
        </TableWrapper>
    )
}

export default MarathonMatchScoreTable

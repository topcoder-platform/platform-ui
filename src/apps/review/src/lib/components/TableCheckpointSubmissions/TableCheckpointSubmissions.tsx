/**
 * Table Checkpoint Submissions.
 */
import { FC, MouseEvent, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import { Screening } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getHandleUrl } from '../../utils'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableCheckpointSubmissions.module.scss'

interface Props {
    className?: string
    datas: Screening[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    mode?: 'submission' | 'screening' | 'review'
}

export const TableCheckpointSubmissions: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const mode = props.mode ?? 'submission'

    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
            const tableMode = props.mode ?? 'submission'
            const submissionColumn: TableColumn<Screening> = {
                className: styles.submissionColumn,
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: Screening) => {
                    const isRestrictedBase = isSubmissionDownloadRestrictedForMember(data.memberId)
                    const failedScan = data.virusScan === false
                    const isRestrictedForRow = isRestrictedBase || failedScan
                    const tooltipMessage = failedScan
                        ? 'Submission failed virus scan'
                        : (getRestrictionMessageForMember(data.memberId) ?? restrictionMessage)
                    const isButtonDisabled = Boolean(
                        props.isDownloading[data.submissionId]
                        || isRestrictedForRow,
                    )

                    const downloadButton = (
                        <button
                            onClick={function onClick() {
                                if (isRestrictedForRow) {
                                    return
                                }

                                props.downloadSubmission(data.submissionId)
                            }}
                            className={styles.textBlue}
                            disabled={isButtonDisabled}
                            type='button'
                        >
                            {data.submissionId}
                        </button>
                    )

                    async function handleCopySubmissionId(
                        event: MouseEvent<HTMLButtonElement>,
                    ): Promise<void> {
                        event.stopPropagation()
                        event.preventDefault()

                        if (!data.submissionId) {
                            return
                        }

                        await copyTextToClipboard(data.submissionId)
                        toast.success('Submission ID copied to clipboard', {
                            toastId: `challenge-submission-id-copy-${data.submissionId}`,
                        })
                    }

                    const renderedDownloadButton = isRestrictedForRow ? (
                        <Tooltip content={tooltipMessage} triggerOn='click-hover'>
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
                                disabled={!data.submissionId}
                            >
                                <IconOutline.DocumentDuplicateIcon />
                            </button>
                        </span>
                    )
                },
                type: 'element',
            }

            const handleColumn: TableColumn<Screening> = {
                label: 'Handle',
                propertyName: 'handle',
                renderer: (data: Screening) => (
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

            const submissionDateColumn: TableColumn<Screening> = {
                label: 'Submission Date',
                propertyName: 'createdAt',
                renderer: (data: Screening) => (
                    <span>{data.createdAtString}</span>
                ),
                type: 'element',
            }

            const baseColumns: TableColumn<Screening>[] = [
                submissionColumn,
                handleColumn,
                submissionDateColumn,
            ]

            if (tableMode === 'submission') {
                return baseColumns
            }

            if (tableMode === 'screening') {
                const screeningColumns: TableColumn<Screening>[] = [
                    ...baseColumns,
                    {
                        label: 'Checkpoint Screener',
                        propertyName: 'screenerHandle',
                        renderer: (data: Screening) => (data.screener?.id ? (
                            <a
                                href={getHandleUrl(data.screener)}
                                target='_blank'
                                rel='noreferrer'
                                style={{
                                    color: data.screener?.handleColor,
                                }}
                                onClick={function onClick() {
                                    window.open(
                                        getHandleUrl(data.screener),
                                        '_blank',
                                    )
                                }}
                            >
                                {data.screener?.memberHandle ?? ''}
                            </a>
                        ) : (
                            <span
                                style={{
                                    color: data.screener?.handleColor,
                                }}
                            >
                                {data.screener?.memberHandle ?? ''}
                            </span>
                        )),
                        type: 'element',
                    },
                    {
                        label: 'Screening Score',
                        propertyName: 'score',
                        renderer: (data: Screening) => {
                            const hasNumericScore = data.score && data.score !== 'Pending'
                            const reviewId = data.reviewId
                            const canViewScorecard = hasNumericScore && reviewId

                            if (!canViewScorecard) {
                                return <span>{data.score}</span>
                            }

                            return (
                                <Link
                                    to={`./../review/${reviewId}`}
                                    className={styles.scoreLink}
                                >
                                    {data.score}
                                </Link>
                            )
                        },
                        type: 'element',
                    },
                    {
                        label: 'Screening Result',
                        propertyName: 'result',
                        renderer: (data: Screening) => {
                            const val = (data.result || '').toUpperCase()
                            if (val === 'PASS') {
                                return (
                                    <span
                                        className={classNames(styles.resultIcon, styles.resultIconPass)}
                                        aria-label='Passed checkpoint screening'
                                        title='Pass'
                                    >
                                        <IconOutline.CheckIcon />
                                    </span>
                                )
                            }

                            if (val === 'NO PASS' || val === 'FAIL') {
                                return (
                                    <span
                                        className={classNames(styles.resultIcon, styles.resultIconFail)}
                                        aria-label='Failed checkpoint screening'
                                        title='Fail'
                                    >
                                        <IconOutline.XIcon />
                                    </span>
                                )
                            }

                            return <span>-</span>
                        },
                        type: 'element',
                    },
                ]

                // Determine if an Action column is needed (current user has any checkpoint screening assignment)
                const hasAnyMyAssignment = (props.datas || []).some(d => !!d.myReviewResourceId)
                if (!hasAnyMyAssignment) {
                    return screeningColumns
                }

                const actionColumn: TableColumn<Screening> = {
                    label: 'Action',
                    propertyName: 'action',
                    renderer: (data: Screening) => {
                        const status = (data.myReviewStatus || '').toUpperCase()
                        if (['COMPLETED', 'SUBMITTED'].includes(status)) {
                            return (
                                <div
                                    aria-label='Screening completed'
                                    className={styles.completedAction}
                                    title='Screening completed'
                                >
                                    <span className={styles.completedIcon} aria-hidden='true'>
                                        <IconOutline.CheckIcon />
                                    </span>
                                    <span className={styles.completedPill}>Screening Complete</span>
                                </div>
                            )
                        }

                        const reviewId = data.myReviewId
                        if (!reviewId) {
                            return undefined
                        }

                        // Pending or In Progress (or empty but assignment exists)
                        return (
                            <Link
                                to={`./../review/${reviewId}`}
                                className={classNames(styles.submit, 'last-element')}
                            >
                                <i className='icon-upload' />
                                Complete Screening
                            </Link>
                        )
                    },
                    type: 'element',
                }

                return [
                    ...screeningColumns,
                    actionColumn,
                ]
            }

            // mode === 'review'
            return [
                ...baseColumns,
                {
                    label: 'Review Score',
                    propertyName: 'score',
                    renderer: (data: Screening) => {
                        const hasNumericScore = data.score && data.score !== 'Pending'
                        const reviewId = data.reviewId
                        const canViewScorecard = hasNumericScore && reviewId

                        if (!canViewScorecard) {
                            return <span>{data.score}</span>
                        }

                        return (
                            <Link
                                to={`./../review/${reviewId}`}
                                className={styles.scoreLink}
                            >
                                {data.score}
                            </Link>
                        )
                    },
                    type: 'element',
                },
                {
                    label: 'Checkpoint Reviewer',
                    propertyName: 'checkpointReviewer',
                    renderer: (data: Screening) => (data.screener?.id ? (
                        <a
                            href={getHandleUrl(data.screener)}
                            target='_blank'
                            rel='noreferrer'
                            style={{
                                color: data.screener?.handleColor,
                            }}
                            onClick={function onClick() {
                                window.open(
                                    getHandleUrl(data.screener),
                                    '_blank',
                                )
                            }}
                        >
                            {data.screener?.memberHandle ?? ''}
                        </a>
                    ) : (
                        <span
                            style={{
                                color: data.screener?.handleColor,
                            }}
                        >
                            {data.screener?.memberHandle ?? ''}
                        </span>
                    )),
                    type: 'element',
                },
            ]
        },
        [
            props,
            isSubmissionDownloadRestricted,
            restrictionMessage,
            isSubmissionDownloadRestrictedForMember,
            getRestrictionMessageForMember,
        ],
    )

    const columnsMobile = useMemo<MobileTableColumn<Screening>[][]>(
        () => columns.map(
            column => [
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
            ] as MobileTableColumn<Screening>[],
        ),
        [columns],
    )

    const hasCheckpointData = (props.datas?.length ?? 0) > 0
    const shouldShowEmptyState = !hasCheckpointData && (mode === 'screening' || mode === 'review')

    return (
        <TableWrapper
            className={classNames(styles.container, props.className, 'enhanced-table')}
        >
            {shouldShowEmptyState ? (
                <p className={styles.emptyState}>
                    No checkpoint submissions yet
                </p>
            ) : isTablet ? (
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableCheckpointSubmissions

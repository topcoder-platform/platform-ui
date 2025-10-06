/**
 * Table Checkpoint Submissions.
 */
import { FC, MouseEvent, useMemo } from 'react'
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
}

export const TableCheckpointSubmissions: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])

    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()

    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
            const submissionColumn: TableColumn<Screening> = {
                className: styles.submissionColumn,
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: Screening) => {
                    const isRestrictedForRow
                        = isSubmissionDownloadRestrictedForMember(data.memberId)
                    const tooltipMessage = getRestrictionMessageForMember(
                        data.memberId,
                    ) ?? restrictionMessage
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

            return [
                submissionColumn,
                handleColumn,
                submissionDateColumn,
                {
                    label: 'Checkpoint Reviewer',
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
                    label: 'Checkpoint Score',
                    propertyName: 'score',
                    type: 'text',
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

    return (
        <TableWrapper
            className={classNames(styles.container, props.className, 'enhanced-table')}
        >
            {isTablet ? (
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

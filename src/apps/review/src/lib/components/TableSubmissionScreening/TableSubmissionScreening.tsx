/**
 * Table Submission Screening.
 */
import { FC, MouseEvent, useContext, useMemo } from 'react'
import { toast } from 'react-toastify'
import _ from 'lodash'
import classNames from 'classnames'

import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { IsRemovingType } from '~/apps/admin/src/lib/models'
import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { copyTextToClipboard, useWindowSize, WindowSize } from '~/libs/shared'
import { IconOutline, Table, TableColumn, Tooltip } from '~/libs/ui'

import { ChallengeDetailContextModel, Screening } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getHandleUrl } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'
import { useSubmissionDownloadAccess } from '../../hooks'
import type { UseSubmissionDownloadAccessResult } from '../../hooks/useSubmissionDownloadAccess'

import styles from './TableSubmissionScreening.module.scss'

interface Props {
    className?: string
    datas: Screening[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
    hideHandleColumn?: boolean
}

export const TableSubmissionScreening: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const {
        isSubmissionDownloadRestricted,
        restrictionMessage,
        isSubmissionDownloadRestrictedForMember,
        getRestrictionMessageForMember,
    }: UseSubmissionDownloadAccessResult = useSubmissionDownloadAccess()
    const hasScreeningPhase = useMemo(
        () => challengeInfo?.phases?.some(
            phase => phase.name?.toLowerCase() === 'screening',
        ) ?? false,
        [challengeInfo?.phases],
    )
    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
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

            const handleColumn: TableColumn<Screening> | undefined = props.hideHandleColumn
                ? undefined
                : {
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

            const virusScanColumn: TableColumn<Screening> = {
                label: 'Virus Scan',
                propertyName: 'virusScan',
                renderer: (data: Screening) => {
                    if (data.virusScan === true) {
                        return (
                            <span className={styles.virusOkIcon} title='Scan passed' aria-label='Scan passed'>
                                <IconOutline.CheckCircleIcon />
                            </span>
                        )
                    }

                    if (data.virusScan === false) {
                        return (
                            <span className={styles.virusWarnIcon} title='Scan failed' aria-label='Scan failed'>
                                <IconOutline.ExclamationIcon />
                            </span>
                        )
                    }

                    return <span>-</span>
                },
                type: 'element',
            }

            const baseColumns: TableColumn<Screening>[] = [
                submissionColumn,
                ...(handleColumn ? [handleColumn] : []),
                submissionDateColumn,
                virusScanColumn,
            ]

            if (!hasScreeningPhase) {
                return baseColumns
            }

            return [
                ...baseColumns,
                {
                    label: 'Screener',
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
                    type: 'text',
                },
                {
                    label: 'Screening Result',
                    propertyName: 'result',
                    renderer: (data: Screening) => {
                        const val = (data.result || '').toUpperCase()
                        if (val === 'PASS') {
                            return (
                                <span className={styles.resultPass}>Pass</span>
                            )
                        }

                        if (val === 'NO PASS' || val === 'FAIL') {
                            return (
                                <span className={styles.resultFail}>Fail</span>
                            )
                        }

                        return <span>-</span>
                    },
                    type: 'element',
                },
            ]
        },
        [
            props,
            hasScreeningPhase,
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
            className={classNames(
                styles.container,
                props.className,
                'enhanced-table',
            )}
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

export default TableSubmissionScreening

/**
 * Table Submission Screening.
 */
import { FC, useContext, useMemo } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { IsRemovingType } from '~/apps/admin/src/lib/models'

import { ChallengeDetailContextModel, Screening } from '../../models'
import { TableWrapper } from '../TableWrapper'
import { getHandleUrl } from '../../utils'
import { ChallengeDetailContext } from '../../contexts'

import styles from './TableSubmissionScreening.module.scss'

interface Props {
    className?: string
    datas: Screening[]
    isDownloading: IsRemovingType
    downloadSubmission: (submissionId: string) => void
}

export const TableSubmissionScreening: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 984, [screenWidth])
    const { challengeInfo }: ChallengeDetailContextModel = useContext(
        ChallengeDetailContext,
    )
    const hasScreeningPhase = useMemo(
        () => challengeInfo?.phases?.some(
            phase => phase.name.toLowerCase() === 'screening',
        ) ?? false,
        [challengeInfo?.phases],
    )

    const columns = useMemo<TableColumn<Screening>[]>(
        () => {
            const baseColumns: TableColumn<Screening>[] = [
                {
                    label: 'Submission ID',
                    propertyName: 'submissionId',
                    renderer: (data: Screening) => (
                        <button
                            onClick={function onClick() {
                                props.downloadSubmission(data.submissionId)
                            }}
                            className={styles.textBlue}
                            disabled={props.isDownloading[data.submissionId]}
                            type='button'
                        >
                            {data.submissionId}
                        </button>
                    ),
                    type: 'element',
                },
                {
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
                },
                {
                    label: 'Submission Date',
                    propertyName: 'createdAt',
                    renderer: (data: Screening) => (
                        <span>{data.createdAtString}</span>
                    ),
                    type: 'element',
                },
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
                    type: 'text',
                },
            ]
        },
        [
            props.isDownloading,
            props.downloadSubmission,
            hasScreeningPhase,
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

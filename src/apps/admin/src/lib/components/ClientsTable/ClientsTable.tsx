/**
 * Clients table.
 */
import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import { Link } from 'react-router-dom'
import classNames from 'classnames'

import { Sort } from '~/apps/admin/src/platform/gamification-admin/src/game-lib'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { colWidthType, Table, TableColumn } from '~/libs/ui'

import { ClientInfo, MobileTableColumn } from '../../models'
import { Pagination } from '../common/Pagination'
import { TableMobile } from '../common/TableMobile'

import styles from './ClientsTable.module.scss'

const formatStatus = (status?: string): string => {
    if (!status) {
        return ''
    }

    const normalizedStatus = status.toLowerCase()
    return `${normalizedStatus.charAt(0)
        .toUpperCase()}${normalizedStatus.slice(1)}`
}

interface Props {
    className?: string
    datas: ClientInfo[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    sort: Sort | undefined
    setSort: Dispatch<SetStateAction<Sort | undefined>>
    colWidth: colWidthType | undefined,
    setColWidth: Dispatch<SetStateAction<colWidthType>> | undefined
}

export const ClientsTable: FC<Props> = (props: Props) => {
    const columns = useMemo<TableColumn<ClientInfo>[]>(
        () => [
            {
                columnId: 'ClientID',
                label: 'Client ID',
                renderer: (data: ClientInfo) => (
                    <div>
                        <Link to={`${data.id}/edit`}>{data.id}</Link>
                    </div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                columnId: 'name',
                label: 'Name',
                propertyName: 'name',
                type: 'text',
            },
            {
                columnId: 'status',
                label: 'Status',
                propertyName: 'status',
                renderer: (data: ClientInfo) => (
                    <span>{formatStatus(data.status)}</span>
                ),
                type: 'element',
            },
            {
                columnId: 'startDateString',
                label: 'Start Date',
                propertyName: 'startDateString',
                type: 'text',
            },
            {
                columnId: 'endDateString',
                label: 'End Date',
                propertyName: 'endDateString',
                type: 'text',
            },
            {
                columnId: 'codeName',
                label: 'Code name',
                renderer: (data: ClientInfo) => (
                    <>
                        {data.codeName}
                    </>
                ),
                type: 'element',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<ClientInfo>[][]>(
        () => [
            [
                {
                    colSpan: 2,
                    label: 'Client ID',
                    propertyName: columns[0].propertyName,
                    renderer: (data: ClientInfo) => (
                        <span>
                            <Link to={`${data.id}/edit`}>{data.id}</Link>
                            {' '}
                            |
                            {' '}
                            {data.name}
                        </span>
                    ),
                    type: 'element',
                },
            ],
            [
                {
                    label: 'Status label',
                    mobileType: 'label',
                    propertyName: columns[2].propertyName,
                    renderer: () => <div>Status:</div>,
                    type: 'element',
                },
                {
                    ...columns[2],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    label: 'Start Date label',
                    mobileType: 'label',
                    propertyName: columns[3].propertyName,
                    renderer: () => <div>Start Date:</div>,
                    type: 'element',
                },
                {
                    ...columns[3],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    label: 'End Date label',
                    mobileType: 'label',
                    propertyName: columns[4].propertyName,
                    renderer: () => <div>End Date:</div>,
                    type: 'element',
                },
                {
                    ...columns[4],
                    mobileType: 'last-value',
                },
            ],
            [
                {
                    label: 'Code name label',
                    mobileType: 'label',
                    propertyName: columns[5].propertyName,
                    renderer: () => <div>Code name:</div>,
                    type: 'element',
                },
                {
                    ...columns[5],
                    mobileType: 'last-value',
                },
            ],
        ],
        [columns],
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1050, [screenWidth])

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={props.datas} />
            ) : (
                <Table
                    columns={columns}
                    data={props.datas}
                    onToggleSort={props.setSort}
                    removeDefaultSort
                    forceSort={props.sort}
                    className={styles.desktopTable}
                    colWidth={props.colWidth}
                    setColWidth={props.setColWidth}
                />
            )}
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />
        </div>
    )
}

export default ClientsTable

/**
 * Table Active Reviews.
 */
import { Dispatch, FC, SetStateAction, useCallback, useMemo } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { bind, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib'
import { PencilAltIcon } from '@heroicons/react/outline'

import { Scorecard } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableScorecards.module.scss'

interface Props {
    className?: string
    datas: Scorecard[]
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
}

export const TableScorecards: FC<Props> = (props: Props) => {
    const navigate = useNavigate()
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

    const redirect = useCallback(
        (data: Scorecard, e: React.MouseEvent<HTMLAnchorElement>) => {
            e.preventDefault()
            navigate(`${data.id}/details`)
        },
        [navigate],
    )

    const columns = useMemo<TableColumn<Scorecard>[]>(
        () => [
            {
                className: styles.tableCell,
                label: '#',
                propertyName: 'index',
                type: 'text',
            },
            {
                className: classNames(styles.textBlue, styles.tableBreakCell, styles.tableCell),
                label: 'Scorecard',
                propertyName: 'name',
                renderer: (data: Scorecard) => (
                    <Link to='/' onClick={bind(redirect, this, data)}>
                        {data.name}
                    </Link>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
                label: 'Type',
                propertyName: 'type',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Project Type',
                propertyName: 'projectType',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Category',
                propertyName: 'category',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Status',
                propertyName: 'status',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Action',
                renderer: () => (
                    <div className='last-element'>
                        <PencilAltIcon />
                    </div>
                ),
                type: 'action',
            },
        ],
        [redirect],
    )

    const columnsMobile = useMemo<MobileTableColumn<Scorecard>[][]>(
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
            ] as MobileTableColumn<Scorecard>[],
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
                    onToggleSort={noop}
                    removeDefaultSort
                    className='enhanced-table-desktop'
                />
            )}
            <Pagination
                page={props.page}
                totalPages={props.totalPages}
                onPageChange={props.setPage}
            />
        </TableWrapper>
    )
}

export default TableScorecards

/**
 * Table Active Reviews.
 */
import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { bind, noop } from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'
import { Pagination } from '~/apps/admin/src/lib'
import { DuplicateIcon, PencilIcon } from '@heroicons/react/outline'

import { ProjectType, ProjectTypeLabels, Scorecard, ScorecardStatusLabels, ScorecardTypeLabels } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableScorecards.module.scss'

interface Props {
    className?: string
    datas: Scorecard[]
    metadata?: any
    perPage?: number
    totalPages: number
    page: number
    setPage: Dispatch<SetStateAction<number>>
    onClone: (scorecard: Scorecard) => unknown
}

export const TableScorecards: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

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
                    <Link to={`${data.id}`}>
                        {data.name}
                    </Link>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
                label: 'Type',
                propertyName: 'type',
                renderer: (data: Scorecard) => (
                    <div>{ScorecardTypeLabels[data.type]}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Project Type',
                propertyName: 'challengeTrack',
                renderer: (data: Scorecard) => (
                    <div>{ProjectTypeLabels[data.challengeTrack as ProjectType]}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Category',
                propertyName: 'challengeType',
                type: 'text',
            },
            {
                className: styles.tableCell,
                label: 'Status',
                propertyName: 'status',
                renderer: (data: Scorecard) => (
                    <div>{ScorecardStatusLabels[data.status]}</div>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell, styles.tableCellCenter),
                label: 'Action',
                renderer: (data: Scorecard) => (
                    <div className={styles.action}>
                        <div className={styles.actionItem}>
                            <PencilIcon />
                            <span>Edit</span>
                        </div>
                        <div className={styles.actionItem} onClick={bind(props.onClone, this, data)}>
                            <DuplicateIcon />
                            <span>Clone</span>
                        </div>
                    </div>
                ),
                type: 'action',
            },
        ],
        [],
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
            <div className={styles.pagination}>
                <div className={styles.paginationText}>
                    Showing 1-
                    {props.perPage}
                    {' '}
                    of
                    {' '}
                    {props.metadata.total}
                    {' '}
                    results
                </div>
                <Pagination
                    page={props.page}
                    totalPages={props.totalPages}
                    onPageChange={props.setPage}
                />
            </div>

        </TableWrapper>
    )
}

export default TableScorecards

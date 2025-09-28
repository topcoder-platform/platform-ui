/**
 * Table Active Reviews.
 */
import { Dispatch, FC, SetStateAction, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { noop } from 'lodash'
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
    const className = props.className
    const datas = props.datas
    const metadata = props.metadata
    const perPage = props.perPage
    const totalPages = props.totalPages
    const page = props.page
    const setPage = props.setPage
    const onClone = props.onClone
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 1000, [screenWidth])

    const start = (page - 1) * (perPage ?? 0) + 1
    const end = Math.min(page * (perPage ?? 0), metadata?.total ?? 0)

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
                renderer: (scorecard: Scorecard) => (
                    <Link to={`${scorecard.id}`}>
                        {scorecard.name}
                    </Link>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell),
                label: 'Type',
                propertyName: 'type',
                renderer: (scorecard: Scorecard) => (
                    <div>{ScorecardTypeLabels[scorecard.type]}</div>
                ),
                type: 'element',
            },
            {
                className: styles.tableCell,
                label: 'Project Type',
                propertyName: 'challengeTrack',
                renderer: (scorecard: Scorecard) => (
                    <div>{ProjectTypeLabels[scorecard.challengeTrack as ProjectType]}</div>
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
                renderer: (scorecard: Scorecard) => (
                    <div>{ScorecardStatusLabels[scorecard.status]}</div>
                ),
                type: 'element',
            },
            {
                className: classNames(styles.tableCell, styles.tableCellCenter),
                label: 'Action',
                renderer: (scorecard: Scorecard) => (
                    <div className={styles.action}>
                        <Link className={styles.actionItem} to={`${scorecard.id}/edit`}>
                            <PencilIcon />
                            <span>Edit</span>
                        </Link>
                        <div
                            className={styles.actionItem}
                            onClick={function onClick() {
                                onClone(scorecard)
                            }}
                        >
                            <DuplicateIcon />
                            <span>Clone</span>
                        </div>
                    </div>
                ),
                type: 'action',
            },
        ],
        [onClone],
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
                className,
                'enhanced-table',
            )}
        >
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={datas} />
            ) : (
                <Table
                    columns={columns}
                    data={datas}
                    disableSorting
                    onToggleSort={noop}
                    removeDefaultSort
                    className='enhanced-table-desktop'
                />
            )}
            <div className={styles.pagination}>
                <div className={styles.paginationText}>
                    Showing
                    {' '}
                    {start}
                    -
                    {end}
                    {' '}
                    of
                    {' '}
                    {metadata?.total ?? 0}
                    {' '}
                    results
                </div>
                <Pagination page={page} totalPages={totalPages} onPageChange={setPage} />
            </div>

        </TableWrapper>
    )
}

export default TableScorecards

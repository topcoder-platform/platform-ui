/**
 * Table Submission Screening.
 */
import { FC, useCallback, useMemo } from 'react'
import { NavLink } from 'react-router-dom'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { Screening } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableSubmissionScreening.module.scss'

interface Props {
    className?: string
    datas: Screening[]
}

export const TableSubmissionScreening: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const prevent = useCallback((e: React.MouseEvent<HTMLAnchorElement>) => {
        e.preventDefault()
    }, [])

    const columns = useMemo<TableColumn<Screening>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'submissionId',
                renderer: (data: Screening) => (
                    <NavLink
                        to='#'
                        onClick={prevent}
                        className={styles.textBlue}
                    >
                        {data.submissionId}
                    </NavLink>
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
            {
                label: 'Screener',
                propertyName: 'screenerHandle',
                renderer: (data: Screening) => (
                    <NavLink
                        to='#'
                        className={styles.screener}
                        onClick={prevent}
                        style={{
                            color: data.screenerHandleColor,
                        }}
                    >
                        {data.screenerHandle}
                    </NavLink>
                ),
                type: 'element',
            },
            {
                label: 'Screening Score',
                propertyName: 'score',
                renderer: (data: Screening) => (
                    <NavLink to='#' onClick={prevent}>
                        {data.score}
                    </NavLink>
                ),
                type: 'element',
            },
            {
                label: 'Screening Result',
                propertyName: 'result',
                renderer: (data: Screening) => <span className='last-element'>{data.result}</span>,
                type: 'element',
            },
        ],
        [prevent],
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

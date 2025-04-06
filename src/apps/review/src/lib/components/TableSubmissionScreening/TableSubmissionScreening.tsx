/**
 * Table Submission Screening.
 */
import { FC, useMemo } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { MobileTableColumn } from '~/apps/admin/src/lib/models/MobileTableColumn.model'
import { useWindowSize, WindowSize } from '~/libs/shared'
import { TableMobile } from '~/apps/admin/src/lib/components/common/TableMobile'
import { Table, TableColumn } from '~/libs/ui'

import { SubmissionInfo } from '../../models'
import { TableWrapper } from '../TableWrapper'

import styles from './TableSubmissionScreening.module.scss'

interface Props {
    className?: string
}

export const TableSubmissionScreening: FC<Props> = (props: Props) => {
    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 744, [screenWidth])

    const columns = useMemo<TableColumn<SubmissionInfo>[]>(
        () => [
            {
                label: 'Submission ID',
                propertyName: 'id',
                type: 'text',
            },
            {
                label: 'Submission Date',
                type: 'text',
            },
            {
                label: 'Screener',
                type: 'text',
            },
            {
                label: 'Screening Score',
                type: 'text',
            },
            {
                label: 'Screening Result',
                type: 'text',
            },
        ],
        [],
    )

    const columnsMobile = useMemo<MobileTableColumn<SubmissionInfo>[][]>(
        () => columns.map(column => [
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
        ] as MobileTableColumn<SubmissionInfo>[]),
        [columns],
    )

    return (
        <TableWrapper className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={[]} />
            ) : (
                <Table
                    columns={columns}
                    data={[]}
                    disableSorting
                    onToggleSort={_.noop}
                    removeDefaultSort
                />
            )}
        </TableWrapper>
    )
}

export default TableSubmissionScreening

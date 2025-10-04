/**
 * Billing account resources table.
 */
import { FC, useMemo, useState } from 'react'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'
import { Button, colWidthType, Table, TableColumn } from '~/libs/ui'

import { useTableFilterLocal, useTableFilterLocalProps } from '../../hooks'
import { Pagination } from '../common/Pagination'
import {
    BillingAccountResource,
    IsRemovingType,
    MobileTableColumn,
} from '../../models'
import { TableMobile } from '../common/TableMobile'

import styles from './BillingAccountResourcesTable.module.scss'

interface Props {
    className?: string
    isRemoving: IsRemovingType
    datas: BillingAccountResource[]
    doRemoveItem: (item: BillingAccountResource) => void
}

export const BillingAccountResourcesTable: FC<Props> = (props: Props) => {
    const [colWidth, setColWidth] = useState<colWidthType>({})
    const {
        page,
        setPage,
        totalPages,
        results,
        setSort,
        sort,
    }: useTableFilterLocalProps<BillingAccountResource> = useTableFilterLocal(
        props.datas ?? [],
    )

    const columns = useMemo<TableColumn<BillingAccountResource>[]>(
        () => [
            {
                columnId: 'name',
                label: 'Name',
                propertyName: 'name',
                type: 'text',
            },
            {
                className: styles.blockColumnAction,
                columnId: 'action',
                label: '',
                renderer: (data: BillingAccountResource) => (
                    <Button
                        variant='tc-green'
                        label='Remove'
                        disabled={props.isRemoving[data.id]}
                        onClick={function onClick() {
                            props.doRemoveItem(data)
                        }}
                        className={styles.btnDelete}
                    />
                ),
                type: 'action',
            },
        ],
        // eslint-disable-next-line react-hooks/exhaustive-deps
        [props.isRemoving, props.doRemoveItem],
    )

    const columnsMobile = useMemo<
        MobileTableColumn<BillingAccountResource>[][]
    >(
        () => [
            [
                {
                    ...columns[0],
                    colSpan: 2,
                },
            ],
            [
                {
                    ...columns[1],
                    colSpan: 2,
                    mobileType: 'last-value',
                },
            ],
        ],
        [columns],
    )

    const { width: screenWidth }: WindowSize = useWindowSize()
    const isTablet = useMemo(() => screenWidth <= 465, [screenWidth])

    return (
        <div className={classNames(styles.container, props.className)}>
            {isTablet ? (
                <TableMobile columns={columnsMobile} data={results} />
            ) : (
                <Table
                    columns={columns}
                    data={results}
                    onToggleSort={setSort}
                    forceSort={sort}
                    removeDefaultSort
                    className={styles.desktopTable}
                    colWidth={colWidth}
                    setColWidth={setColWidth}
                />
            )}

            <Pagination
                page={page}
                totalPages={totalPages}
                onPageChange={setPage}
            />
        </div>
    )
}

export default BillingAccountResourcesTable

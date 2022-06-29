import classNames from 'classnames'
import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react'

import { Sort } from '../pagination'
import '../styles/_includes.scss'
import { IconOutline } from '../svgs'
import { Tooltip } from '../tooltip'

import { TableCell } from './table-cell'
import { TableColumn } from './table-column.model'
import { tableGetDefaultSort, tableGetSorted } from './table-functions'
import { TableSort } from './table-sort'
import styles from './Table.module.scss'

interface TableProps<T> {
    readonly columns: ReadonlyArray<TableColumn<T>>
    readonly data: ReadonlyArray<T>
    readonly onRowClick?: (data: T) => void
}

interface DefaultSortDirectionMap {
    [columnProperty: string]: 'asc' | 'desc'
}

const Table: <T extends { [propertyName: string]: any }>(props: TableProps<T>) => JSX.Element
    = <T extends { [propertyName: string]: any }>(props: TableProps<T>) => {

        const [sort, setSort]: [Sort | undefined, Dispatch<SetStateAction<Sort | undefined>>]
            = useState<Sort | undefined>(tableGetDefaultSort(props.columns))
        const [defaultSortDirectionMap, setDefaultSortDirectionMap]: [DefaultSortDirectionMap | undefined, Dispatch<SetStateAction<DefaultSortDirectionMap | undefined>>]
            = useState<DefaultSortDirectionMap | undefined>()
        const [sortedData, setSortData]: [ReadonlyArray<T>, Dispatch<SetStateAction<ReadonlyArray<T>>>]
            = useState<ReadonlyArray<T>>(props.data)

        useEffect(() => {

            if (!defaultSortDirectionMap) {
                const map: DefaultSortDirectionMap = {}
                props.columns
                    .filter(col => !!col.propertyName)
                    .forEach(col => map[col.propertyName as string] = col.defaultSortDirection || 'asc')
                setDefaultSortDirectionMap(map)
            }

            setSortData(tableGetSorted(props.data, props.columns, sort))
        },
            [
                defaultSortDirectionMap,
                sort,
                props.data,
            ])

        function toggleSort(fieldName: string): void {

            // if we don't have anything to sort by, we shouldn't be here
            if (!sort) {
                return
            }

            // get the sort direction
            const direction: 'asc' | 'desc' = fieldName === sort.fieldName
                // this is the current sort, so just toggle it
                ? sort.direction === 'asc' ? 'desc' : 'asc'
                // get the default sort for the field... this will never be undefined
                : (defaultSortDirectionMap as DefaultSortDirectionMap)[fieldName]

            const newSort: Sort = {
                direction,
                fieldName,
            }
            setSort(newSort)
        }

        const headerRow: Array<JSX.Element> = props.columns
            .map((col, index) => {
                const isSortable: boolean = !!col.propertyName
                const isCurrentlySorted: boolean = isSortable && col.propertyName === sort?.fieldName
                const colorClass: string = isCurrentlySorted ? 'black-100' : 'black-60'
                const sortableClass: string | undefined = isSortable ? styles.sortable : undefined
                return (
                    <th
                        className={styles.th}
                        key={index}
                    >
                        <div className={classNames(styles['header-container'], styles[col.type], colorClass, sortableClass)}>
                            {col.label}
                            {!!col.tooltip && (
                                <div className={styles.tooltip}>
                                    <Tooltip
                                        content={col.tooltip}
                                        positionX='end'
                                        positionY='end'
                                        trigger={<IconOutline.InformationCircleIcon />}
                                    />
                                </div>
                            )}
                            <TableSort
                                iconClass={colorClass}
                                isCurrentlySorted={isCurrentlySorted}
                                propertyName={col.propertyName}
                                sort={sort}
                                toggleSort={toggleSort}
                            />
                        </div>
                    </th>
                )
            })

        const rowCells: Array<JSX.Element> = sortedData
            .map((data, index) => {

                function onRowClick(event: MouseEvent<HTMLTableRowElement>): void {
                    event.preventDefault()
                    props.onRowClick?.(data)
                }

                // get the cells in the row
                const cells: Array<JSX.Element> = props.columns
                    .map((col, colIndex) => {
                        return (
                            <TableCell
                                {...col}
                                data={data}
                                index={index}
                                key={`${index}${colIndex}`}
                            />
                        )
                    })

                // return the entire row
                return (
                    <tr
                        className={classNames(styles.tr, !!onRowClick ? styles.clickable : undefined)}
                        onClick={onRowClick}
                        key={index}
                    >
                        {cells}
                    </tr >
                )
            })

        return (
            /* TODO: sticky header */
            <div className={styles['table-wrap']}>
                <table className={styles.table}>
                    <thead>
                        <tr className={styles.tr}>
                            {headerRow}
                        </tr>
                    </thead>
                    <tbody>
                        {rowCells}
                    </tbody>
                </table>
            </div>
        )
    }

export default Table

import { Dispatch, MouseEvent, SetStateAction, useEffect, useState } from 'react'
import classNames from 'classnames'

import { Button } from '../button'
import { Sort } from '../../../../../apps/gamification-admin/src/game-lib/pagination'
import { IconOutline } from '../svgs'
import { Tooltip } from '../tooltip'
import '../../styles/_includes.scss'

import { TableCell } from './table-cell'
import { TableColumn } from './table-column.model'
import { tableGetDefaultSort, tableGetSorted } from './table-functions'
import { TableSort } from './table-sort'
import styles from './Table.module.scss'

function getKey(key: string | number): string {
    return `${key}`
}

interface TableProps<T> {
    readonly columns: ReadonlyArray<TableColumn<T>>
    readonly data: ReadonlyArray<T>
    readonly moreToLoad?: boolean
    readonly onLoadMoreClick?: () => void
    readonly onRowClick?: (data: T) => void
    readonly onToggleSort?: (sort: Sort) => void
}

interface DefaultSortDirectionMap {
    [columnProperty: string]: 'asc' | 'desc'
}

const Table: <T extends { [propertyName: string]: any }>(props: TableProps<T>) => JSX.Element
    = <T extends { [propertyName: string]: any }>(props: TableProps<T>) => {

        const [sort, setSort]: [Sort | undefined, Dispatch<SetStateAction<Sort | undefined>>]
            = useState<Sort | undefined>(tableGetDefaultSort(props.columns))
        const [defaultSortDirectionMap, setDefaultSortDirectionMap]: [
            DefaultSortDirectionMap | undefined,
            Dispatch<SetStateAction<DefaultSortDirectionMap | undefined>>
        ]
            = useState<DefaultSortDirectionMap | undefined>()
        const [sortedData, setSortedData]: [ReadonlyArray<T>, Dispatch<SetStateAction<ReadonlyArray<T>>>]
            = useState<ReadonlyArray<T>>(props.data)

        useEffect(
            () => {

                if (!defaultSortDirectionMap) {
                    const map: DefaultSortDirectionMap = {}
                    props.columns
                        .filter(col => !!col.propertyName)
                        .forEach(col => {
                            map[col.propertyName as string] = col.defaultSortDirection || 'asc'
                        })
                    setDefaultSortDirectionMap(map)
                }

                // if we have a sort handler, don't worry about getting the sorted data;
                // otherwise, get the sorted data for the table
                const sorted: ReadonlyArray<T>
                    = !!props.onToggleSort ? props.data : tableGetSorted(props.data, props.columns, sort)

                setSortedData(sorted)
            },
            [
                props.columns,
                props.data,
                defaultSortDirectionMap,
                props.onToggleSort,
                sort,
            ],
        )

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

            // call the callback to notify parent for sort update
            props.onToggleSort?.(newSort)
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
                        key={getKey(index)}
                    >
                        <div
                            className={
                                classNames(styles['header-container'], styles[col.type], colorClass, sortableClass)
                            }
                        >
                            {col.label}
                            {!!col.tooltip && (
                                <div className={styles.tooltip}>
                                    <Tooltip content={col.tooltip} triggerOn='click'>
                                        <IconOutline.InformationCircleIcon className='tooltip-icon' />
                                    </Tooltip>
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
            .map((sorted, index) => {

                function onRowClick(event: MouseEvent<HTMLTableRowElement>): void {
                    event.preventDefault()
                    props.onRowClick?.(sorted)
                }

                // get the cells in the row
                const cells: Array<JSX.Element> = props.columns
                    .map((col, colIndex) => (
                        <TableCell
                            {...col}
                            data={sorted}
                            index={index}
                            key={getKey(`${index}${colIndex}`)}
                        />
                    ))

                // return the entire row
                return (
                    <tr
                        className={classNames(styles.tr, props.onRowClick ? styles.clickable : undefined)}
                        onClick={onRowClick}
                        key={getKey(index)}
                    >
                        {cells}
                    </tr>
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
                {
                    !!props.moreToLoad && !!props.onLoadMoreClick && (
                        <div className={styles.loadBtnWrap}>
                            <Button
                                primary
                                light
                                label='Load More'
                                size='lg'
                                onClick={props.onLoadMoreClick}
                            />
                        </div>
                    )
                }
            </div>
        )
    }

export default Table

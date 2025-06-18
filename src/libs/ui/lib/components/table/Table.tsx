import { Dispatch, SetStateAction, useEffect, useMemo, useRef, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { useWindowSize, WindowSize } from '~/libs/shared'

import { Button } from '../button'
import { Sort } from '../../../../../apps/gamification-admin/src/game-lib/pagination'
import { IconOutline } from '../svgs'
import { Tooltip } from '../tooltip'
import '../../styles/_includes.scss'

import { TableColumn } from './table-column.model'
import { tableGetDefaultSort, tableGetSorted } from './table-functions'
import { TableSort } from './table-sort'
import { TableRow } from './table-row'
import styles from './Table.module.scss'

function getKey(key: string | number): string {
    return `${key}`
}

export type colWidthType = {[key: string]: number}

interface TableProps<T> {
    readonly columns: ReadonlyArray<TableColumn<T>>
    readonly data: ReadonlyArray<T>
    readonly moreToLoad?: boolean
    readonly disableSorting?: boolean
    readonly showExpand?: boolean
    readonly initSort?: Sort
    readonly forceSort?: Sort
    readonly onLoadMoreClick?: () => void
    readonly onRowClick?: (data: T) => void
    readonly onToggleSort?: (sort: Sort) => void
    readonly removeDefaultSort?: boolean
    readonly colWidth?: colWidthType | undefined,
    readonly setColWidth?: Dispatch<SetStateAction<colWidthType>> | undefined
    readonly className?: string
    readonly preventDefault?: boolean
}

interface DefaultSortDirectionMap {
    [columnProperty: string]: 'asc' | 'desc'
}

const Table: <T extends { [propertyName: string]: any }>(props: TableProps<T>) => JSX.Element
    = <T extends { [propertyName: string]: any }>(props: TableProps<T>) => {
        const { width: screenWidth }: WindowSize = useWindowSize()
        const tableRef = useRef<HTMLTableElement>(null)
        const screenWidthBkRef = useRef<number>(0)
        const colWidthInput = props.colWidth
        const setColWidth = props.setColWidth

        const [sort, setSort]: [Sort | undefined, Dispatch<SetStateAction<Sort | undefined>>]
            = useState<Sort | undefined>(
                props.removeDefaultSort
                    ? undefined
                    : tableGetDefaultSort(props.columns, props.initSort),
            )
        const displayColumns = useMemo(() => {
            if (!props.showExpand) {
                return props.columns
            }

            return _.filter(props.columns, item => !item.isExpand)
        }, [props.columns, props.showExpand])

        const [defaultSortDirectionMap, setDefaultSortDirectionMap]: [
            DefaultSortDirectionMap | undefined,
            Dispatch<SetStateAction<DefaultSortDirectionMap | undefined>>
        ]
            = useState<DefaultSortDirectionMap | undefined>()
        const [sortedData, setSortedData]: [ReadonlyArray<T>, Dispatch<SetStateAction<ReadonlyArray<T>>>]
            = useState<ReadonlyArray<T>>(props.data)

        useEffect(() => {
            if (_.isEmpty(colWidthInput) && colWidthInput) {
                setTimeout(() => {
                    let haveColumnWidth = true
                    const colWidthBk: { [key: string]: number } = {}
                    _.forEach(displayColumns, column => {
                        const columnId = `column-id-${column.columnId}-`
                        const colElement = tableRef.current?.querySelector(
                            `.${columnId}`,
                        )
                        const computedStyle = colElement
                            ? getComputedStyle(colElement)
                            : { paddingLeft: '0', paddingRight: '0' }
                        let colWidth = colElement?.clientWidth ?? 0
                        if (!!colWidth) {
                            colWidth
                                -= parseFloat(computedStyle.paddingLeft)
                                + parseFloat(computedStyle.paddingRight)
                        }

                        colWidthBk[`column-id-${column.columnId}-`] = colWidth
                        if (!colWidth) {
                            haveColumnWidth = false
                        }
                    })
                    if (haveColumnWidth) {
                        setColWidth?.(colWidthBk)
                    }
                }, 10)
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [sortedData, colWidthInput])
        useEffect(() => {
            if (!screenWidthBkRef.current) {
                screenWidthBkRef.current = screenWidth
                return // do not reset col width on init
            }

            if (!_.isEmpty(colWidthInput) && screenWidthBkRef.current !== screenWidth) {
                setColWidth?.({})
            }

            screenWidthBkRef.current = screenWidth
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [screenWidth])

        useEffect(() => {
            if (
                (props.forceSort || props.removeDefaultSort)
                && !_.isEqual(sort, props.forceSort)
            ) {
                setSort(props.forceSort)
            }
        // eslint-disable-next-line react-hooks/exhaustive-deps
        }, [props.forceSort, props.removeDefaultSort])

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

            const col = props.columns.find(c => c.propertyName === fieldName)

            // if sortable is false, we return
            if (col?.isSortable === false) return

            // if we don't have anything to sort by, we shouldn't be here
            if (!sort && !props.removeDefaultSort) {
                return
            }

            // get the sort direction
            let direction: 'asc' | 'desc' = 'asc'
            if (sort) {
                direction = fieldName === sort.fieldName
                    // this is the current sort, so just toggle it
                    ? sort.direction === 'asc' ? 'desc' : 'asc'
                    // get the default sort for the field... this will never be undefined
                    : (defaultSortDirectionMap as DefaultSortDirectionMap)[fieldName]
            }

            const newSort: Sort = {
                direction,
                fieldName,
            }
            setSort(newSort)

            // call the callback to notify parent for sort update
            props.onToggleSort?.(newSort)
        }

        const headerRow: Array<JSX.Element> = displayColumns
            .map((col, index) => {
                const isSortable: boolean = !!col.propertyName && col.isSortable !== false
                const isCurrentlySorted: boolean = isSortable && col.propertyName === sort?.fieldName
                const colorClass: string = isCurrentlySorted ? 'black-100' : 'black-60'
                const sortableClass: string | undefined = isSortable ? styles.sortable : undefined
                const columnId = `column-id-${col.columnId}-`
                const colWidth = colWidthInput?.[columnId]
                return (
                    <th
                        className={classNames(styles.th, columnId)}
                        key={getKey(index)}
                    >
                        <div
                            className={
                                classNames(styles['header-container'], styles[col.type], colorClass, sortableClass)
                            }
                            style={colWidth ? { width: `${colWidth}px` } : {}}
                        >
                            {typeof col.label === 'function' ? col.label() : col.label}
                            {!!col.tooltip && (
                                <div className={styles.tooltip}>
                                    <Tooltip content={col.tooltip} triggerOn='click'>
                                        <IconOutline.InformationCircleIcon className='tooltip-icon' />
                                    </Tooltip>
                                </div>
                            )}
                            {!props.disableSorting && isSortable && (
                                <TableSort
                                    iconClass={colorClass}
                                    isCurrentlySorted={isCurrentlySorted}
                                    propertyName={col.propertyName}
                                    sort={sort}
                                    toggleSort={toggleSort}
                                    removeDefaultSort={props.removeDefaultSort}
                                />
                            )}
                        </div>
                    </th>
                )
            })

        const rowCells: Array<JSX.Element> = sortedData
            .map((sorted, index) => (
                <TableRow
                    key={getKey(index)}
                    data={sorted}
                    allRows={sortedData}
                    onRowClick={props.onRowClick}
                    columns={props.columns}
                    index={index}
                    showExpand={props.showExpand}
                    colWidth={colWidthInput}
                    preventDefault={props.preventDefault}
                />
            ))

        return (
            /* TODO: sticky header */
            <div className={classNames(styles['table-wrap'], props.className)}>
                <table ref={tableRef} className={styles.table}>
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

/**
 * UI for table row.
 */
import { MouseEvent, useMemo, useState } from 'react'
import _ from 'lodash'
import classNames from 'classnames'

import { TableColumn } from '../table-column.model'
import { TableCell } from '../table-cell'

import styles from './TableRow.module.scss'

function getKey(key: string | number): string {
    return `${key}`
}

interface Props<T> {
    className?: string
    data: T
    readonly onRowClick?: (data: T) => void
    readonly columns: ReadonlyArray<TableColumn<T>>
    index: number
    readonly showExpand?: boolean
    readonly preventDefault?: boolean
}

export const TableRow: <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => JSX.Element = <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => {
    const displayColumns = useMemo(() => {
        if (!props.showExpand) {
            return props.columns
        }

        return _.filter(props.columns, item => !item.isExpand)
    }, [props.columns, props.showExpand])
    const [isExpanded, setIsExpanded] = useState(false)
    const expandColumns = useMemo(() => {
        if (!props.showExpand) {
            return props.columns
        }

        return _.filter(props.columns, item => !!item.isExpand)
    }, [props.columns, props.showExpand])
    // get the cells in the row
    const cells: Array<JSX.Element> = displayColumns.map((col, colIndex) => (
        <TableCell
            {...col}
            data={props.data}
            index={props.index}
            key={getKey(`${props.index}${colIndex}`)}
            showExpandIndicator={colIndex === 0 && props.showExpand}
            isExpanded={isExpanded && colIndex === 0}
            onExpand={
                props.showExpand
                    ? function onExpand() {
                        setIsExpanded(!isExpanded)
                    }
                    : undefined
            }
        />
    ))

    return (
        <>
            <tr
                className={classNames(
                    styles.tr,
                    props.onRowClick ? styles.clickable : undefined,
                    {
                        [styles.isEvenRow]: props.index % 2 === 1,
                    },
                )}
                onClick={function onRowClick(
                    event: MouseEvent<HTMLTableRowElement>,
                ): void {
                    if (!props.preventDefault) {
                        event.preventDefault()
                    }
                    props.onRowClick?.(props.data)
                }}
            >
                {cells}
            </tr>
            {isExpanded && props.showExpand && (
                <tr
                    className={classNames(styles.tr, {
                        [styles.isEvenRow]: props.index % 2 === 1,
                    })}
                >
                    <td colSpan={displayColumns.length}>
                        <div className={styles.blockExpandContainer}>
                            {expandColumns.map((col, colIndex) => (
                                <div
                                    key={getKey(`${props.index}${colIndex}`)}
                                    className={styles.blockExpandItem}
                                >
                                    <strong
                                        className={classNames(
                                            styles.blockExpandCell,
                                            styles.blockExpandTitle,
                                            'TableRow_blockExpandTitle',
                                        )}
                                    >
                                        {col.label as string}
                                        :
                                    </strong>
                                    <TableCell
                                        {...col}
                                        data={props.data}
                                        index={props.index}
                                        as='div'
                                        className={classNames(
                                            styles.blockExpandCell,
                                            styles.blockExpandValue,
                                            col.className,
                                            'TableCell_blockExpandValue',
                                        )}
                                    />
                                </div>
                            ))}
                        </div>
                    </td>
                </tr>
            )}
        </>
    )
}

export default TableRow

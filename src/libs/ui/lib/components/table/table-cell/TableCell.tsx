import { MouseEvent } from 'react'
import classNames from 'classnames'

import { textFormatDateLocaleShortString, textFormatMoneyLocaleString } from '~/libs/shared/lib/utils'

import { TableCellType } from '../table-cell.type'

import styles from './TableCell.module.scss'

interface TableCellProps<T> {
    readonly data: T
    readonly index: number
    readonly propertyName?: string
    readonly renderer?: (data: T) => JSX.Element | undefined
    readonly type: TableCellType
}

const TableCell: <T extends { [propertyName: string]: any }>(props: TableCellProps<T>) => JSX.Element
    = <T extends { [propertyName: string]: any }>(props: TableCellProps<T>) => {

        let data: string | JSX.Element | undefined
        const rawDate = props.data[props.propertyName as string]
        switch (props.type) {
            case 'date':
                data = textFormatDateLocaleShortString(new Date(rawDate))
                break

            case 'action':
            case 'element':
            case 'numberElement':
                data = props.renderer?.(props.data)
                break

            case 'money':
                data = textFormatMoneyLocaleString(props.data[props.propertyName as string])
                break

            default:
                data = props.data[props.propertyName as string] as string
                break
        }

        function onClick(event: MouseEvent<HTMLTableCellElement>): void {
            if (props.type !== 'action') {
                return
            }

            // this is an action table cell, so stop propagation
            event.preventDefault()
            event.stopPropagation()
        }

        const classes: string = classNames(
            styles.td,
            styles[props.type],
            !data ? styles.empty : undefined,
        )

        return (
            <td
                className={classes}
                key={`${props.index}-${props.propertyName}`}
            >
                <div
                    className={styles[props.type]}
                    onClick={onClick}
                >
                    {data}
                </div>
            </td>
        )
    }

export default TableCell

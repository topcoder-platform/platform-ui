import { ElementType, MouseEvent } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'
import {
    textFormatDateLocaleShortString,
    textFormatMoneyLocaleString,
} from '~/libs/shared/lib/utils'

import { TableCellType } from '../table-cell.type'

import styles from './TableCell.module.scss'

interface TableCellProps<T> {
    readonly data: T
    readonly index: number
    readonly propertyName?: string
    readonly className?: string
    readonly renderer?: (data: T, allRows?: ReadonlyArray<T>) => JSX.Element | undefined
    readonly type: TableCellType
    readonly onExpand?: () => void
    readonly as?: ElementType
    readonly showExpandIndicator?: boolean
    readonly isExpanded?: boolean
    readonly colSpan?: number
    allRows?: ReadonlyArray<T>
}

const TableCell: <T extends { [propertyName: string]: any }>(
    props: TableCellProps<T>,
) => JSX.Element = <T extends { [propertyName: string]: any }>(
    props: TableCellProps<T>,
) => {
    const ContainerTag = props.as ?? 'td'
    let data: string | JSX.Element | undefined
    const rawDate = props.data[props.propertyName as string]
    switch (props.type) {
        case 'date':
            data = textFormatDateLocaleShortString(new Date(rawDate))
            break
        case 'action':
        case 'element':
        case 'numberElement':
            data = props.renderer?.(props.data, props.allRows)
            break
        case 'money':
            data = textFormatMoneyLocaleString(
                props.data[props.propertyName as string],
            )
            break

        default:
            data = props.data[props.propertyName as string] as string
            break
    }

    function onClick(event: MouseEvent<HTMLTableCellElement>): void {
        if (props.type !== 'action') {
            if (props.onExpand) {
                props.onExpand?.()
            }

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
        props.className,
        'TableCell',
    )

    return (
        <ContainerTag
            className={classes}
            key={`${props.index}-${props.propertyName}`}
            colSpan={props.colSpan}
        >
            <div
                className={classNames(
                    styles.blockCell,
                    styles[props.type],
                    {
                        [styles.clickable]:
                            props.type !== 'action' && !!props.onExpand,
                    },
                    'TableCell_blockCell',
                )}
                onClick={onClick}
            >
                {props.showExpandIndicator && (
                    <IconOutline.ChevronRightIcon
                        width={15}
                        className={classNames(styles.iconExpand, {
                            [styles.isExpaned]: props.isExpanded,
                        })}
                    />
                )}
                {data}
            </div>
        </ContainerTag>
    )
}

export default TableCell

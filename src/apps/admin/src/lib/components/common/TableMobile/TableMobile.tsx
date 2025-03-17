/**
 * Table show on mobile
 */

import { Fragment } from 'react'
import classNames from 'classnames'

import { TableCell } from '~/libs/ui/lib/components/table/table-cell'

import { MobileTableColumn } from '../../../models/MobileTableColumn.model'

import styles from './TableMobile.module.scss'

interface Props<T> {
    readonly columns: ReadonlyArray<MobileTableColumn<T>[]>
    readonly data: ReadonlyArray<T>
    className?: string
}

function getKey(key: (string | number)[]): string {
    return `${key.join('-')}`
}

export const TableMobile: <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => JSX.Element = <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => ( // eslint-disable-next-line react/jsx-indent
        <table className={classNames(styles.container, props.className)}>
            <tbody>
                {props.data.map((itemData, indexData) => (
                    <Fragment key={getKey([indexData])}>
                        {props.columns.map((itemColumns, indexColumns) => (
                            <tr
                                key={getKey([indexData, indexColumns])}
                                className={classNames({
                                    [styles.isEvenRow]: indexData % 2 === 1,
                                    [styles.isOddRow]: indexData % 2 === 0,
                                })}
                            >
                                {itemColumns.map(
                                    (itemItemColumns, indexItemColumns) => (
                                        <TableCell
                                            {...itemItemColumns}
                                            data={itemData}
                                            index={indexData}
                                            key={getKey([
                                                indexData,
                                                indexColumns,
                                                indexItemColumns,
                                            ])}
                                            className={classNames(
                                                itemItemColumns.className,
                                                {
                                                    [styles.right]:
                                                        indexItemColumns
                                                        === itemColumns.length - 1,
                                                    [styles.top]:
                                                        indexColumns === 0,
                                                    [styles.topLeft]:
                                                        indexColumns === 0
                                                        && indexItemColumns === 0,
                                                    [styles.topRight]:
                                                        indexColumns === 0
                                                        && indexItemColumns
                                                        === itemColumns.length - 1,
                                                    [styles.bottom]:
                                                        indexColumns
                                                        === props.columns.length - 1,
                                                    [styles.bottomLeft]:
                                                        indexColumns
                                                        === props.columns.length
                                                        - 1
                                                        && indexItemColumns === 0,
                                                    [styles.bottomRight]:
                                                        indexColumns
                                                        === props.columns.length - 1
                                                        && indexItemColumns
                                                        === itemColumns.length - 1,
                                                    [styles.blockCellLabel]:
                                                        itemItemColumns.mobileType
                                                        === 'label',
                                                    [styles.blockCellLastValue]:
                                                        itemItemColumns.mobileType
                                                        === 'last-value',
                                                },
                                                styles.blockCell,
                                            )}
                                        />
                                    ),
                                )}
                            </tr>
                        ))}
                    </Fragment>
                ))}
            </tbody>
        </table>
    )

export default TableMobile

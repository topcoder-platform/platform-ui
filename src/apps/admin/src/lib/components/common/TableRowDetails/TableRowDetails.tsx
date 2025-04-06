/**
 * UI for one row of table
 */
import classNames from 'classnames'

import { TableCell } from '~/libs/ui/lib/components/table/table-cell'

import { DetailsTableColumn } from '../../../models/DetailsTableColumn.model'

import styles from './TableRowDetails.module.scss'

interface Props<T> {
    readonly columns: ReadonlyArray<DetailsTableColumn<T>[]>
    readonly data: T
    className?: string
}

function getKey(key: (string | number)[]): string {
    return `${key.join('-')}`
}

export const TableRowDetails: <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => JSX.Element = <T extends { [propertyName: string]: any }>(
    props: Props<T>,
) => ( // eslint-disable-next-line react/jsx-indent
        <div className={classNames(styles.container, props.className)}>
            <table className={styles.table}>
                <tbody>
                    {props.columns.map((itemColumns, indexColumns) => (
                        <tr key={getKey([indexColumns])} className={classNames({})}>
                            {itemColumns.map(
                                (itemItemColumns, indexItemColumns) => (
                                    <TableCell
                                        {...itemItemColumns}
                                        data={props.data}
                                        index={0}
                                        key={getKey([
                                            indexColumns,
                                            indexItemColumns,
                                        ])}
                                        className={classNames(
                                            itemItemColumns.className,
                                            {
                                                [styles.right]:
                                                    indexItemColumns
                                                    === itemColumns.length - 1,
                                                [styles.top]: indexColumns === 0,
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
                                                    === props.columns.length - 1
                                                        && indexItemColumns === 0,
                                                [styles.bottomRight]:
                                                    indexColumns
                                                    === props.columns.length - 1
                                                        && indexItemColumns
                                                    === itemColumns.length - 1,
                                                [styles.blockCellLabel]:
                                                    itemItemColumns.detailType
                                                    === 'label',
                                            },
                                            styles.blockCell,
                                        )}
                                    />
                                ),
                            )}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )

export default TableRowDetails

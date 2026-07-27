/* eslint-disable react/function-component-definition, react/jsx-no-bind */
/**
 * Responsive desktop table and mobile card renderer for operational data.
 */
import { ReactNode } from 'react'
import classNames from 'classnames'

import { StatusSeverity } from '../../models'

import styles from './StatusTable.module.scss'

export interface StatusColumn<T> {
    id: string
    label: string
    render: (row: T) => ReactNode
    mobileLabel?: string
    className?: string
}

export interface StatusTableProps<T> {
    caption: string
    columns: StatusColumn<T>[]
    rows: readonly T[]
    getKey: (row: T) => string
    getSeverity?: (row: T) => StatusSeverity
    getRowLabel?: (row: T) => string
    onRowClick?: (row: T) => void
    expandedRow?: (row: T) => ReactNode
}

/**
 * Renders all important fields in both desktop and mobile representations.
 * Critical and warning rows carry accessible labels in addition to color.
 *
 * @param props columns, rows, keys, severity, and optional row interaction.
 * @returns responsive read-only data table.
 * @throws Does not throw.
 */
export function StatusTable<T>(props: StatusTableProps<T>): JSX.Element {
    return (
        <div className={styles.wrapper}>
            <div className={styles.desktop}>
                <table>
                    <caption className={styles.srOnly}>{props.caption}</caption>
                    <thead>
                        <tr>
                            {props.columns.map(column => (
                                <th className={column.className} key={column.id} scope='col'>
                                    {column.label}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    {props.rows.map(row => {
                        const key = props.getKey(row)
                        const severity = props.getSeverity?.(row)
                        const clickable = Boolean(props.onRowClick)
                        const content = (
                            <tr
                                aria-label={props.getRowLabel?.(row)}
                                className={classNames(
                                    severity && styles[severity],
                                    clickable && styles.clickable,
                                )}
                                onClick={clickable ? () => props.onRowClick?.(row) : undefined}
                                onKeyDown={clickable ? event => {
                                    if (event.key === 'Enter' || event.key === ' ') {
                                        event.preventDefault()
                                        props.onRowClick?.(row)
                                    }
                                } : undefined}
                                tabIndex={clickable ? 0 : undefined}
                            >
                                {props.columns.map(column => (
                                    <td className={column.className} key={column.id}>
                                        {column.render(row)}
                                    </td>
                                ))}
                            </tr>
                        )
                        return (
                            <tbody className={styles.rowGroup} key={key}>
                                {content}
                            </tbody>
                        )
                    })}
                </table>
            </div>
            <div className={styles.mobile}>
                {props.rows.map(row => {
                    const severity = props.getSeverity?.(row)
                    return (
                        <article
                            aria-label={props.getRowLabel?.(row)}
                            className={classNames(styles.card, severity && styles[severity])}
                            key={props.getKey(row)}
                        >
                            {props.columns.map(column => (
                                <div className={styles.cardField} key={column.id}>
                                    <strong>{column.mobileLabel || column.label}</strong>
                                    <div>{column.render(row)}</div>
                                </div>
                            ))}
                            {props.onRowClick && (
                                <button onClick={() => props.onRowClick?.(row)} type='button'>
                                    View details
                                </button>
                            )}
                        </article>
                    )
                })}
            </div>
            {props.expandedRow && (
                <div className={styles.expandedArea}>
                    {props.rows.map(row => {
                        const expandedContent = props.expandedRow?.(row)
                        return expandedContent
                            ? <div key={props.getKey(row)}>{expandedContent}</div>
                            : undefined
                    })}
                </div>
            )}
        </div>
    )
}

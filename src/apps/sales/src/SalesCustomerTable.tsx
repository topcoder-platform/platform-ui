/* The horizontally scrolling table region must be focusable for keyboard scrolling. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FC, useCallback, useId, useState } from 'react'

import { MonthlySalesChart } from './sales-dashboard.service'
import { salesChartTotal, salesChartValue, salesMonthLabel } from './sales-dashboard.utils'
import styles from './SalesDashboardsPage.module.scss'

/**
 * Shows five customer rows initially, expandable to the full fiscal-year customer matrix.
 * @param props Complete customer dataset, report title and source notices; no top-five/Other grouping.
 * @returns A scrollable matrix with full-data totals, Annual before the months and an accessible expand control.
 * @throws Does not throw for empty datasets. Unknown amounts stay distinct from zero.
 */
const SalesCustomerTable: FC<{ data: MonthlySalesChart; title: string; notices?: string[] }> = props => {
    const data = props.data
    const [expanded, setExpanded] = useState(false)
    const toggle = useCallback(() => setExpanded(value => !value), [])
    const tableId = useId()
    const visible = expanded ? data.series : data.series.slice(0, 5)
    const monthlyTotals = data.months.map(month => salesChartTotal(data.series.map(series => month.values[series.key])))
    return (
        <article className={`${styles.card} ${styles.customerTable}`}>
            <h3>{props.title}</h3>
            {props.notices?.map(notice => <p key={notice} role='status'>{notice}</p>)}
            {data.series.length ? (
                <div
                    className={styles.tableScroll}
                    role='region'
                    aria-label={props.title}
                    tabIndex={0}
                >
                    <table id={tableId}>
                        <caption>{`${props.title} (USD)`}</caption>
                        <thead>
                            <tr>
                                <th scope='col'>Customer</th>
                                <th scope='col'>Annual</th>
                                {data.months.map(month => (
                                    <th key={month.month} scope='col'>{salesMonthLabel(month.month)}</th>
                                ))}
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.annual}>
                                <th scope='row'>Total</th>
                                <td>{salesChartValue(salesChartTotal(monthlyTotals), 'currency')}</td>
                                {data.months.map((month, index) => (
                                    <td key={month.month}>{salesChartValue(monthlyTotals[index], 'currency')}</td>
                                ))}
                            </tr>
                            {visible.map(series => (
                                <tr key={series.key}>
                                    <th scope='row'>{series.label}</th>
                                    <td>
                                        {salesChartValue(salesChartTotal(data.months.map(month => (
                                            month.values[series.key]
                                        ))), 'currency')}
                                    </td>
                                    {data.months.map(month => (
                                        <td key={month.month}>
                                            {salesChartValue(month.values[series.key], 'currency')}
                                        </td>
                                    ))}
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p>No customer data in this fiscal year.</p>}
            {data.series.length > 5 && (
                <button
                    type='button'
                    className={styles.tableToggle}
                    aria-expanded={expanded}
                    aria-controls={tableId}
                    onClick={toggle}
                >
                    {expanded ? 'Show fewer customers' : `Show all ${data.series.length} customers`}
                </button>
            )}
        </article>
    )
}

export default SalesCustomerTable

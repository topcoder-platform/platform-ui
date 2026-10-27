/* The horizontally scrolling table region must be focusable for keyboard scrolling. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FC } from 'react'

import { MonthlySalesChart } from './sales-dashboard.service'
import { salesChartTotal, salesChartValue, salesMonthLabel } from './sales-dashboard.utils'
import styles from './SalesDashboardsPage.module.scss'

/**
 * Shows all customers as rows and fiscal-year months as columns in the bottom Customer section.
 * @param props Complete customer dataset, report title and source notices; no top-five/Other grouping.
 * @returns An accessible scrollable matrix with totals directly below the month headers, or an empty state.
 * @throws Does not throw for empty datasets. Unknown amounts stay distinct from zero.
 */
const SalesCustomerTable: FC<{ data: MonthlySalesChart; title: string; notices?: string[] }> = props => {
    const data = props.data
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
                    <table>
                        <caption>{`${props.title} (USD)`}</caption>
                        <thead>
                            <tr>
                                <th scope='col'>Customer</th>
                                {data.months.map(month => (
                                    <th key={month.month} scope='col'>{salesMonthLabel(month.month)}</th>
                                ))}
                                <th scope='col'>Annual</th>
                            </tr>
                        </thead>
                        <tbody>
                            <tr className={styles.annual}>
                                <th scope='row'>Total</th>
                                {data.months.map((month, index) => (
                                    <td key={month.month}>{salesChartValue(monthlyTotals[index], 'currency')}</td>
                                ))}
                                <td>{salesChartValue(salesChartTotal(monthlyTotals), 'currency')}</td>
                            </tr>
                            {data.series.map(series => (
                                <tr key={series.key}>
                                    <th scope='row'>{series.label}</th>
                                    {data.months.map(month => (
                                        <td key={month.month}>
                                            {salesChartValue(month.values[series.key], 'currency')}
                                        </td>
                                    ))}
                                    <td>
                                        {salesChartValue(salesChartTotal(data.months.map(month => (
                                            month.values[series.key]
                                        ))), 'currency')}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            ) : <p>No customer data in this fiscal year.</p>}
        </article>
    )
}

export default SalesCustomerTable

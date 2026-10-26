/* The horizontally scrolling table region must be focusable for keyboard scrolling. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FC } from 'react'

import { MonthlySalesChart } from './sales-dashboard.service'
import { salesChartTotal, salesChartValue, salesMonthLabel } from './sales-dashboard.utils'
import styles from './SalesDashboardsPage.module.scss'

/**
 * Shows all customers as rows and fiscal-year months as columns below the payment charts.
 * @param props Ungrouped customer-payment dataset returned by the API, before top-five ranking.
 * @returns An accessible scrollable matrix with customer, month and grand totals, or an empty state.
 * @throws Does not throw for empty datasets. Unknown amounts stay distinct from zero.
 */
const SalesCustomerPaymentsTable: FC<{ data: MonthlySalesChart }> = props => {
    const data = props.data
    const monthlyTotals = data.months.map(month => salesChartTotal(data.series.map(series => month.values[series.key])))
    return (
        <article className={`${styles.card} ${styles.customerPayments}`}>
            <h3>Monthly member payments by customer</h3>
            {data.series.length ? (
                <div
                    className={styles.tableScroll}
                    role='region'
                    aria-label='Monthly member payments by customer'
                    tabIndex={0}
                >
                    <table>
                        <caption>All customers, monthly payments and totals (USD)</caption>
                        <thead>
                            <tr>
                                <th scope='col'>Customer</th>
                                {data.months.map(month => (
                                    <th key={month.month} scope='col'>{salesMonthLabel(month.month)}</th>
                                ))}
                                <th scope='col'>Total</th>
                            </tr>
                        </thead>
                        <tbody>
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
                        <tfoot>
                            <tr>
                                <th scope='row'>Total</th>
                                {data.months.map((month, index) => (
                                    <td key={month.month}>{salesChartValue(monthlyTotals[index], 'currency')}</td>
                                ))}
                                <td>{salesChartValue(salesChartTotal(monthlyTotals), 'currency')}</td>
                            </tr>
                        </tfoot>
                    </table>
                </div>
            ) : <p>No customer payments in this fiscal year.</p>}
        </article>
    )
}

export default SalesCustomerPaymentsTable

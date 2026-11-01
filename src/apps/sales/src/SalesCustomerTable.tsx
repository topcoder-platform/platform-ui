/* The horizontally scrolling table region must be focusable for keyboard scrolling. */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FC, useCallback, useId, useState } from 'react'

import { MonthlySalesChart, SalesDashboardPeriod } from './sales-dashboard.service'
import { salesPeriodChart } from './sales-dashboard.utils'
import SalesDashboardTable from './SalesDashboardTable'
import styles from './SalesDashboardsPage.module.scss'

/**
 * Shows five customer rows initially, expandable to the full fiscal-year customer matrix.
 * @param props Complete customer dataset, report title and source notices; no top-five/Other grouping.
 * @returns A scrollable matrix with full-data totals, Annual before the months and an accessible expand control.
 * @throws Does not throw for empty datasets. Unknown amounts stay distinct from zero.
 */
const SalesCustomerTable: FC<{
    data: MonthlySalesChart; title: string; notices?: string[]; period?: SalesDashboardPeriod
}> = props => {
    const data = salesPeriodChart(props.data, props.period ?? 'Monthly')
    const [expanded, setExpanded] = useState(false)
    const toggle = useCallback(() => setExpanded(value => !value), [])
    const tableId = useId()
    return (
        <article className={`${styles.card} ${styles.customerTable}`}>
            <h3>{props.title}</h3>
            {props.notices?.map(notice => <p key={notice} role='status'>{notice}</p>)}
            {data.series.length ? (
                <SalesDashboardTable
                    chart={data}
                    period={props.period}
                    caption={`${props.title} (USD)`}
                    firstColumn='Customer'
                    limit={expanded ? undefined : 5}
                    id={tableId}
                    showTotal
                />
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

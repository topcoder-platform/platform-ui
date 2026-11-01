/* Sort controls select their own column; the scrolling region supports keyboard navigation. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true }] */
/* eslint-disable jsx-a11y/no-noninteractive-tabindex */
import { FC, useState } from 'react'

import { MonthlySalesChart, SalesDashboardPeriod } from './sales-dashboard.service'
import { salesAnnualValue, salesChartTotal, salesChartValue, salesPeriodLabel } from './sales-dashboard.utils'
import styles from './SalesDashboardsPage.module.scss'

/** A shared category-by-period matrix; sort the full dataset before limiting visible customer rows. */
const SalesDashboardTable: FC<{
    chart: MonthlySalesChart; period?: SalesDashboardPeriod; caption: string; firstColumn?: string
    limit?: number; id?: string; showTotal?: boolean
}> = props => {
    const chart = props.chart
    const [sort, setSort] = useState({ ascending: true, column: 'label' })
    const columns = [
        { key: 'label', label: props.firstColumn ?? 'Field' },
        { key: 'annual', label: 'Annual' },
        ...chart.months.map(month => ({
            key: month.month, label: salesPeriodLabel(month.month, props.period ?? 'Monthly'),
        })),
    ]
    const active = columns.some(column => column.key === sort.column) ? sort : { ascending: true, column: 'label' }
    const value = (key: string): number | null | undefined => (active.column === 'annual'
        ? salesAnnualValue(chart, key) : chart.months.find(month => month.month === active.column)?.values[key])
    const sorted = [...chart.series].sort((a, b) => {
        const alphabetical = a.label.localeCompare(b.label, 'en', { numeric: true, sensitivity: 'base' })
        if (active.column === 'label') return active.ascending ? alphabetical : -alphabetical
        const left = value(a.key)
        const right = value(b.key)
        // Unknown values stay last in either direction, rather than being treated as zero.
        if (typeof left !== 'number' || typeof right !== 'number') {
            return typeof left !== 'number' && typeof right !== 'number'
                ? alphabetical : typeof left !== 'number' ? 1 : -1
        }

        return (active.ascending ? left - right : right - left) || alphabetical
    })
    const visible = props.limit === undefined ? sorted : sorted.slice(0, props.limit)
    const totals = chart.months.map(month => salesChartTotal(chart.series.map(series => month.values[series.key])))
    return (
        <div className={styles.tableScroll} role='region' aria-label={props.caption} tabIndex={0}>
            <table id={props.id}>
                <caption>{props.caption}</caption>
                <thead>
                    <tr>
                        {columns.map(column => (
                            <th
                                key={column.key}
                                scope='col'
                                aria-sort={active.column === column.key
                                    ? active.ascending ? 'ascending' : 'descending' : 'none'}
                            >
                                <button
                                    className={styles.sortButton}
                                    type='button'
                                    onClick={() => setSort({
                                        ascending: active.column === column.key ? !active.ascending : true,
                                        column: column.key,
                                    })}
                                >
                                    {column.label}
                                    <span aria-hidden='true'>
                                        {active.column === column.key ? active.ascending ? ' ↑' : ' ↓' : ' ↕'}
                                    </span>
                                </button>
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {chart.unit === 'currency' && (props.showTotal || chart.series.length > 1) && (
                        <tr className={styles.annual}>
                            <th scope='row'>Total</th>
                            <td>{salesChartValue(salesChartTotal(totals), chart.unit)}</td>
                            {chart.months.map((month, index) => (
                                <td key={month.month}>{salesChartValue(totals[index], chart.unit)}</td>
                            ))}
                        </tr>
                    )}
                    {visible.map(series => (
                        <tr key={series.key}>
                            <th scope='row'>{series.label}</th>
                            <td>{salesChartValue(salesAnnualValue(chart, series.key), chart.unit)}</td>
                            {chart.months.map(month => (
                                <td key={month.month}>{salesChartValue(month.values[series.key], chart.unit)}</td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    )
}

export default SalesDashboardTable

import { ChangeEvent, FC, MouseEvent, useState } from 'react'
import useSWR from 'swr'

import { EnvironmentConfig } from '~/config'

import { Column, Report, ReportRow } from './reports'
import { fetchStatistics, formatValue, reportOptions } from './statistics.service'
import styles from './StatisticsPage.module.scss'

interface Props { report: Report }
interface Sort { field: string; ascending: boolean }

/** Sortable public report with bounded rendering, filtering, and retryable errors. */
const ReportTable: FC<Props> = (props: Props) => {
    const report = props.report
    const result = useSWR(report.path, fetchStatistics, reportOptions)
    const [sort, setSort] = useState<Sort>()
    const [search, setSearch] = useState('')
    const [limit, setLimit] = useState(25)
    const rows = (result.data || []).filter(row => report.columns.some(column => (
        String(row[column.field] ?? '')
            .toLowerCase()
            .includes(search.toLowerCase())
    )))
    if (sort) {
        rows.sort((a: ReportRow, b: ReportRow) => {
            const comparison = String(a[sort.field] ?? '')
                .localeCompare(String(b[sort.field] ?? ''), 'en', { numeric: true })
            return sort.ascending ? comparison : -comparison
        })
    }

    function retry(): void { result.mutate() }
    function showMore(): void { setLimit(limit + 25) }
    function filter(event: ChangeEvent<HTMLInputElement>): void {
        setSearch(event.target.value)
        setLimit(25)
    }

    function sortColumn(event: MouseEvent<HTMLButtonElement>): void {
        const field = event.currentTarget.dataset.field || ''
        setSort({ ascending: sort?.field === field ? !sort.ascending : false, field })
    }

    function sortDirection(column: Column): 'ascending' | 'descending' | 'none' {
        return sort?.field === column.field ? (sort.ascending ? 'ascending' : 'descending') : 'none'
    }

    const headingId = report.path.replace(/\//g, '-')
    return (
        <section className={styles.report} aria-labelledby={headingId}>
            <h2 id={headingId}>{report.title}</h2>
            {result.error && (
                <div role='alert'>
                    Statistics could not be loaded.
                    {' '}
                    <button type='button' onClick={retry}>Retry</button>
                </div>
            )}
            {!result.data && !result.error && <p role='status'>Loading statistics…</p>}
            {result.data && !result.error && (
                <>
                    <label className={styles.search}>
                        <span>{`Filter ${report.title.toLowerCase()}`}</span>
                        <input value={search} onChange={filter} type='search' />
                    </label>
                    {!rows.length ? (
                        <p role='status'>
                            {result.data.length ? 'No matching results.' : 'No statistics available yet.'}
                        </p>
                    ) : (
                        <>
                            <div className={styles.tableScroll}>
                                <table>
                                    <thead>
                                        <tr>
                                            <th scope='col'>Rank</th>
                                            {report.columns.map(column => (
                                                <th key={column.field} scope='col' aria-sort={sortDirection(column)}>
                                                    <button
                                                        type='button'
                                                        data-field={column.field}
                                                        onClick={sortColumn}
                                                    >
                                                        {column.label}
                                                        <span aria-hidden> ↕</span>
                                                    </button>
                                                </th>
                                            ))}
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {rows.slice(0, limit)
                                            .map(row => (
                                                <tr key={(result.data || []).indexOf(row)}>
                                                    <td>{row.rank ?? ((result.data || []).indexOf(row) + 1)}</td>
                                                    {report.columns.map(column => (
                                                        <td key={column.field}>
                                                            {column.member && row[column.field] ? (
                                                                <a href={`${EnvironmentConfig.USER_PROFILE_URL}/${
                                                                    encodeURIComponent(String(row[column.field]))}`}
                                                                >
                                                                    {formatValue(row[column.field], true)}
                                                                </a>
                                                            ) : formatValue(row[column.field])}
                                                        </td>
                                                    ))}
                                                </tr>
                                            ))}
                                    </tbody>
                                </table>
                            </div>
                            <div className={styles.pagination}>
                                <span>{`${Math.min(limit, rows.length)} of ${rows.length} results`}</span>
                                {limit < rows.length && <button type='button' onClick={showMore}>Show more</button>}
                            </div>
                        </>
                    )}
                </>
            )}
        </section>
    )
}

export default ReportTable

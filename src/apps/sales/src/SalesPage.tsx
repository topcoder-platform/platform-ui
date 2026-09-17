/* Handlers capture the active report column or control value. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
/* The horizontal report viewport must be focusable for keyboard scrolling. */
/* eslint jsx-a11y/no-noninteractive-tabindex: ["error", { "roles": ["region"] }] */
import { FC, FormEvent, useCallback, useEffect, useRef, useState } from 'react'

import { Button, IconOutline, LoadingSpinner, PageTitle } from '~/libs/ui'

import { SalesQuery, SalesReport } from './sales.models'
import { fetchSalesReport, salesErrorMessage } from './sales.service'
import styles from './SalesPage.module.scss'
import './sales.scss'

const initialQuery: SalesQuery = { page: 1, perPage: 25 }
const filterDebounceMs = 400

/**
 * Merges search and column filter controls into the report query.
 * @param current Active report query.
 * @param search Raw search input.
 * @param filterColumn Selected filter column ID.
 * @param filterValue Raw column filter input.
 * @returns The current query when nothing changed, otherwise a new query reset to page one. Does not throw.
 */
function withFilters(current: SalesQuery, search: string, filterColumn: string, filterValue: string): SalesQuery {
    const value = filterValue.trim()
    const next = {
        filterColumn: filterColumn && value ? filterColumn : undefined,
        filterValue: filterColumn && value ? value : undefined,
        search: search.trim() || undefined,
    }
    if (
        next.search === (current.search || undefined)
        && next.filterColumn === current.filterColumn
        && next.filterValue === current.filterValue
    ) {
        return current
    }

    return { ...current, ...next, page: 1 }
}

/**
 * Read-only Sales workspace, used on the dedicated host and inside Work.
 * @returns An accessible metadata-driven report with server-side view controls and live refresh.
 * @throws Does not throw request failures; shows inline recovery and stale-data status.
 */
const SalesPage: FC = () => {
    const [query, setQuery] = useState<SalesQuery>(initialQuery)
    const [search, setSearch] = useState('')
    const [filterColumn, setFilterColumn] = useState('')
    const [filterValue, setFilterValue] = useState('')
    const [report, setReport] = useState<SalesReport>()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshVersion, setRefreshVersion] = useState(0)
    const forceRefresh = useRef(false)
    const busy = useRef(false)

    /**
     * Schedules a manual server refresh without resetting active filters or sorting.
     * @returns Nothing; increments the request version. Does not throw.
     */
    const refresh = useCallback((): void => {
        if (busy.current) return
        forceRefresh.current = true
        setRefreshVersion(value => value + 1)
    }, [])

    useEffect(() => {
        const controller = new AbortController()
        const shouldRefresh = forceRefresh.current
        forceRefresh.current = false
        busy.current = true
        setLoading(true)
        setError('')
        fetchSalesReport({ ...query, refresh: shouldRefresh }, controller.signal)
            .then(result => {
                if (!controller.signal.aborted) setReport(result)
            })
            .catch(failure => {
                if (controller.signal.aborted) return
                const status = failure?.response?.status
                // Do not retain protected data if the session or role is no longer valid.
                if (status === 401 || status === 403) setReport(undefined)
                setError(salesErrorMessage(failure))
            })
            .finally(() => {
                if (!controller.signal.aborted) {
                    busy.current = false
                    setLoading(false)
                }
            })
        return () => {
            controller.abort()
            busy.current = false
        }
    }, [query, refreshVersion])

    useEffect(() => {
        /** Refreshes a visible, idle page on the timer or on return to the tab; returns void and does not throw. */
        function refreshVisible(): void {
            if (document.visibilityState !== 'visible' || busy.current) return
            refresh()
        }

        const timer = window.setInterval(refreshVisible, Math.max(60, report?.refreshAfterSeconds ?? 60) * 1000)
        document.addEventListener('visibilitychange', refreshVisible)
        return () => {
            window.clearInterval(timer)
            document.removeEventListener('visibilitychange', refreshVisible)
        }
    }, [refresh, report?.refreshAfterSeconds])

    useEffect(() => {
        const timer = window.setTimeout(() => {
            setQuery(current => withFilters(current, search, filterColumn, filterValue))
        }, filterDebounceMs)
        return () => window.clearTimeout(timer)
    }, [search, filterColumn, filterValue])

    /** @param event Filter form submission. @returns Nothing; applies pending controls immediately. Does not throw. */
    function applyFilters(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        setQuery(current => withFilters(current, search, filterColumn, filterValue))
    }

    /** Clears filters and sorting after a schema change or empty search; returns void and does not throw. */
    function clearFilters(): void {
        setSearch('')
        setFilterColumn('')
        setFilterValue('')
        setQuery({ ...initialQuery, perPage: query.perPage })
    }

    /** @param id Report column ID. @returns Nothing; toggles global sorting and resets pagination. Does not throw. */
    function sortBy(id: string): void {
        setQuery(current => ({
            ...current,
            page: 1,
            sortBy: id,
            sortOrder: current.sortBy === id && current.sortOrder === 'asc' ? 'desc' : 'asc',
        }))
    }

    const firstRow = report?.total ? (report.page - 1) * report.perPage + 1 : 0
    const lastRow = report ? Math.min(report.page * report.perPage, report.total) : 0
    const updatedAt = report ? new Date(report.refreshedAt)
        .toLocaleString() : ''

    return (
        <div className={`sales-app ${styles.page}`}>
            <PageTitle>Sales</PageTitle>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>WORK / SALES</p>
                    <h1>Sales</h1>
                    <p className={styles.subtitle}>Your sales pipeline, directly from Salesforce.</p>
                </div>
                <div className={styles.headerActions}>
                    <span className={styles.readOnly}>Read only</span>
                    <Button
                        className={styles.refresh}
                        disabled={loading}
                        icon={IconOutline.RefreshIcon}
                        iconToLeft
                        noCaps
                        onClick={refresh}
                        primary
                    >
                        {loading && report ? 'Refreshing…' : 'Refresh'}
                    </Button>
                </div>
            </header>

            <div className={styles.status} aria-live='polite' role='status'>
                <span>
                    {report ? `Last updated ${updatedAt}` : 'Connecting to Salesforce'}
                </span>
                <span>Refreshes every minute while this page is visible</span>
            </div>

            {error && (
                <div className={styles.error} role='alert'>
                    <div>
                        <strong>{report ? 'Showing previously loaded data' : 'Unable to load sales data'}</strong>
                        <p>{error}</p>
                    </div>
                    <Button disabled={loading} noCaps onClick={refresh} secondary>Try again</Button>
                </div>
            )}

            {report && !report.allData && (
                <div className={styles.warning} role='status'>
                    Salesforce returned a limited set of records. Search, filters and totals apply to the
                    {' '}
                    {report.sourceRowCount.toLocaleString()}
                    {' '}
                    received records. Refine the source report in Salesforce to view a complete result.
                </div>
            )}

            <section className={styles.panel} aria-label='Sales report'>
                <div className={styles.panelHeader}>
                    <div>
                        <h2>{report?.reportName || 'Sales report'}</h2>
                        <p>Salesforce is the source of truth. Changes are made there.</p>
                    </div>
                    {report && (
                        <span className={styles.count}>
                            {report.total.toLocaleString()}
                            {' '}
                            records
                        </span>
                    )}
                </div>

                <form className={styles.filters} onSubmit={applyFilters}>
                    <div className={styles.filterField}>
                        <label htmlFor='sales-search'>Search sales</label>
                        <input
                            id='sales-search'
                            maxLength={200}
                            name='sales-search'
                            onChange={event => setSearch(event.target.value)}
                            placeholder='Search all report fields'
                            spellCheck={false}
                            type='text'
                            value={search}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor='sales-filter-column'>Filter field</label>
                        <select
                            id='sales-filter-column'
                            onChange={event => setFilterColumn(event.target.value)}
                            value={filterColumn}
                        >
                            <option value=''>Choose a field</option>
                            {report?.columns.map(column => (
                                <option key={column.id} value={column.id}>{column.label}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor='sales-filter-value'>Contains</label>
                        <input
                            disabled={!filterColumn}
                            id='sales-filter-value'
                            maxLength={200}
                            name='sales-filter-value'
                            onChange={event => setFilterValue(event.target.value)}
                            placeholder='Filter value'
                            spellCheck={false}
                            type='text'
                            value={filterValue}
                        />
                    </div>
                    <div className={styles.filterActions}>
                        <Button noCaps onClick={clearFilters} link>Clear</Button>
                    </div>
                </form>

                {loading && !report && (
                    <div className={styles.empty}><LoadingSpinner message='Loading sales report…' /></div>
                )}
                {report && (
                    <>
                        <div
                            aria-busy={loading}
                            aria-label='Sales records, scroll horizontally for more columns'
                            className={styles.tableScroll}
                            role='region'
                            tabIndex={0}
                        >
                            <table className={styles.table}>
                                <caption className={styles.visuallyHidden}>{report.reportName}</caption>
                                <thead>
                                    <tr>
                                        {report.columns.map(column => (
                                            <th
                                                aria-sort={query.sortBy === column.id
                                                    ? query.sortOrder === 'asc' ? 'ascending' : 'descending'
                                                    : 'none'}
                                                key={column.id}
                                                scope='col'
                                            >
                                                <button
                                                    disabled={loading}
                                                    onClick={() => sortBy(column.id)}
                                                    type='button'
                                                >
                                                    {column.label}
                                                    <span aria-hidden='true'>
                                                        {query.sortBy === column.id
                                                            ? query.sortOrder === 'asc' ? ' ↑' : ' ↓'
                                                            : ' ↕'}
                                                    </span>
                                                </button>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {report.rows.map(row => (
                                        <tr key={row.id}>
                                            {row.cells.map((cell, index) => (
                                                <td key={report.columns[index].id}>
                                                    {cell.label || '—'}
                                                </td>
                                            ))}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {report.total === 0 && (
                            <div className={styles.empty}>
                                <h3>No sales records found</h3>
                                <p>
                                    {query.search || query.filterValue
                                        ? 'Try a different search or clear the filters.'
                                        : 'The Salesforce report does not contain any records yet.'}
                                </p>
                            </div>
                        )}
                        <div className={styles.pagination}>
                            <p aria-live='polite'>
                                {`Showing ${firstRow}–${lastRow} of ${report.total.toLocaleString()} records`}
                            </p>
                            <div className={styles.pageControls}>
                                <label htmlFor='sales-page-size'>Rows per page</label>
                                <select
                                    disabled={loading}
                                    id='sales-page-size'
                                    onChange={event => setQuery(current => ({
                                        ...current, page: 1, perPage: Number(event.target.value),
                                    }))}
                                    value={query.perPage}
                                >
                                    {[25, 50, 100, 200].map(size => <option key={size} value={size}>{size}</option>)}
                                </select>
                                <Button
                                    disabled={loading || report.page <= 1}
                                    noCaps
                                    onClick={() => setQuery(current => ({ ...current, page: report.page - 1 }))}
                                    secondary
                                >
                                    Previous
                                </Button>
                                <span>{`Page ${report.page} of ${Math.max(1, report.totalPages)}`}</span>
                                <Button
                                    disabled={loading || report.page >= report.totalPages}
                                    noCaps
                                    onClick={() => setQuery(current => ({ ...current, page: report.page + 1 }))}
                                    secondary
                                >
                                    Next
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </section>
        </div>
    )
}

export default SalesPage

/* Handlers capture the active report column or control value. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
/* The horizontal report viewport must be focusable for keyboard scrolling. */
/* eslint jsx-a11y/no-noninteractive-tabindex: ["error", { "roles": ["region"] }] */
import { FC, FormEvent, useCallback, useEffect, useMemo, useRef, useState } from 'react'

import { Button, IconOutline, LoadingSpinner, PageTitle } from '~/libs/ui'

import { OpportunityModal } from './OpportunityModal'
import { SalesQuery, SalesReport, SalesSummaryAmount, toOpportunityId } from './sales.models'
import { fetchSalesReport, salesErrorMessage } from './sales.service'
import {
    amountTotal,
    dateColumns,
    dateRangeError,
    defaultDateColumn,
    displayedColumns,
    expectedRevenueTotal,
    formatSummaryAmount,
    stageBreakdown,
    withDateRange,
    withDrilldown,
    wonSowSignedTotal,
} from './sales.utils'
import styles from './SalesPage.module.scss'
import './sales.scss'

const initialQuery: SalesQuery = { page: 1, perPage: 25 }
const filterDebounceMs = 400
/** Column types whose cells read as compact, right-aligned figures. */
const numericTypes = ['currency', 'double', 'int', 'percent']
/** Column types whose cells must not wrap, so a date never costs two lines. */
const dateTypes = ['date', 'datetime']

interface SelectedOpportunity {
    id: string
    name: string
}

/** The stage a tile click drills the table into, identified by its column and exact label. */
interface SelectedStage {
    columnId: string
    label: string
}

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
 * Renders one summary statistic card, keeping a missing column visible as an explicit dash.
 * @param props Card label and the total it reports, which is undefined when the report omits the column.
 * @returns The card, always in the same position so the four read as a fixed row.
 * @throws Does not throw.
 */
const SummaryCard: FC<{ amount?: SalesSummaryAmount; label: string; value?: string }> = props => (
    <div className={styles.metric}>
        <p className={styles.metricLabel}>{props.label}</p>
        <p className={styles.metricValue}>
            {props.value ?? (props.amount ? formatSummaryAmount(props.amount) : '—')}
        </p>
        {props.amount?.mixedCurrency && <p className={styles.metricNote}>Totals mix currencies.</p>}
    </div>
)

/**
 * Read-only Sales workspace, used on the dedicated host and inside Work.
 * @returns An executive dashboard: four snapshot-wide summary cards, a clickable stage
 * breakdown beside the Created/Close date range filter, and a compact report table with
 * server-side view controls and manual refresh.
 * @throws Does not throw request failures; shows inline recovery and stale-data status.
 */
const SalesPage: FC = () => {
    const [query, setQuery] = useState<SalesQuery>(initialQuery)
    const [search, setSearch] = useState('')
    const [filterColumn, setFilterColumn] = useState('')
    const [filterValue, setFilterValue] = useState('')
    const [dateColumn, setDateColumn] = useState('')
    const [dateFrom, setDateFrom] = useState('')
    const [dateTo, setDateTo] = useState('')
    const [dateError, setDateError] = useState('')
    const [stage, setStage] = useState<SelectedStage>()
    const [report, setReport] = useState<SalesReport>()
    const [error, setError] = useState('')
    const [loading, setLoading] = useState(true)
    const [refreshVersion, setRefreshVersion] = useState(0)
    const [openedOpportunity, setOpenedOpportunity] = useState<SelectedOpportunity>()
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
        const timer = window.setTimeout(() => {
            setQuery(current => withFilters(current, search, filterColumn, filterValue))
        }, filterDebounceMs)
        return () => window.clearTimeout(timer)
    }, [search, filterColumn, filterValue])

    useEffect(() => {
        // A tile click is a deliberate, single action, so it applies at once
        // rather than after the pause the typed controls need.
        setQuery(current => withDrilldown(current, stage?.columnId ?? '', stage?.label ?? ''))
    }, [stage])

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
        // The date range and the stage selection are their own sections with
        // their own resets, so clearing the report filters must not empty them
        // behind the user's back.
        setQuery(current => ({
            ...initialQuery,
            dateColumn: current.dateColumn,
            dateFrom: current.dateFrom,
            dateTo: current.dateTo,
            drilldownColumn: current.drilldownColumn,
            drilldownValue: current.drilldownValue,
            perPage: current.perPage,
        }))
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

    const availableDates = useMemo(() => dateColumns(report), [report])

    useEffect(() => {
        // The report defines its own date fields, so the selection follows the
        // live schema instead of hard-coded Salesforce column IDs.
        if (!availableDates.length) return
        if (availableDates.some(column => column.id === dateColumn)) return
        setDateColumn(defaultDateColumn(availableDates))
    }, [availableDates, dateColumn])

    /** Applies the pending range when it is valid, otherwise shows why it cannot be sent. Does not throw. */
    const applyDateRange = useCallback((): void => {
        const invalid = dateRangeError(dateColumn, dateFrom, dateTo)
        setDateError(invalid)
        if (invalid) return
        setQuery(current => withDateRange(current, dateColumn, dateFrom, dateTo))
    }, [dateColumn, dateFrom, dateTo])

    useEffect(() => {
        // The range applies as its controls change, after the same pause as the
        // report filters, so a date typed segment by segment is not sent per keystroke.
        const timer = window.setTimeout(applyDateRange, filterDebounceMs)
        return () => window.clearTimeout(timer)
    }, [applyDateRange])

    /** @param event Date range submission. @returns Nothing; applies a valid range at once. Does not throw. */
    function submitDateRange(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        applyDateRange()
    }

    /** Clears the date range without disturbing search, column filters or sorting. Does not throw. */
    function resetDateRange(): void {
        setDateFrom('')
        setDateTo('')
        setDateError('')
        setDateColumn(defaultDateColumn(availableDates))
        setQuery(current => withDateRange(current, '', '', ''))
    }

    /**
     * Drills the table into a stage, or releases it when that stage is already selected.
     * @param columnId Stage column the breakdown was built from.
     * @param label Exact stage label the tile reports.
     * @returns Nothing; the summary keeps describing every stage either way. Does not throw.
     */
    function toggleStage(columnId: string, label: string): void {
        setStage(current => (
            current?.columnId === columnId && current.label === label ? undefined : { columnId, label }
        ))
    }

    const rangeApplied = !!query.dateColumn
    const summary = report?.summary
    const columns = useMemo(() => displayedColumns(report), [report])
    const breakdown = useMemo(() => stageBreakdown(summary), [summary])
    const totalAmount = summary && amountTotal(summary.amounts)
    const totalExpectedRevenue = summary && expectedRevenueTotal(summary.amounts)
    const totalWonSowSigned = wonSowSignedTotal(breakdown)
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

            {summary && (
                <section className={styles.metrics} aria-label='Filtered sales totals'>
                    <SummaryCard label='Total Opportunities' value={summary.recordCount.toLocaleString()} />
                    <SummaryCard amount={totalAmount} label='Total Amount' />
                    <SummaryCard amount={totalExpectedRevenue} label='Total Expected Revenue' />
                    <SummaryCard amount={totalWonSowSigned} label='Total WON SOW Signed' />
                </section>
            )}

            <div className={styles.dashboard}>
                {breakdown && (
                    <section aria-labelledby='sales-stage-heading' className={styles.panel}>
                        <div className={styles.panelHeader}>
                            <div>
                                <h2 id='sales-stage-heading'>{`${breakdown.label} breakdown`}</h2>
                                <p className={styles.panelHint}>
                                    Select a stage to filter the table below. Totals cover every matching record.
                                </p>
                            </div>
                            {stage && (
                                <Button noCaps onClick={() => setStage(undefined)} link>Clear stage</Button>
                            )}
                        </div>
                        <ul className={styles.stages}>
                            {breakdown.stages.map(tile => (
                                <li key={tile.label || '—'}>
                                    <button
                                        aria-pressed={stage?.label === tile.label}
                                        className={`${styles.stage} ${
                                            stage?.label === tile.label ? styles.stageSelected : ''
                                        }`}
                                        onClick={() => toggleStage(breakdown.columnId, tile.label)}
                                        type='button'
                                    >
                                        <span className={styles.stageName}>{tile.label || '—'}</span>
                                        <span className={styles.stageMetrics}>
                                            <span>
                                                <span className={styles.stageValue}>
                                                    {tile.count.toLocaleString()}
                                                </span>
                                                Opportunities
                                            </span>
                                            <span>
                                                <span className={styles.stageValue}>
                                                    {tile.amount ? formatSummaryAmount(tile.amount) : '—'}
                                                </span>
                                                Amount
                                            </span>
                                            <span>
                                                <span className={styles.stageValue}>
                                                    {tile.expectedRevenue
                                                        ? formatSummaryAmount(tile.expectedRevenue)
                                                        : '—'}
                                                </span>
                                                Expected revenue
                                            </span>
                                        </span>
                                    </button>
                                </li>
                            ))}
                            {!breakdown.stages.length && (
                                <li><p className={styles.panelHint}>No matching records.</p></li>
                            )}
                        </ul>
                        {breakdown.otherStages > 0 && (
                            <p className={styles.panelNote}>
                                {`${breakdown.otherStages.toLocaleString()} further values not shown.`}
                            </p>
                        )}
                    </section>
                )}

                <section aria-labelledby='sales-date-heading' className={styles.panel}>
                    <div className={styles.panelHeader}>
                        <div>
                            <h2 id='sales-date-heading'>Date range filter</h2>
                            <p className={styles.panelHint}>
                                Filter by Created Date for pipeline generation, or by Close Date for revenue
                                projections.
                            </p>
                        </div>
                    </div>
                    <form className={styles.filters} onSubmit={submitDateRange}>
                        <div className={styles.filterField}>
                            <label htmlFor='sales-date-column'>Filter type</label>
                            <select
                                disabled={!availableDates.length}
                                id='sales-date-column'
                                onChange={event => setDateColumn(event.target.value)}
                                value={dateColumn}
                            >
                                {!availableDates.length && <option value=''>No date fields available</option>}
                                {availableDates.map(column => (
                                    <option key={column.id} value={column.id}>{column.label}</option>
                                ))}
                            </select>
                        </div>
                        <div className={styles.filterField}>
                            <label htmlFor='sales-date-from'>From date</label>
                            <input
                                disabled={!availableDates.length}
                                id='sales-date-from'
                                name='sales-date-from'
                                onChange={event => setDateFrom(event.target.value)}
                                type='date'
                                value={dateFrom}
                            />
                        </div>
                        <div className={styles.filterField}>
                            <label htmlFor='sales-date-to'>To date</label>
                            <input
                                disabled={!availableDates.length}
                                id='sales-date-to'
                                name='sales-date-to'
                                onChange={event => setDateTo(event.target.value)}
                                type='date'
                                value={dateTo}
                            />
                        </div>
                        <div className={styles.filterActions}>
                            <Button noCaps onClick={resetDateRange} link>Clear</Button>
                        </div>
                        <p className={styles.dateStatus} aria-live='polite' role='status'>
                            {dateError && <span className={styles.dateError}>{dateError}</span>}
                            {!dateError && rangeApplied && (
                                <span>
                                    {`Showing records by ${availableDates
                                        .find(column => column.id === query.dateColumn)?.label ?? query.dateColumn}`}
                                    {query.dateFrom ? ` from ${query.dateFrom}` : ''}
                                    {query.dateTo ? ` through ${query.dateTo}` : ''}
                                    .
                                </span>
                            )}
                            {!dateError && !rangeApplied && <span>No date range applied.</span>}
                        </p>
                    </form>
                </section>
            </div>

            <section className={styles.panel} aria-label='Sales report'>
                <div className={styles.panelHeader}>
                    <div>
                        <h2>{report?.reportName || 'Sales report'}</h2>
                        <p className={styles.panelHint}>
                            {stage
                                ? `Showing the ${stage.label || '—'} stage. Salesforce is the source of truth.`
                                : 'Salesforce is the source of truth. Changes are made there.'}
                        </p>
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
                            {columns.map(entry => (
                                <option key={entry.column.id} value={entry.column.id}>{entry.column.label}</option>
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
                                        {columns.map(entry => (
                                            <th
                                                aria-sort={query.sortBy === entry.column.id
                                                    ? query.sortOrder === 'asc' ? 'ascending' : 'descending'
                                                    : 'none'}
                                                className={numericTypes.includes(entry.column.dataType)
                                                    ? styles.numeric
                                                    : undefined}
                                                key={entry.column.id}
                                                scope='col'
                                            >
                                                <button
                                                    disabled={loading}
                                                    onClick={() => sortBy(entry.column.id)}
                                                    type='button'
                                                >
                                                    {entry.column.label}
                                                    <span aria-hidden='true'>
                                                        {query.sortBy === entry.column.id
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
                                            {columns.map(entry => {
                                                const cell = row.cells[entry.index]
                                                const opportunityId = cell && toOpportunityId(cell.value)
                                                const label = cell?.label || '—'

                                                return (
                                                    <td
                                                        className={numericTypes.includes(entry.column.dataType)
                                                            ? styles.numeric
                                                            : dateTypes.includes(entry.column.dataType)
                                                                ? styles.nowrap
                                                                : undefined}
                                                        key={entry.column.id}
                                                    >
                                                        {opportunityId && cell?.label ? (
                                                            <button
                                                                className={styles.opportunityButton}
                                                                onClick={() => setOpenedOpportunity({
                                                                    id: opportunityId,
                                                                    name: label,
                                                                })}
                                                                type='button'
                                                            >
                                                                {label}
                                                            </button>
                                                        ) : label}
                                                    </td>
                                                )
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                        {report.total === 0 && (
                            <div className={styles.empty}>
                                <h3>No sales records found</h3>
                                <p>
                                    {query.search || query.filterValue || query.drilldownValue
                                        ? 'Try a different search, stage or clear the filters.'
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

            {openedOpportunity && (
                <OpportunityModal
                    onClose={() => setOpenedOpportunity(undefined)}
                    open
                    opportunityId={openedOpportunity.id}
                    opportunityName={openedOpportunity.name}
                />
            )}
        </div>
    )
}

export default SalesPage

/* Handlers capture the active filter value. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true, "allowFunctions": true }] */
/* eslint jsx-a11y/no-noninteractive-tabindex: ["error", { "roles": ["region"] }] */
import { FC, FormEvent, useEffect, useState } from 'react'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import {
    fetchSalesProgression,
    progressionErrorMessage,
    SalesProgressionQuery,
    SalesProgressionReport,
} from './sales-progression.service'
import historyStyles from './SalesProgressionPage.module.scss'
import styles from './SalesPage.module.scss'

/** @param date Browser calendar date. @returns YYYY-MM-DD without UTC conversion. Does not throw. */
function calendarDate(date: Date): string {
    return `${date.getFullYear()}-${String(date.getMonth() + 1)
        .padStart(2, '0')}`
        + `-${String(date.getDate())
            .padStart(2, '0')}`
}

/** @returns This month's calendar range for the initial report. Does not throw. */
function initialPeriod(): SalesProgressionQuery {
    const today = calendarDate(new Date())
    return { dateFrom: `${today.slice(0, 7)}-01`, dateTo: today }
}

/**
 * Displays historical forward movement and entries into won stages using Salesforce summaries.
 * @returns Period/stage filters, distinct totals, and stage-pair counts with explicit loading/error/empty states.
 * @throws Does not throw request errors; obsolete requests are aborted and stale results are labelled.
 */
const SalesProgressionPage: FC = () => {
    const [query, setQuery] = useState<SalesProgressionQuery>(initialPeriod)
    const [filters, setFilters] = useState<SalesProgressionQuery>(query)
    const [report, setReport] = useState<SalesProgressionReport>()
    const [stages, setStages] = useState<string[]>([])
    const [timeZone, setTimeZone] = useState('the Salesforce reporting timezone')
    const [movement, setMovement] = useState<'progressed' | 'won'>('progressed')
    const [loading, setLoading] = useState(true)
    const [error, setError] = useState('')
    const [filterError, setFilterError] = useState('')
    const [version, setVersion] = useState(0)

    useEffect(() => {
        const controller = new AbortController()
        setLoading(true)
        setError('')
        fetchSalesProgression(query, controller.signal)
            .then(result => {
                if (controller.signal.aborted) return
                setReport(result)
                setStages(result.stages)
                setTimeZone(result.timeZone)
            })
            .catch(failure => {
                if (controller.signal.aborted) return
                if ([401, 403].includes(failure?.response?.status)) {
                    setReport(undefined)
                    setStages([])
                }

                setError(progressionErrorMessage(failure))
            })
            .finally(() => {
                if (!controller.signal.aborted) setLoading(false)
            })
        return () => controller.abort()
    }, [query, version])

    /**
     * @param event Filter submission. @returns Nothing; validates the period before loading summaries. Does not throw.
     */
    function applyFilters(event: FormEvent<HTMLFormElement>): void {
        event.preventDefault()
        const days = (Date.parse(filters.dateTo) - Date.parse(filters.dateFrom)) / 86400000
        if (!Number.isFinite(days) || days < 0 || days >= 366) {
            setFilterError('Choose a period of up to 366 days, with From on or before To.')
            return
        }

        setFilterError('')
        // Clear results before switching periods so failed requests never relabel old totals.
        setReport(undefined)
        setQuery({ ...filters })
    }

    const metrics = report ? [
        { label: 'Opportunities progressed', value: report.progressed.opportunities },
        { label: 'Forward transitions', value: report.progressed.transitions },
        { label: 'Opportunities won', value: report.won.opportunities },
        { label: 'Entries into won', value: report.won.transitions },
    ] : []
    const breakdown = report?.[movement].breakdown ?? []

    return (
        <div className={`sales-app ${styles.page}`}>
            <PageTitle>Sales — Stage progression</PageTitle>
            <header className={styles.header}>
                <div>
                    <p className={styles.eyebrow}>WORK / SALES</p>
                    <h1>Stage progression</h1>
                    <p className={styles.subtitle}>Forward movement and opportunities entering a won stage.</p>
                </div>
                <Button disabled={loading} noCaps onClick={() => setVersion(value => value + 1)} primary>
                    Refresh
                </Button>
            </header>

            <p className={historyStyles.hint}>
                Dates apply to stage changes in
                {' '}
                {timeZone}
                . Opportunities count once per metric;
                transitions count every qualifying change. Forward movement can also count as a win.
            </p>

            <form className={`${styles.panel} ${historyStyles.filters}`} onSubmit={applyFilters}>
                <div className={styles.filters}>
                    <div className={styles.filterField}>
                        <label htmlFor='progression-from'>From date</label>
                        <input
                            id='progression-from'
                            type='date'
                            required
                            value={filters.dateFrom}
                            onChange={event => setFilters(current => ({ ...current, dateFrom: event.target.value }))}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor='progression-to'>To date</label>
                        <input
                            id='progression-to'
                            type='date'
                            required
                            value={filters.dateTo}
                            onChange={event => setFilters(current => ({ ...current, dateTo: event.target.value }))}
                        />
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor='progression-from-stage'>From stage</label>
                        <select
                            id='progression-from-stage'
                            value={filters.fromStage ?? ''}
                            onChange={event => setFilters(current => ({
                                ...current, fromStage: event.target.value || undefined,
                            }))}
                        >
                            <option value=''>All stages</option>
                            {stages.map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>
                    </div>
                    <div className={styles.filterField}>
                        <label htmlFor='progression-to-stage'>To stage</label>
                        <select
                            id='progression-to-stage'
                            value={filters.toStage ?? ''}
                            onChange={event => setFilters(current => ({
                                ...current, toStage: event.target.value || undefined,
                            }))}
                        >
                            <option value=''>All stages</option>
                            {stages.map(stage => (
                                <option key={stage} value={stage}>{stage}</option>
                            ))}
                        </select>
                    </div>
                    <Button type='submit' noCaps primary>Apply filters</Button>
                    {filterError && <p className={styles.dateError} role='alert'>{filterError}</p>}
                </div>
            </form>

            {error && (
                <div className={styles.error} role='alert'>
                    <div>
                        <strong>
                            {report ? 'Showing previously loaded data' : 'Unable to load stage progression'}
                        </strong>
                        <p>{error}</p>
                    </div>
                    <Button disabled={loading} noCaps onClick={() => setVersion(value => value + 1)} secondary>
                        Try again
                    </Button>
                </div>
            )}

            {loading && <div role='status' aria-label='Loading stage progression'><LoadingSpinner /></div>}

            {report && (
                <>
                    <div className={styles.status} role='status'>
                        <span>
                            {`Period: ${report.dateFrom} to ${report.dateTo} (${report.timeZone})`}
                            {report.fromStage && ` · From: ${report.fromStage}`}
                            {report.toStage && ` · To: ${report.toStage}`}
                        </span>
                        <span>
                            {`Last updated ${new Date(report.refreshedAt)
                                .toLocaleString()}. `}
                            Refresh available every minute.
                        </span>
                    </div>
                    <section className={styles.metrics} aria-label='Stage progression totals'>
                        {metrics.map(metric => (
                            <div key={metric.label} className={styles.metric}>
                                <p className={styles.metricLabel}>{metric.label}</p>
                                <p className={styles.metricValue}>{metric.value.toLocaleString()}</p>
                            </div>
                        ))}
                    </section>
                    <p className={historyStyles.hint}>
                        Forward order:
                        {' '}
                        {report.openStages.join(' → ')}
                        {' '}
                        →
                        {' '}
                        {report.wonStages.join(' / ')}
                        .
                        Regressions, reopenings, and initial stage assignments are excluded from forward movement.
                        A reopened opportunity entering won again counts as another entry, and one opportunity.
                    </p>
                    <section className={styles.panel} aria-label='Stage transition breakdown'>
                        <div className={styles.panelHeader}>
                            <h2>Stage transitions</h2>
                            <div className={historyStyles.view}>
                                <label htmlFor='progression-view'>Show</label>
                                <select
                                    id='progression-view'
                                    value={movement}
                                    onChange={event => setMovement(event.target.value as 'progressed' | 'won')}
                                >
                                    <option value='progressed'>Forward movement</option>
                                    <option value='won'>Entering won</option>
                                </select>
                            </div>
                        </div>
                        {breakdown.length ? (
                            <div
                                className={styles.tableScroll}
                                role='region'
                                tabIndex={0}
                                aria-label='Stage transition table'
                            >
                                <table className={`${styles.table} ${historyStyles.table}`}>
                                    <thead>
                                        <tr>
                                            <th scope='col'>From stage</th>
                                            <th scope='col'>To stage</th>
                                            <th scope='col' className={styles.numeric}>Opportunities</th>
                                            <th scope='col' className={styles.numeric}>Transitions</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {breakdown.map(row => (
                                            <tr key={JSON.stringify([row.fromStage, row.toStage])}>
                                                <td>{row.fromStage}</td>
                                                <td>{row.toStage}</td>
                                                <td className={styles.numeric}>{row.opportunities.toLocaleString()}</td>
                                                <td className={styles.numeric}>{row.transitions.toLocaleString()}</td>
                                            </tr>
                                        ))}
                                    </tbody>
                                </table>
                            </div>
                        ) : <p className={historyStyles.empty}>No matching stage transitions in this period.</p>}
                        <p className={historyStyles.hint}>
                            Opportunities can appear in multiple rows. The summary cards count each opportunity once.
                        </p>
                    </section>
                </>
            )}
        </div>
    )
}

export default SalesProgressionPage

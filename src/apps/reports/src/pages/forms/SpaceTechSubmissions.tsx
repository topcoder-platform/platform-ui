/* Native controls do not depend on stable callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useMemo, useState } from 'react'

import { formatReportDate } from '../../../../../libs/shared/lib/utils/report-date'
import { formatFormValue, FormReport } from '../../lib/services/forms.service'

import styles from './FormsPage.module.scss'

export const spaceTechColumns = [
    ['submitted_at', 'Date Submitted'], ['full_name', 'Name'], ['email', 'Work Email'],
    ['company', 'Company'], ['challenge', 'Problem'], ['utm_source', 'utm_source'],
    ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'], ['form_status', 'form_status'],
]

function leadCellText(key: string, raw: string): string {
    return key === 'submitted_at' ? formatReportDate(raw) : raw
}

/** Filters the complete lead set before sorting, leaving the original API rows unchanged. */
export function selectSpaceTechLeads(
    rows: FormReport['data'],
    filters: Record<string, string>,
    sort: string,
    descending: boolean,
): FormReport['data'] {
    return rows.filter(row => Object.entries(filters)
        .every(([key, value]) => {
            const query = value.trim()
                .toLowerCase()
            const raw = formatFormValue(row[key])
            const matchesRaw = raw.toLowerCase()
                .includes(query)
            if (matchesRaw || key !== 'submitted_at') return matchesRaw
            return formatReportDate(raw)
                .toLowerCase()
                .includes(query)
        }))
        .sort((a, b) => (descending ? -1 : 1) * formatFormValue(a[sort])
            .localeCompare(formatFormValue(b[sort]), undefined, { numeric: true }))
}

/** Shows campaign leads with independent filters and sorting for all requested columns. */
const SpaceTechSubmissions: FC<{ report: FormReport }> = props => {
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sort, setSort] = useState('submitted_at')
    const [descending, setDescending] = useState(true)
    const [page, setPage] = useState(0)
    const rows = useMemo(
        () => {
            const submitted = props.report.data.map(row => ({ ...row, form_status: 'Submitted' }))
            return selectSpaceTechLeads(submitted, filters, sort, descending)
        },
        [props.report, filters, sort, descending],
    )
    const pageCount = Math.max(1, Math.ceil(rows.length / 25))
    return (
        <div className={styles.leadTable}>
            <p>
                Lead details are saved on submission. Starts and incomplete visits are counted in aggregate analytics.
            </p>
            <p role='status'>{`${rows.length} matching leads of ${props.report.data.length}`}</p>
            <button className={styles.clearColumnFilters} type='button' onClick={() => { setFilters({}); setPage(0) }}>
                Clear column filters
            </button>
            {/* Keyboard users must be able to scroll to offscreen columns. */}
            {/* eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex */}
            <div className={styles.tableScroll} tabIndex={0} role='region' aria-label='SpaceTech leads'>
                <table>
                    <thead>
                        <tr>
                            {spaceTechColumns.map(([key, label]) => (
                                <th
                                    key={key}
                                    scope='col'
                                    aria-sort={sort === key ? (descending ? 'descending' : 'ascending') : 'none'}
                                >
                                    <button
                                        className={styles.sortButton}
                                        type='button'
                                        onClick={() => {
                                            setDescending(sort === key ? !descending : false)
                                            setSort(key)
                                            setPage(0)
                                        }}
                                    >
                                        {label}
                                        <span aria-hidden='true'>
                                            {sort === key ? (descending ? '↓' : '↑') : '↕'}
                                        </span>
                                    </button>
                                </th>
                            ))}
                        </tr>
                        <tr className={styles.columnFilters}>
                            {spaceTechColumns.map(([key, label]) => (
                                <td key={key}>
                                    <input
                                        aria-label={`Filter ${label}`}
                                        placeholder='Filter…'
                                        value={filters[key] || ''}
                                        onChange={event => {
                                            setFilters({ ...filters, [key]: event.target.value })
                                            setPage(0)
                                        }}
                                    />
                                </td>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(page * 25, (page + 1) * 25)
                            .map(row => (
                                <tr key={String(row.submission_id)}>
                                    {spaceTechColumns.map(([key]) => (
                                        <td key={key}>{leadCellText(key, formatFormValue(row[key]))}</td>
                                    ))}
                                </tr>
                            ))}
                        {!rows.length && (
                            <tr><td colSpan={spaceTechColumns.length}>No leads match these filters.</td></tr>
                        )}
                    </tbody>
                </table>
            </div>
            <nav className={styles.actions} aria-label='SpaceTech lead pages'>
                <button type='button' disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <span>{`Page ${page + 1} of ${pageCount}`}</span>
                <button type='button' disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
            </nav>
        </div>
    )
}

export default SpaceTechSubmissions

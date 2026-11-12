/* Native controls do not depend on stable callback identity. */
/* eslint-disable react/jsx-no-bind */
import { FC, useMemo, useState } from 'react'

import { formatFormValue, FormReport } from '../../lib/services/forms.service'

import styles from './FormsPage.module.scss'

export const spaceTechColumns = [
    ['submitted_at', 'Date Submitted'], ['full_name', 'Name'], ['email', 'Work Email'],
    ['company', 'Company'], ['challenge', 'Problem'], ['utm_source', 'utm_source'],
    ['utm_medium', 'utm_medium'], ['utm_campaign', 'utm_campaign'],
]

/** Filters the complete lead set before sorting, leaving the original API rows unchanged. */
export function selectSpaceTechLeads(
    rows: FormReport['data'],
    filters: Record<string, string>,
    sort: string,
    descending: boolean,
): FormReport['data'] {
    return rows.filter(row => Object.entries(filters)
        .every(([key, value]) => !value || formatFormValue(row[key])
            .toLowerCase()
            .includes(value.trim()
                .toLowerCase())))
        .sort((a, b) => (descending ? -1 : 1) * formatFormValue(a[sort])
            .localeCompare(formatFormValue(b[sort]), undefined, { numeric: true }))
}

/** Shows campaign leads with independent filters and sorting for all eight requested columns. */
const SpaceTechSubmissions: FC<{ report: FormReport }> = props => {
    const [filters, setFilters] = useState<Record<string, string>>({})
    const [sort, setSort] = useState('submitted_at')
    const [descending, setDescending] = useState(true)
    const [page, setPage] = useState(0)
    const rows = useMemo(
        () => selectSpaceTechLeads(props.report.data, filters, sort, descending),
        [props.report, filters, sort, descending],
    )
    const pageCount = Math.max(1, Math.ceil(rows.length / 25))
    return (
        <>
            <p role='status'>{`${rows.length} matching leads of ${props.report.data.length}`}</p>
            <button type='button' onClick={() => { setFilters({}); setPage(0) }}>Clear column filters</button>
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
                                        type='button'
                                        onClick={() => {
                                            setDescending(sort === key ? !descending : false)
                                            setSort(key)
                                            setPage(0)
                                        }}
                                    >
                                        {label}
                                    </button>
                                    <input
                                        aria-label={`Filter ${label}`}
                                        value={filters[key] || ''}
                                        onChange={event => {
                                            setFilters({ ...filters, [key]: event.target.value })
                                            setPage(0)
                                        }}
                                    />
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody>
                        {rows.slice(page * 25, (page + 1) * 25)
                            .map(row => (
                                <tr key={String(row.submission_id)}>
                                    {spaceTechColumns.map(([key]) => <td key={key}>{formatFormValue(row[key])}</td>)}
                                </tr>
                            ))}
                        {!rows.length && <tr><td colSpan={8}>No leads match these filters.</td></tr>}
                    </tbody>
                </table>
            </div>
            <nav className={styles.actions} aria-label='SpaceTech lead pages'>
                <button type='button' disabled={page === 0} onClick={() => setPage(page - 1)}>Previous</button>
                <span>{`Page ${page + 1} of ${pageCount}`}</span>
                <button type='button' disabled={page + 1 >= pageCount} onClick={() => setPage(page + 1)}>Next</button>
            </nav>
        </>
    )
}

export default SpaceTechSubmissions

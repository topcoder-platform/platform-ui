import { FC, useEffect, useState } from 'react'

import {
    fetchSpaceTechSubmissions,
    FormReport,
} from '../../../reports/src/lib/services/forms.service'
import { SpaceTechFilters } from '../lib/models'
import SpaceTechSubmissions from '../../../reports/src/pages/forms/SpaceTechSubmissions'

import styles from './AnalyticsPages.module.scss'

/** Loads private leads through Forms authorization; aggregate analytics never carries lead answers. */
const SpaceTechLeads: FC<{ filters: SpaceTechFilters }> = props => {
    const filters = props.filters
    const [report, setReport] = useState<FormReport>()
    const [error, setError] = useState(false)
    const [retry, setRetry] = useState(0)
    useEffect(() => {
        let active = true
        setReport(undefined)
        setError(false)
        fetchSpaceTechSubmissions({ endDate: filters.to, startDate: filters.from }, () => active)
            .then(result => { if (active) setReport(result) })
            .catch(() => { if (active) setError(true) })
        return () => { active = false }
    }, [filters.from, filters.to, retry])

    const data = report?.data.filter(row => (['source', 'medium', 'campaign'] as const)
        .every(key => !filters[key] || row[`utm_${key}`] === filters[key]))

    return (
        <section className={styles.panel}>
            <h2>Lead attribution</h2>
            <p>Submitted leads are available immediately to Forms reporters and administrators.</p>
            {error ? (
                <p role='alert'>
                    Unable to load leads. Forms reporting access is required.
                    {/* Native button does not require a stable callback. */}
                    {/* eslint-disable-next-line react/jsx-no-bind */}
                    <button type='button' onClick={() => setRetry(value => value + 1)}>Retry leads</button>
                </p>
            ) : report && data ? (
                <SpaceTechSubmissions key={JSON.stringify(filters)} report={{ ...report, data, total: data.length }} />
            ) : <p role='status'>Loading leads…</p>}
        </section>
    )
}

export default SpaceTechLeads

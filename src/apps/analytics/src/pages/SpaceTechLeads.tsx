import { FC, useEffect, useState } from 'react'

import {
    fetchSpaceTechSubmissions,
    FormReport,
} from '../../../reports/src/lib/services/forms.service'
import { SpaceTechFilters, SpaceTechFormActivity } from '../lib/models'
import SpaceTechSubmissions from '../../../reports/src/pages/forms/SpaceTechSubmissions'

import styles from './AnalyticsPages.module.scss'

/** Loads private leads through Forms authorization; aggregate analytics never carries lead answers. */
const SpaceTechLeads: FC<{
    filters: SpaceTechFilters
    activity?: SpaceTechFormActivity[]
}> = props => {
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

    const activityRows = props.activity?.map((activity, index) => ({
        form_status: activity.status,
        submission_id: `activity:${index}`,
        submitted_at: activity.startedAt,
        utm_campaign: activity.campaign,
        utm_medium: activity.medium,
        utm_source: activity.source,
    })) || []
    const submittedRows = report?.data.map((row): Record<string, unknown> => ({ ...row, form_status: 'Submitted' }))
    const data = submittedRows && [...submittedRows, ...activityRows]
        .filter(row => (['source', 'medium', 'campaign'] as const)
            .every(key => !filters[key] || row[`utm_${key}`] === filters[key]))

    return (
        <section className={styles.panel}>
            <h2>Lead attribution</h2>
            <p>Submitted leads are available immediately to Forms reporters and administrators.</p>
            {props.activity === undefined ? (
                <p role='status'>Started and Incomplete activity is currently unavailable.</p>
            ) : (
                <p>
                    Started means an interaction was recorded; Incomplete means the visitor left without submitting.
                    These anonymous rows refresh with analytics. Personal details are saved only on submission.
                    Dates show submission time for submitted leads and start time for unfinished forms.
                </p>
            )}
            {error ? (
                <p role='alert'>
                    Unable to load leads. Forms reporting access is required.
                    {/* Native button does not require a stable callback. */}
                    {/* eslint-disable-next-line react/jsx-no-bind */}
                    <button type='button' onClick={() => setRetry(value => value + 1)}>Retry leads</button>
                </p>
            ) : report && data ? (
                <SpaceTechSubmissions
                    key={JSON.stringify(filters)}
                    includeActivity
                    report={{ ...report, data, total: data.length }}
                />
            ) : <p role='status'>Loading leads…</p>}
        </section>
    )
}

export default SpaceTechLeads

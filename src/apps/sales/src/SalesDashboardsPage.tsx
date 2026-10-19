import { FC, useCallback, useEffect, useState } from 'react'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import {
    fetchSalesDashboard,
    SalesDashboardPortal,
    SalesDashboardResponse,
    SalesDashboardSection,
} from './sales-dashboard.service'
import SalesDashboardChart from './SalesDashboardChart'
import styles from './SalesDashboardsPage.module.scss'

const sections: Array<{ id: SalesDashboardSection; title: string }> = [
    { id: 'pipeline', title: 'Sales pipeline' },
    { id: 'revenue', title: 'Revenue' },
    { id: 'payments', title: 'Member payments' },
    { id: 'talent', title: 'Flexible talent' },
    { id: 'gross-margin', title: 'Gross margin' },
]

type SectionProps = {
    section: SalesDashboardSection
    title: string
    portal: SalesDashboardPortal
    dateBasis: 'close' | 'created'
    refreshKey: number
}

/**
 * Loads one source independently so SFDC or engagement failures leave other sections usable.
 * @param props Source identity, portal payment scope, date basis and refresh counter.
 * @returns Monthly charts, a pending-source notice, loading state or retry button.
 * @throws Does not throw; request errors are handled inline and stale requests are cancelled.
 */
const DashboardSection: FC<SectionProps> = props => {
    const [data, setData] = useState<SalesDashboardResponse>()
    const [error, setError] = useState<string>()
    const [retry, setRetry] = useState(0)
    const dateBasis = props.section === 'pipeline' ? props.dateBasis : 'close'
    useEffect(() => {
        const controller = new AbortController()
        setData(undefined)
        setError(undefined)
        fetchSalesDashboard(props.section, props.portal, dateBasis, controller.signal)
            .then(response => {
                if (!controller.signal.aborted) setData(response)
            })
            .catch(reason => {
                if (controller.signal.aborted) return
                const status = reason?.response?.status
                setError(status === 401 ? 'Your session has expired. Sign in again.'
                    : status === 403 ? 'You do not have access to this report.'
                        : `${props.title} could not be loaded. Please try again.`)
            })
        return () => controller.abort()
    }, [props.section, props.portal, props.title, dateBasis, props.refreshKey, retry])
    const retryLoad = useCallback(() => setRetry(value => value + 1), [])

    return (
        <section aria-labelledby={`monthly-${props.section}`} className={styles.section}>
            <h2 id={`monthly-${props.section}`}>{props.title}</h2>
            {data ? (
                <>
                    {data.notices.map(notice => <p className={styles.notice} key={notice} role='status'>{notice}</p>)}
                    <div className={styles.grid}>
                        {data.charts.map(chart => <SalesDashboardChart key={chart.id} chart={chart} />)}
                    </div>
                </>
            ) : error ? (
                <div className={styles.error} role='alert'>
                    <p>{error}</p>
                    <Button secondary onClick={retryLoad}>Try again</Button>
                </div>
            ) : <LoadingSpinner inline message={`Loading ${props.title}…`} />}
        </section>
    )
}

/**
 * Shares the executive monthly dashboards between the Reports and Sales portals.
 * @param props Portal scope; Reports retains existing payment types, Sales requests only customer work.
 * @returns Four pipeline charts, revenue, payments, flexible talent and average monthly markup.
 * @throws Does not throw; sections manage their source failures independently.
 */
const SalesDashboardsPage: FC<{ portal?: SalesDashboardPortal }> = props => {
    const [refreshKey, setRefreshKey] = useState(0)
    const [dateBasis, setDateBasis] = useState<'close' | 'created'>('close')
    const refresh = useCallback(() => setRefreshKey(value => value + 1), [])
    const chooseClose = useCallback(() => setDateBasis('close'), [])
    const chooseCreated = useCallback(() => setDateBasis('created'), [])
    return (
        <div className={styles.page}>
            <PageTitle>Sales dashboards</PageTitle>
            <header className={styles.header}>
                <div>
                    <h1>Sales dashboards</h1>
                    <p>Monthly business performance, from opportunity to member payments.</p>
                </div>
                <Button secondary onClick={refresh}>Refresh data</Button>
            </header>
            <p className={styles.notice}>
                Latest six calendar months in UTC, including the current month in progress.
                {' Opportunity size, expected revenue and pipeline stages show three months back to six months ahead.'}
            </p>
            {props.portal === 'sales' && <p>Member payments include customer work only.</p>}
            <div className={styles.controls} aria-label='Pipeline date basis' role='group'>
                <span>Group pipeline by</span>
                <Button secondary onClick={chooseClose} disabled={dateBasis === 'close'}>Close date</Button>
                <Button secondary onClick={chooseCreated} disabled={dateBasis === 'created'}>Created date</Button>
            </div>
            {sections.map(section => (
                <DashboardSection
                    key={section.id}
                    section={section.id}
                    title={section.title}
                    portal={props.portal ?? 'reports'}
                    dateBasis={dateBasis}
                    refreshKey={refreshKey}
                />
            ))}
        </div>
    )
}

export default SalesDashboardsPage

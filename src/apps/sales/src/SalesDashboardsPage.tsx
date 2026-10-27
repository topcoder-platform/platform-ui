import { FC, ReactNode, useCallback, useState } from 'react'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import { SalesDashboardPortal, SalesDashboardSection } from './sales-dashboard.service'
import { dashboardTitles, SalesDashboardSource, useSalesDashboard } from './useSalesDashboard'
import SalesCustomerTable from './SalesCustomerTable'
import SalesDashboardChart from './SalesDashboardChart'
import styles from './SalesDashboardsPage.module.scss'

/**
 * Displays an independently loaded source or its loading/retry state wherever that source is used.
 * @param props Source state, accessible loading title and content for a successful response.
 * @returns Source content, spinner or a retry button. Does not throw.
 */
const SourceContent: FC<{ source: SalesDashboardSource; title: string; children: ReactNode }> = props => (
    props.source.data ? <>{props.children}</> : props.source.error ? (
        <div className={styles.error} role='alert'>
            <p>{props.source.error}</p>
            <Button secondary onClick={props.source.retry}>Try again</Button>
        </div>
    ) : <LoadingSpinner inline message={`Loading ${props.title}…`} />
)

/**
 * Renders one chart section from its shared source; customer reports are displayed at the page bottom.
 * @param props Source identity and shared loading/data state.
 * @returns Source notices and charts, or a loading/retry state. Does not throw.
 */
const DashboardSection: FC<{
    section: SalesDashboardSection; source: SalesDashboardSource
}> = props => (
    <section aria-labelledby={`monthly-${props.section}`} className={styles.section}>
        <h2 id={`monthly-${props.section}`}>{dashboardTitles[props.section]}</h2>
        <SourceContent source={props.source} title={dashboardTitles[props.section]}>
            {props.source.data?.notices.map(notice => (
                <p className={styles.notice} key={notice} role='status'>{notice}</p>
            ))}
            <div className={styles.grid}>
                {props.source.data?.charts.filter(chart => chart.id !== 'payment-customer')
                    .map(chart => (
                        <SalesDashboardChart
                            key={chart.id}
                            chart={chart}
                        />
                    ))}
            </div>
        </SourceContent>
    </section>
)

/**
 * Displays a complete customer matrix using the already-loaded revenue/payment source.
 * @param props Source state, dataset key and user-facing report name.
 * @returns The matrix, an explicit missing-dataset message, loading or retry state. Does not throw.
 */
const CustomerDashboard: FC<{
    source: SalesDashboardSource; field: 'customerRevenue' | 'customerPayments'; title: string
}> = props => {
    const data = props.source.data?.[props.field]
    if (data) {
        return <SalesCustomerTable data={data} title={props.title} notices={props.source.data?.notices} />
    }

    return (
        <article className={`${styles.card} ${styles.customerTable}`}>
            <h3>{props.title}</h3>
            <SourceContent source={props.source} title={props.title}>
                {props.source.data?.notices.map(notice => <p key={notice} role='status'>{notice}</p>)}
                <p>Customer details are unavailable for this source.</p>
            </SourceContent>
        </article>
    )
}

/**
 * Shares the executive monthly dashboards between the Reports and Sales portals.
 * @param props Portal scope; Reports retains its existing scope; Sales payments and talent include only customer work.
 * @returns Pipeline, revenue, payments and talent charts followed by both customer matrices. Gross margin is deferred.
 * @throws Does not throw; sections manage their source failures independently.
 */
const SalesDashboardsPage: FC<{ portal?: SalesDashboardPortal }> = props => {
    const [refreshKey, setRefreshKey] = useState(0)
    const [dateBasis, setDateBasis] = useState<'close' | 'created'>('close')
    const portal = props.portal ?? 'reports'
    const pipeline = useSalesDashboard('pipeline', portal, dateBasis, refreshKey)
    const revenue = useSalesDashboard('revenue', portal, dateBasis, refreshKey)
    const payments = useSalesDashboard('payments', portal, dateBasis, refreshKey)
    const talent = useSalesDashboard('talent', portal, dateBasis, refreshKey)
    const sources = { payments, pipeline, revenue, talent }
    const sections = ['pipeline', 'revenue', 'payments', 'talent'] as const
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
                Current fiscal year: April through March in UTC, including the current month in progress.
                {' All charts cover the same 12 months.'}
                {' Pipeline charts include expected closes within the fiscal year.'}
            </p>
            {props.portal === 'sales' && <p>Member payments and flexible talent include customer work only.</p>}
            <div className={styles.controls} aria-label='Pipeline date basis' role='group'>
                <span>Group pipeline by</span>
                <Button secondary onClick={chooseClose} disabled={dateBasis === 'close'}>Close date</Button>
                <Button secondary onClick={chooseCreated} disabled={dateBasis === 'created'}>Created date</Button>
            </div>
            {sections.map(section => (
                <DashboardSection
                    key={section}
                    section={section}
                    source={sources[section]}
                />
            ))}
            <section aria-labelledby='monthly-customer' className={styles.section}>
                <h2 id='monthly-customer'>Customer</h2>
                <CustomerDashboard source={revenue} field='customerRevenue' title='Revenue Customer-Wise' />
                <CustomerDashboard source={payments} field='customerPayments' title='Goods Sold Customer-Wise' />
            </section>
        </div>
    )
}

export default SalesDashboardsPage

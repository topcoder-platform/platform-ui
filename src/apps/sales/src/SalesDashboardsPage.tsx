/* Card controls capture their independent selection. */
/* eslint react/jsx-no-bind: ["error", { "allowArrowFunctions": true }] */
import { FC, ReactNode, useCallback, useState } from 'react'

import { Button, LoadingSpinner, PageTitle } from '~/libs/ui'

import {
    SalesAccountCategory,
    SalesCustomerRevenue,
    SalesDashboardGroupBy,
    SalesDashboardPeriod,
    SalesDashboardPortal,
    SalesRevenueOfferingType,
} from './sales-dashboard.service'
import { salesFiscalYearLabel, salesFiscalYearPeriod } from './sales-fiscal-year'
import { SalesDashboardSource, useSalesDashboard } from './useSalesDashboard'
import GroupBy from './SalesDashboardGroupBy'
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
 * Presents one business chart with controls, keeping its data table and chart on the same response.
 * @param props Shared source, desired chart, display title and independent card controls.
 * @returns One chart or its source loading, empty or retry state. Does not throw.
 */
const DashboardCard: FC<{
    source: SalesDashboardSource; chartId: string; title: string; children?: ReactNode; expectedCloses?: boolean
    period?: SalesDashboardPeriod
}> = props => {
    const chart = props.source.data?.charts.find(item => item.id === props.chartId)
    const controls = (
        <>
            {props.children}
            {props.source.data?.notices.map(notice => <p key={notice} role='status'>{notice}</p>)}
        </>
    )
    return chart ? (
        <SalesDashboardChart
            chart={{ ...chart, title: props.title }}
            controls={controls}
            expectedCloses={props.expectedCloses}
            period={props.period}
        />
    ) : (
        <article className={styles.card} aria-label={props.title}>
            <h3>{props.title}</h3>
            {controls}
            <SourceContent source={props.source} title={props.title}>
                {!props.source.data?.notices.length && <p>No data available for this report.</p>}
            </SourceContent>
        </article>
    )
}

/**
 * Switches between two measures without refetching the shared source.
 * @param props Accessible group name, measures, current value and selection callback.
 * @returns Buttons identifying the active measure. Does not throw.
 */
const MeasureToggle: FC<{
    label: string; options: string[]; value: string; onChange: (value: string) => void
}> = props => (
    <div className={styles.controls} role='group' aria-label={props.label}>
        {props.options.map(value => (
            <Button key={value} secondary disabled={value === props.value} onClick={() => props.onChange(value)}>
                {value}
            </Button>
        ))}
    </div>
)

/**
 * Displays a complete customer matrix using the already-loaded revenue/payment source.
 * @param props Source state, dataset key and user-facing report name.
 * @returns The matrix, an explicit missing-dataset message, loading or retry state. Does not throw.
 */
const CustomerDashboard: FC<{
    source: SalesDashboardSource; field: 'customerRevenue' | 'customerPayments'; title: string
    period: SalesDashboardPeriod; accountCategory?: SalesAccountCategory; offeringType?: SalesRevenueOfferingType
}> = props => {
    const revenueScope: SalesCustomerRevenue | undefined = props.offeringType
        ? props.source.data?.customerRevenueByOfferingType?.[props.offeringType]
        : props.source.data
    const data = props.field === 'customerPayments' ? props.source.data?.customerPayments
        : props.accountCategory ? revenueScope?.customerRevenueByAccountCategory?.[props.accountCategory]
            : revenueScope?.customerRevenue
    if (data) {
        return (
            <SalesCustomerTable
                data={data}
                title={props.title}
                notices={props.source.data?.notices}
                period={props.period}
            />
        )
    }

    return (
        <article className={`${styles.card} ${styles.customerTable}`}>
            <h3>{props.title}</h3>
            <SourceContent source={props.source} title={props.title}>
                {props.source.data?.notices.map(notice => <p key={notice} role='status'>{notice}</p>)}
                <p>
                    {props.offeringType && !revenueScope
                        ? 'Revenue offering type details are unavailable for this source.'
                        : props.accountCategory
                            ? 'Revenue account category details are unavailable for this source.'
                            : 'Customer details are unavailable for this source.'}
                </p>
            </SourceContent>
        </article>
    )
}

/**
 * Shares the executive monthly dashboards between the Reports and Sales portals.
 * @param props Portal scope; Reports retains its existing scope; Sales payments and talent include only customer work.
 * @returns Consolidated sales/revenue cards with independent breakdowns, payment measures, TaaS and customer matrices.
 * @throws Does not throw; sections manage their source failures independently.
 */
const SalesDashboardsPage: FC<{ portal?: SalesDashboardPortal }> = props => {
    const [refreshKey, setRefreshKey] = useState(0)
    const [dateBasis, setDateBasis] = useState<'close' | 'created'>('close')
    const portal = props.portal ?? 'reports'
    const [wonGroup, setWonGroup] = useState<SalesDashboardGroupBy>('offeringType')
    const [pipelineGroup, setPipelineGroup] = useState<SalesDashboardGroupBy>('offeringType')
    const [revenueGroup, setRevenueGroup] = useState<SalesDashboardGroupBy>('offeringType')
    const [forecastGroup, setForecastGroup] = useState<SalesDashboardGroupBy>('offeringType')
    const [pipelineMeasure, setPipelineMeasure] = useState('Amount')
    const [paymentMeasure, setPaymentMeasure] = useState('Amount')
    const [taasMeasure, setTaasMeasure] = useState('Amount')
    const [period, setPeriod] = useState<SalesDashboardPeriod>('Monthly')
    const [accountCategory, setAccountCategory] = useState<SalesAccountCategory | ''>('')
    const [offeringType, setOfferingType] = useState<SalesRevenueOfferingType | ''>('')
    const bookings = useSalesDashboard('bookings', portal, dateBasis, refreshKey, wonGroup)
    const pipeline = useSalesDashboard('pipeline', portal, dateBasis, refreshKey, pipelineGroup)
    const revenue = useSalesDashboard('revenue', portal, dateBasis, refreshKey, revenueGroup)
    const forecast = useSalesDashboard('revenue-forecast', portal, dateBasis, refreshKey, forecastGroup)
    const payments = useSalesDashboard('payments', portal, dateBasis, refreshKey)
    const taas = useSalesDashboard('taas-payments', portal, dateBasis, refreshKey)
    const talent = useSalesDashboard('talent', portal, dateBasis, refreshKey)
    const months = [pipeline, revenue, payments, talent].map(source => source.data?.charts[0]?.months)
        .find(value => value?.length)
    const first = months?.[0]?.month
    const last = months?.[months.length - 1]?.month
    const title = `${portal === 'sales' ? 'Sales' : 'Sales dashboards'} - ${salesFiscalYearLabel(first, last)}`
    const refresh = useCallback(() => setRefreshKey(value => value + 1), [])
    const chooseClose = useCallback(() => setDateBasis('close'), [])
    const chooseCreated = useCallback(() => setDateBasis('created'), [])
    return (
        <div className={styles.page}>
            <PageTitle>{title}</PageTitle>
            <header className={styles.header}>
                <div>
                    <h1>{title}</h1>
                    <p>{salesFiscalYearPeriod(first, last)}</p>
                </div>
                <Button secondary onClick={refresh}>Refresh data</Button>
            </header>
            <p className={styles.notice}>
                Current fiscal year: April through March in UTC, including the current month in progress.
                {period === 'Monthly'
                    ? ' Headlines compare the current month with the full previous month.'
                    : ' Quarterly headlines compare the current quarter with the full previous quarter.'}
                {' All charts cover the same 12 months.'}
                {' Pipeline charts include expected closes within the fiscal year.'}
            </p>
            {props.portal === 'sales' && <p>Topcoder payments and flexible talent include customer work only.</p>}
            <div className={styles.controls} aria-label='Sales date basis' role='group'>
                <span>Group sales by</span>
                <Button secondary onClick={chooseClose} disabled={dateBasis === 'close'}>Close date</Button>
                <Button secondary onClick={chooseCreated} disabled={dateBasis === 'created'}>Created date</Button>
            </div>
            <MeasureToggle
                label='Dashboard period'
                options={['Monthly', 'Quarterly']}
                value={period}
                onChange={value => setPeriod(value as SalesDashboardPeriod)}
            />
            {period === 'Quarterly' && (
                <p>Fiscal quarters: Q1 April–June, Q2 July–September, Q3 October–December, Q4 January–March.</p>
            )}
            <section aria-labelledby='monthly-sales' className={styles.section}>
                <h2 id='monthly-sales'>Sales</h2>
                <div className={styles.grid}>
                    <DashboardCard source={bookings} period={period} chartId='closed-won' title='Bookings Won'>
                        <GroupBy value={wonGroup} onChange={setWonGroup} />
                    </DashboardCard>
                    <DashboardCard
                        source={pipeline}
                        period={period}
                        chartId={pipelineMeasure === 'Amount' ? 'pipeline-stage' : 'expected-revenue'}
                        title='Bookings in Pipeline'
                        expectedCloses={dateBasis === 'close'}
                    >
                        <GroupBy value={pipelineGroup} onChange={setPipelineGroup} pipeline />
                        <MeasureToggle
                            label='Pipeline measure'
                            options={['Amount', 'Expected Amount']}
                            value={pipelineMeasure}
                            onChange={setPipelineMeasure}
                        />
                    </DashboardCard>
                </div>
            </section>
            <section aria-labelledby='monthly-revenue' className={styles.section}>
                <h2 id='monthly-revenue'>Revenue</h2>
                <div className={styles.grid}>
                    <DashboardCard source={revenue} period={period} chartId='revenue' title='Revenue Closed'>
                        <GroupBy value={revenueGroup} onChange={setRevenueGroup} revenue />
                    </DashboardCard>
                    <DashboardCard
                        source={forecast}
                        period={period}
                        chartId='revenue-forecast'
                        title='Revenue Forecast'
                    >
                        <GroupBy value={forecastGroup} onChange={setForecastGroup} revenue />
                    </DashboardCard>
                </div>
            </section>
            <section aria-labelledby='monthly-payments' className={styles.section}>
                <h2 id='monthly-payments'>Payments</h2>
                <div className={styles.grid}>
                    <DashboardCard
                        source={payments}
                        period={period}
                        chartId={paymentMeasure === 'Amount' ? 'payment-type' : 'members-paid'}
                        title='Topcoder Payments'
                    >
                        <MeasureToggle
                            label='Payment measure'
                            options={['Amount', 'Count']}
                            value={paymentMeasure}
                            onChange={setPaymentMeasure}
                        />
                    </DashboardCard>
                    <DashboardCard
                        source={taas}
                        period={period}
                        chartId={taasMeasure === 'Amount' ? 'taas-payments' : 'taas-members-paid'}
                        title='TaaS Payments'
                    >
                        <MeasureToggle
                            label='TaaS payment measure'
                            options={['Amount', 'Count']}
                            value={taasMeasure}
                            onChange={setTaasMeasure}
                        />
                    </DashboardCard>
                </div>
            </section>
            <section aria-labelledby='monthly-talent' className={styles.section}>
                <h2 id='monthly-talent'>Flexible Talent</h2>
                <DashboardCard source={talent} chartId='flexible-talent' title='Members Engaged' />
            </section>
            <section aria-labelledby='monthly-customer' className={styles.section}>
                <h2 id='monthly-customer'>Customer</h2>
                <div className={styles.filters}>
                    <label>
                        Revenue offering type
                        <select
                            value={offeringType}
                            onChange={event => setOfferingType(event.target.value as SalesRevenueOfferingType | '')}
                        >
                            <option value=''>ALL</option>
                            {[
                                'AI Training', 'Crowd Powered Outcomes', 'Crowd Powered Innovation',
                                'Flexible Talent', 'TopGear', 'TaaS Ops',
                            ].map(offering => (
                                <option key={offering} value={offering}>{offering}</option>
                            ))}
                        </select>
                    </label>
                    <label>
                        Revenue account category
                        <select
                            value={accountCategory}
                            onChange={event => setAccountCategory(event.target.value as SalesAccountCategory | '')}
                        >
                            <option value=''>ALL</option>
                            {['External Revenue', 'Through Wipro', 'Wipro Internal'].map(category => (
                                <option key={category} value={category}>{category}</option>
                            ))}
                        </select>
                    </label>
                </div>
                <CustomerDashboard
                    source={revenue}
                    field='customerRevenue'
                    title='Revenue Customer-Wise'
                    period={period}
                    accountCategory={accountCategory || undefined}
                    offeringType={offeringType || undefined}
                />
                <CustomerDashboard
                    source={payments}
                    field='customerPayments'
                    title='Goods Sold Customer-Wise'
                    period={period}
                />
            </section>
        </div>
    )
}

export default SalesDashboardsPage

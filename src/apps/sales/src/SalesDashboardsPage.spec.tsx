/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null, react/function-component-definition */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import SalesDashboardsPage from './SalesDashboardsPage'
import SalesReportsPage from './SalesReportsPage'
import SalesCustomerTable from './SalesCustomerTable'
import SalesDashboardChart, { axisLabel, chartTooltip } from './SalesDashboardChart'
import {
    fetchSalesDashboard,
    MonthlySalesChart,
    SalesDashboardPortal,
    SalesDashboardResponse,
} from './sales-dashboard.service'

jest.mock('./sales-dashboard.service', () => ({ fetchSalesDashboard: jest.fn() }))
jest.mock('./SalesPage', () => () => <div>Existing pipeline</div>)
jest.mock('./SalesProgressionPage', () => () => <div>Existing progression</div>)
jest.mock('highcharts-react-official', () => jest.fn(() => <div data-testid='monthly-chart' />))
jest.mock('~/libs/ui', () => ({
    Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type='button' onClick={props.onClick} disabled={props.disabled}>{props.children}</button>
    ),
    LoadingSpinner: (props: { message: string }) => <span role='status'>{props.message}</span>,
    PageTitle: (props: { children: ReactNode }) => <title>{props.children}</title>,
}), { virtual: true })

const fetchDashboard = fetchSalesDashboard as jest.MockedFunction<typeof fetchSalesDashboard>
const response: SalesDashboardResponse = {
    charts: [{
        description: 'Monthly member payments',
        id: 'payment-type',
        months: [{ month: '2026-09-01', values: { amount: 25.5 } }, { month: '2026-10-01', values: { amount: null } }],
        series: [{ key: 'amount', label: 'Payments' }],
        stacked: false,
        title: 'Member payments by type',
        unit: 'currency',
    }],
    notices: [],
}

const activeSections = ['bookings', 'pipeline', 'revenue', 'payments', 'taas-payments', 'talent']

beforeEach(() => {
    jest.clearAllMocks()
    fetchDashboard.mockResolvedValue({ charts: [], notices: [] })
})

it.each([undefined, 'reports', 'sales'] as Array<SalesDashboardPortal | undefined>)(
    'loads only active sections with the correct scope for portal %s',
    async portal => {
        render(<SalesDashboardsPage portal={portal} />)
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(6))
        expect(fetchDashboard.mock.calls.map(call => [call[0], call[1]]))
            .toEqual(activeSections.map(section => [section, portal ?? 'reports']))
        expect(screen.queryByRole('heading', { name: /gross margin/i }))
            .not.toBeInTheDocument()
        expect(screen.getByText(/Current fiscal year: April through March in UTC/))
            .toHaveTextContent('All charts cover the same 12 months.')
    },
)

it.each(['reports', 'sales'] as SalesDashboardPortal[])(
    'changes only pipeline grouping and refreshes active sections in %s',
    async portal => {
        render(<SalesDashboardsPage portal={portal} />)
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(6))
        fireEvent.click(screen.getByRole('button', { name: 'Created date' }))
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(8))
        expect(fetchDashboard)
            .toHaveBeenLastCalledWith('pipeline', portal, 'created', expect.any(AbortSignal), 'stage')
        fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(14))
        expect(fetchDashboard.mock.calls.slice(8)
            .map(call => call[0]))
            .toEqual(activeSections)
        expect(screen.queryByRole('heading', { name: /gross margin/i }))
            .not.toBeInTheDocument()
    },
)

it('keeps independent sections usable when one source fails and retries just that source', async () => {
    fetchDashboard.mockImplementation(async section => {
        if (section === 'talent') throw new Error('offline')
        if (section === 'revenue') return { charts: [], notices: ['Revenue report pending configuration.'] }
        return section === 'payments' ? response : { charts: [], notices: [] }
    })
    render(<SalesDashboardsPage />)
    expect(await screen.findByRole('alert'))
        .toHaveTextContent('Flexible talent could not be loaded')
    expect(screen.getAllByText('Revenue report pending configuration.'))
        .toHaveLength(2)
    expect(screen.getByRole('heading', { name: 'Topcoder Payments' }))
        .toBeInTheDocument()
    fetchDashboard.mockResolvedValue({ charts: [], notices: ['Talent data loaded.'] })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Talent data loaded.'))
        .toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(7)
})

it('cancels pending source requests on unmount', () => {
    fetchDashboard.mockImplementation(() => new Promise(() => { /* Keep requests pending until the view unmounts. */ }))
    const view = render(<SalesDashboardsPage />)
    const signals = fetchDashboard.mock.calls.map(call => call[3])
    view.unmount()
    expect(signals.every(signal => signal.aborted))
        .toBe(true)
})

it('offers monthly dashboards through the existing keyboard-accessible Sales navigation', async () => {
    render(<SalesReportsPage />)
    const pipeline = screen.getByRole('tab', { name: 'Pipeline' })
    fireEvent.keyDown(pipeline, { key: 'End' })
    const dashboards = screen.getByRole('tab', { name: 'Monthly dashboards' })
    expect(dashboards)
        .toHaveAttribute('aria-selected', 'true')
    expect(dashboards)
        .toHaveFocus()
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledWith('payments', 'sales', 'close', expect.any(AbortSignal)))
    fireEvent.keyDown(dashboards, { key: 'ArrowRight' })
    expect(pipeline)
        .toHaveAttribute('aria-selected', 'true')
})

it('shows percentage units and unknown values in the accessible monthly table', () => {
    render(<SalesDashboardChart chart={{ ...response.charts[0], unit: 'percent' }} />)
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table)
        .getByText('25.5%'))
        .toBeInTheDocument()
    expect(within(table)
        .getByText('—'))
        .toBeInTheDocument()
    expect(within(table)
        .getByText('Sep 2026'))
        .toBeInTheDocument()
})

it('renders every fiscal-year month, including April data and the following March', () => {
    const months = Array.from({ length: 12 }, (_, index) => ({
        month: new Date(Date.UTC(2026, index + 3, 1))
            .toISOString()
            .slice(0, 10),
        values: { amount: index === 0 ? 123.45 : 0 },
    }))
    render(<SalesDashboardChart chart={{ ...response.charts[0], months }} />)
    const table = screen.getByRole('table', { hidden: true })
    const rows = within(table)
        .getAllByRole('row', { hidden: true })
    expect(rows)
        .toHaveLength(14)
    expect(rows[1])
        .toHaveTextContent('Annual$123.45')
    expect(rows[2])
        .toHaveTextContent('Apr 2026$123.45')
    expect(rows[11])
        .toHaveTextContent('Jan 2027')
    expect(rows[13])
        .toHaveTextContent('Mar 2027')
})

it.each([
    [1_500_000, 'currency', '$1.5M'],
    [2_000_000, 'currency', '$2M'],
    [-30_000, 'currency', '-$30K'],
    [0, 'currency', '$0'],
    [40, 'count', '40'],
    [12.5, 'percent', '12.5%'],
] as const)('labels a %s %s axis tick as %s', (value, unit, label) => {
    expect(axisLabel(value, unit))
        .toBe(label)
})

it('totals visible stacked tooltip values, including negative adjustments and unknowns', () => {
    const formatter = chartTooltip('currency')
    const tooltip = { defaultFormatter: () => ['Month<br/>', 'Customer A: $100<br/>', 'Customer B: -$25'] }
    expect(formatter.call(
{ points: [{ y: 100 }, { y: -25 }, { y: null }] } as Highcharts.TooltipFormatterContextObject,
        tooltip as unknown as Highcharts.Tooltip,
    ))
        .toBe('Month<br/><b>Total: $75.00</b><br/>Customer A: $100<br/>Customer B: -$25')
    expect(formatter.call(
{ points: [{ y: 100 }] } as Highcharts.TooltipFormatterContextObject,
        tooltip as unknown as Highcharts.Tooltip,
    ))
        .toContain('<b>Total: $100.00</b>')
    expect(formatter.call(
{ points: [] } as unknown as Highcharts.TooltipFormatterContextObject,
        tooltip as unknown as Highcharts.Tooltip,
    ))
        .toContain('<b>Total: —</b>')
})

it('totals currency and omits annual totals from member counts and percentages', () => {
    const chart: MonthlySalesChart = {
        ...response.charts[0],
        months: [
            { month: '2026-09-01', values: { a: 100, b: -25 } },
            { month: '2026-10-01', values: { a: null, b: null } },
        ],
        series: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
        stacked: true,
    }
    const view = render(<SalesDashboardChart chart={chart} />)
    const table = screen.getByRole('table', { hidden: true })
    expect(within(table)
        .getByRole('columnheader', { hidden: true, name: 'Total' }))
        .toBeInTheDocument()
    expect(within(table)
        .getAllByText('$75.00'))
        .toHaveLength(2)
    const chartOptions = (): Highcharts.Options => (jest.mocked(HighchartsReact).mock.calls.slice(-1)[0][0].options)
    expect(chartOptions().tooltip?.formatter)
        .toBeDefined()
    view.rerender(<SalesDashboardChart chart={{ ...chart, stacked: false, unit: 'count' }} />)
    expect(chartOptions().tooltip?.formatter)
        .toBeUndefined()
    expect(screen.queryByRole('columnheader', { hidden: true, name: 'Total' }))
        .not.toBeInTheDocument()
    expect(screen.queryByRole('rowheader', { hidden: true, name: 'Annual' }))
        .not.toBeInTheDocument()
    expect(screen.getByText(/Counts are unique within each category and month/))
        .toBeInTheDocument()
    view.rerender(<SalesDashboardChart chart={{ ...chart, unit: 'percent' }} />)
    expect(chartOptions().tooltip?.formatter)
        .toBeUndefined()
})

const customerPayments: MonthlySalesChart = {
    description: 'Every customer',
    id: 'payment-customer-all',
    months: [
        { month: '2026-04-01', values: { anz: 0, metro: 5000, rebel: 7500 } },
        { month: '2026-05-01', values: { anz: 8000, metro: 0, rebel: 6500 } },
        { month: '2026-06-01', values: { anz: 7500, metro: 3500, rebel: 7000 } },
    ],
    series: [{ key: 'metro', label: 'Metro' }, { key: 'rebel', label: 'Rebel' }, { key: 'anz', label: 'ANZ' }],
    stacked: true,
    title: 'All customer payments',
    unit: 'currency',
}

it.each(['Goods Sold Customer-Wise', 'Revenue Customer-Wise'])(
    'renders %s with totals directly below the month headers',
    title => {
        render(<SalesCustomerTable title={title} data={customerPayments} />)
        const table = screen.getByRole('table')
        expect(within(table)
            .getAllByRole('columnheader')
            .map(cell => cell.textContent))
            .toEqual(['Customer', 'Annual', 'Apr 2026', 'May 2026', 'Jun 2026'])
        expect(within(table)
            .getByRole('row', { name: /Metro/ }))
            .toHaveTextContent('$8,500.00')
        expect(within(table)
            .getByRole('row', { name: /Rebel/ }))
            .toHaveTextContent('$21,000.00')
        expect(within(table)
            .getByRole('row', { name: /ANZ/ }))
            .toHaveTextContent('$15,500.00')
        expect(within(table)
            .getByRole('row', { name: /^Total/ }).textContent)
            .toBe('Total$45,000.00$12,500.00$14,500.00$18,000.00')
        expect(within(table)
            .getAllByRole('row')[1])
            .toBe(within(table)
                .getByRole('row', { name: /^Total/ }))
        expect(screen.getByRole('region'))
            .toHaveAttribute('tabindex', '0')
        expect(screen.queryByRole('button', { name: /Show all/ })).not.toBeInTheDocument()
    },
)

it('keeps unknown customer amounts distinct from zero and handles an empty dataset', () => {
    const view = render(<SalesCustomerTable
        title='Goods Sold Customer-Wise'
        data={{ ...customerPayments,
            months: [{ month: '2026-04-01', values: { anz: -2.5, metro: null, rebel: 0 } }],
        }}
    />)
    expect(screen.getByRole('row', { name: /Metro/ }))
        .toHaveTextContent('Metro——')
    expect(screen.getByRole('row', { name: /Rebel/ }))
        .toHaveTextContent('Rebel$0.00$0.00')
    expect(screen.getByRole('row', { name: /^Total/ }))
        .toHaveTextContent('Total-$2.50-$2.50')
    view.rerender(<SalesCustomerTable title='Goods Sold Customer-Wise' data={{ ...customerPayments, series: [] }} />)
    expect(screen.getByText('No customer data in this fiscal year.'))
        .toBeInTheDocument()
})

it('places both customer tables at the bottom without duplicate requests or the old customer chart', async () => {
    const ids = [
        'closed-won', 'expected-revenue', 'pipeline-stage', 'won-offering', 'won-deal-category', 'won-customer-type',
    ]
    fetchDashboard.mockImplementation(async section => {
        if (section === 'payments') {
            return { ...response,
                charts: [...response.charts,
                    { ...response.charts[0], id: 'payment-customer', title: 'Member payments by customer' }],
                customerPayments }
        }

        if (section === 'revenue') {
            return { charts: [{ ...response.charts[0], title: 'Revenue report' }],
                customerRevenue: customerPayments,
                notices: [] }
        }

        if (section === 'pipeline') {
            return { charts: ids.map(id => ({ ...response.charts[0], id, title: id })), notices: [] }
        }

        return { charts: [], notices: [] }
    })
    const view = render(<SalesDashboardsPage portal='sales' />)
    const customer = screen.getByRole('region', { name: 'Customer' })
    await within(customer)
        .findByRole('table', { name: 'Revenue Customer-Wise (USD)' })
    for (const name of ['Revenue Customer-Wise (USD)', 'Goods Sold Customer-Wise (USD)']) {
        const table = within(customer)
            .getByRole('table', { name })
        expect(within(table)
            .getByRole('rowheader', { name: 'ANZ' }))
            .toBeInTheDocument()
    }

    expect(Array.from(view.container.querySelectorAll('section'))
        .slice(-1)[0])
        .toBe(customer)
    expect(screen.queryByRole('heading', { name: 'Member payments by customer' })).not.toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bookings Won' }))
        .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bookings in Pipeline' }))
        .toBeInTheDocument()
    ids.forEach(id => expect(screen.queryByRole('heading', { name: id })).not.toBeInTheDocument())
    expect(screen.getByRole('heading', { level: 1 }))
        .toHaveTextContent("Sales - FY '27")
    expect(screen.getByRole('heading', { name: 'Revenue' }))
        .toBeInTheDocument()
    expect(screen.queryByRole('heading', { name: 'Bookings' })).not.toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(6)
})

it('shows customer-source failures independently and retries the shared source only once', async () => {
    fetchDashboard.mockImplementation(async section => {
        if (section === 'revenue') throw new Error('offline')
        return section === 'payments' ? { ...response, customerPayments } : { charts: [], notices: [] }
    })
    render(<SalesDashboardsPage portal='sales' />)
    const customer = screen.getByRole('region', { name: 'Customer' })
    expect(await within(customer)
        .findByRole('alert'))
        .toHaveTextContent('Revenue could not be loaded')
    expect(within(customer)
        .getByRole('table', { name: 'Goods Sold Customer-Wise (USD)' }))
        .toBeInTheDocument()
    fetchDashboard.mockResolvedValue({ charts: [], customerRevenue: customerPayments, notices: ['Partial source.'] })
    fireEvent.click(within(customer)
        .getByRole('button', { name: 'Try again' }))
    expect(await within(customer)
        .findByRole('table', { name: 'Revenue Customer-Wise (USD)' }))
        .toBeInTheDocument()
    expect(within(customer)
        .getByText('Partial source.'))
        .toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(7)
    expect(fetchDashboard)
        .toHaveBeenLastCalledWith('revenue', 'sales', 'close', expect.any(AbortSignal), 'offeringType')
})

it('clears both customer tables on refresh and ignores superseded source responses', async () => {
    const stale: Array<(data: SalesDashboardResponse) => void> = []
    fetchDashboard.mockImplementation(() => new Promise(resolve => { stale.push(resolve) }))
    render(<SalesDashboardsPage portal='sales' />)
    const oldSignals = fetchDashboard.mock.calls.map(call => call[3])
    fetchDashboard.mockImplementation(async section => ({
        charts: [],
        customerPayments: section === 'payments' ? customerPayments : undefined,
        customerRevenue: section === 'revenue' ? customerPayments : undefined,
        notices: [],
    }))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    expect(oldSignals.every(signal => signal.aborted))
        .toBe(true)
    const customer = screen.getByRole('region', { name: 'Customer' })
    await within(customer)
        .findByRole('table', { name: 'Revenue Customer-Wise (USD)' })
    stale.forEach(resolve => resolve({ charts: [], notices: ['Obsolete result'] }))
    await waitFor(() => expect(within(customer)
        .getAllByRole('table'))
        .toHaveLength(2))
    expect(screen.queryByText('Obsolete result')).not.toBeInTheDocument()
    fetchDashboard.mockImplementation(() => new Promise(() => { /* Keep refresh pending. */ }))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await waitFor(() => expect(within(customer)
        .queryAllByRole('table'))
        .toHaveLength(0))
})

it('provides explicit missing-customer-data notices for older APIs and authorization failures', async () => {
    fetchDashboard.mockResolvedValue({ charts: [], notices: [] })
    render(<SalesDashboardsPage />)
    const customer = screen.getByRole('region', { name: 'Customer' })
    expect(await within(customer)
        .findAllByText('Customer details are unavailable for this source.'))
        .toHaveLength(2)
    fetchDashboard.mockRejectedValue({ response: { status: 403 } })
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    expect(await within(customer)
        .findAllByRole('alert'))
        .toHaveLength(2)
    expect(within(customer)
        .queryAllByRole('table'))
        .toHaveLength(0)
})

it('adds an Annual row before all months for single-series charts without treating missing data as zero', () => {
    const chart: MonthlySalesChart = {
        ...response.charts[0],
        months: [
            { month: '2026-04-01', values: { amount: 10.5 } },
            { month: '2027-01-01', values: { amount: -2.25 } },
            { month: '2027-03-01', values: { amount: null } },
        ],
    }
    const view = render(<SalesDashboardChart chart={chart} />)
    let table = screen.getByRole('table', { hidden: true })
    expect(within(table)
        .getAllByRole('row', { hidden: true })[1])
        .toHaveTextContent('Annual$8.25')
    expect(jest.mocked(HighchartsReact).mock.calls.slice(-1)[0][0].options.tooltip.formatter)
        .toBeDefined()
    view.rerender(<SalesDashboardChart chart={{ ...chart,
        months: [{ month: '2026-04-01', values: { amount: null } }],
    }}
    />)
    table = screen.getByRole('table', { hidden: true })
    expect(within(table)
        .getAllByRole('row', { hidden: true })[1])
        .toHaveTextContent('Annual—')
})

/** @returns Independent card sources with category breakdowns and amount/count measures. Does not throw. */
function mockConsolidatedDashboards(): void {
    fetchDashboard.mockImplementation(async (section, portal, basis, signal, groupBy) => {
        const labels = groupBy === 'stage' ? ['Proposal', 'Negotiation']
            : groupBy === 'dealCategory' ? ['Wipro Direct', 'Topcoder Direct']
                : groupBy === 'customerType' ? ['New Customer', 'Extension to Existing Project']
                    : ['AI Training', 'Flexible Talent']
        const chart = (id: string, value: number, unit: MonthlySalesChart['unit'] = 'currency'): MonthlySalesChart => ({
            ...response.charts[0],
            id,
            months: [{ month: '2026-09-01', values: groupBy ? { a: value * 0.3, b: value * 0.7 } : { amount: value } }],
            series: groupBy ? labels.map((label, i) => ({ key: i ? 'b' : 'a', label }))
                : [{ key: 'amount', label: 'Amount' }],
            stacked: !!groupBy,
            unit,
        })
        const charts = section === 'bookings' ? [chart('closed-won', 1000)]
            : section === 'pipeline' ? [chart('pipeline-stage', 1000), chart('expected-revenue', 500)]
                : section === 'revenue' ? [chart('revenue', 1000)]
                    : section === 'payments' ? [chart('payment-type', 1000), chart('members-paid', 2, 'count')]
                        : section === 'taas-payments' ? [chart('taas-payments', 75)]
                            : [chart('flexible-talent', 3, 'count')]
        return { charts,
            customerPayments: section === 'payments' ? customerPayments : undefined,
            customerRevenue: section === 'revenue' ? customerPayments : undefined,
            notices: [] }
    })
}

it('selects independent breakdown dimensions and displays every category in the chart and table', async () => {
    mockConsolidatedDashboards()
    render(<SalesDashboardsPage portal='sales' />)
    const card = (title: string): ReturnType<typeof within> => within(screen.getByRole('article', { name: title }))
    await waitFor(() => expect(card('Bookings Won')
        .getByRole('columnheader', { hidden: true, name: 'AI Training' }))
        .toBeInTheDocument())
    expect(within(card('Bookings Won')
        .getByLabelText('Filter by'))
        .getAllByRole('option')
        .map(option => option.textContent))
        .toEqual(['Offering Type', 'Deal Category', 'Customer Type'])
    expect(within(card('Bookings in Pipeline')
        .getByLabelText('Filter by'))
        .getAllByRole('option')
        .map(option => option.textContent))
        .toEqual(['Stage', 'Offering Type', 'Deal Category', 'Customer Type'])
    expect(card('Bookings in Pipeline')
        .getByLabelText('Filter by'))
        .toHaveValue('stage')
    for (const [title, section, groupBy, label] of [
        ['Bookings Won', 'bookings', 'dealCategory', 'Wipro Direct'],
        ['Bookings in Pipeline', 'pipeline', 'customerType', 'New Customer'],
        ['Revenue Closed', 'revenue', 'customerType', 'New Customer'],
    ]) {
        fireEvent.change(card(title)
            .getByLabelText('Filter by'), { target: { value: groupBy } })
        // eslint-disable-next-line no-await-in-loop -- Exercise each card in sequence to verify independent state.
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenLastCalledWith(section, 'sales', 'close', expect.any(AbortSignal), groupBy))
        // eslint-disable-next-line no-await-in-loop -- The selected card must finish loading before checking its table.
        await waitFor(() => expect(card(title)
            .getByRole('columnheader', { hidden: true, name: label }))
            .toBeInTheDocument())
        expect(card(title)
            .getByRole('row', { hidden: true, name: /^Annual/ }))
            .toHaveTextContent('$300.00$700.00$1,000.00')
        expect(jest.mocked(HighchartsReact).mock.calls.map(call => call[0].options.series))
            .toContainEqual(expect.arrayContaining([expect.objectContaining({ data: [300], name: label })]))
    }

    expect(within(screen.getByRole('table', { name: 'Revenue Customer-Wise (USD)' }))
        .getByRole('row', { name: /^Total/ }))
        .toHaveTextContent('$45,000.00')
    expect(card('Bookings Won')
        .getByLabelText('Filter by'))
        .toHaveValue('dealCategory')
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await waitFor(() => expect(fetchDashboard.mock.calls.slice(-6)
        .slice(0, 3)
        .map(call => call[4]))
        .toEqual(['dealCategory', 'customerType', 'customerType']))
})

it('cancels an obsolete breakdown request and ignores its late response', async () => {
    let resolveOld: (data: SalesDashboardResponse) => void = () => undefined
    fetchDashboard.mockImplementation(async (section, portal, basis, signal, groupBy) => {
        if (section === 'bookings' && groupBy === 'offeringType') {
            return new Promise(resolve => { resolveOld = resolve })
        }

        return { charts: [], notices: ['Current breakdown'] }
    })
    render(<SalesDashboardsPage />)
    const old = fetchDashboard.mock.calls.find(call => call[0] === 'bookings')?.[3]
    fireEvent.change(within(screen.getByRole('article', { name: 'Bookings Won' }))
        .getByLabelText('Filter by'), { target: { value: 'dealCategory' } })
    expect(old?.aborted)
        .toBe(true)
    resolveOld({ charts: [], notices: ['Obsolete breakdown'] })
    await waitFor(() => expect(within(screen.getByRole('article', { name: 'Bookings Won' }))
        .getByText('Current breakdown'))
        .toBeInTheDocument())
    expect(screen.queryByText('Obsolete breakdown')).not.toBeInTheDocument()
})

it.each(['Goods Sold Customer-Wise', 'Revenue Customer-Wise'])(
    'collapses %s to five customers while retaining all-customer totals',
    title => {
        const series = Array.from({ length: 7 }, (_, index) => ({ key: `c${index}`, label: `Client ${index + 1}` }))
        const data: MonthlySalesChart = {
            ...customerPayments,
            months: [{
                month: '2026-04-01',
                values: Object.fromEntries(series.map((item, index) => [item.key, index + 1])),
            }],
            series,
        }
        render(<SalesCustomerTable title={title} data={data} />)
        const table = screen.getByRole('table')
        expect(within(table)
            .getAllByRole('row'))
            .toHaveLength(7)
        expect(within(table)
            .queryByRole('row', { name: /Client 6/ })).not.toBeInTheDocument()
        expect(within(table)
            .getByRole('row', { name: /^Total/ }))
            .toHaveTextContent('Total$28.00$28.00')
        const button = screen.getByRole('button', { name: 'Show all 7 customers' })
        expect(button)
            .toHaveAttribute('aria-expanded', 'false')
        expect(button)
            .toHaveAttribute('aria-controls', table.id)
        fireEvent.click(button)
        expect(button)
            .toHaveAttribute('aria-expanded', 'true')
        expect(within(table)
            .getAllByRole('row'))
            .toHaveLength(9)
        fireEvent.click(screen.getByRole('button', { name: 'Show fewer customers' }))
        expect(within(table)
            .getAllByRole('row'))
            .toHaveLength(7)
        expect(within(table)
            .getByRole('row', { name: /^Total/ }))
            .toHaveTextContent('Total$28.00$28.00')
    },
)

it('switches pipeline and payment measures without refetching and never sums member counts annually', async () => {
    mockConsolidatedDashboards()
    render(<SalesDashboardsPage portal='sales' />)
    await waitFor(() => expect(screen.getAllByRole('figure'))
        .toHaveLength(6))
    const pipeline = within(screen.getByRole('article', { name: 'Bookings in Pipeline' }))
    fireEvent.click(pipeline.getByRole('button', { name: 'Expected Amount' }))
    expect(pipeline.getByRole('row', { hidden: true, name: /^Annual/ }))
        .toHaveTextContent('$150.00$350.00$500.00')
    const payments = within(screen.getByRole('article', { name: 'Topcoder Payments' }))
    fireEvent.click(payments.getByRole('button', { name: 'Count' }))
    expect(payments.queryByRole('rowheader', { hidden: true, name: 'Annual' })).not.toBeInTheDocument()
    expect(payments.getByRole('cell', { hidden: true, name: '2' }))
        .toBeInTheDocument()
    const talent = within(screen.getByRole('article', { name: 'Members Engaged' }))
    expect(talent.queryByRole('rowheader', { hidden: true, name: 'Annual' })).not.toBeInTheDocument()
    expect(screen.getByRole('article', { name: 'TaaS Payments' }))
        .toHaveTextContent('$75.00')
    fireEvent.click(payments.getByRole('button', { name: 'Amount' }))
    expect(payments.getByRole('row', { hidden: true, name: 'Annual $1,000.00' }))
        .toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(6)
})

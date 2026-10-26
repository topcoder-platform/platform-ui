/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null, react/function-component-definition */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import Highcharts from 'highcharts'
import HighchartsReact from 'highcharts-react-official'
import SalesDashboardsPage from './SalesDashboardsPage'
import SalesReportsPage from './SalesReportsPage'
import SalesCustomerPaymentsTable from './SalesCustomerPaymentsTable'
import SalesDashboardChart, { axisLabel, stackedTooltip } from './SalesDashboardChart'
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

beforeEach(() => {
    jest.clearAllMocks()
    fetchDashboard.mockResolvedValue({ charts: [], notices: [] })
})

it.each([undefined, 'reports', 'sales'] as Array<SalesDashboardPortal | undefined>)(
    'loads only active sections with the correct scope for portal %s',
    async portal => {
        render(<SalesDashboardsPage portal={portal} />)
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(4))
        expect(fetchDashboard.mock.calls.map(call => [call[0], call[1]]))
            .toEqual(['pipeline', 'revenue', 'payments', 'talent'].map(section => [section, portal ?? 'reports']))
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
            .toHaveBeenCalledTimes(4))
        fireEvent.click(screen.getByRole('button', { name: 'Created date' }))
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(5))
        expect(fetchDashboard)
            .toHaveBeenLastCalledWith('pipeline', portal, 'created', expect.any(AbortSignal))
        fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
        await waitFor(() => expect(fetchDashboard)
            .toHaveBeenCalledTimes(9))
        expect(fetchDashboard.mock.calls.slice(5)
            .map(call => call[0]))
            .toEqual(['pipeline', 'revenue', 'payments', 'talent'])
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
    expect(screen.getByText('Revenue report pending configuration.'))
        .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Member payments by type' }))
        .toBeInTheDocument()
    fetchDashboard.mockResolvedValue({ charts: [], notices: ['Talent data loaded.'] })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Talent data loaded.'))
        .toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(5)
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
        .toHaveLength(13)
    expect(rows[1])
        .toHaveTextContent('Apr 2026$123.45')
    expect(rows[10])
        .toHaveTextContent('Jan 2027')
    expect(rows[12])
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
    const formatter = stackedTooltip('currency')
    const tooltip = { defaultFormatter: () => ['Month<br/>', 'Customer A: $100<br/>', 'Customer B: -$25'] }
    expect(formatter.call(
{ points: [{ y: 100 }, { y: -25 }, { y: null }] } as Highcharts.TooltipFormatterContextObject,
        tooltip as unknown as Highcharts.Tooltip,
    ))
        .toContain('<b>Total: $75.00</b>')
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

it('shows totals for stacked splits without summing overlapping talent counts or percentages', () => {
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
        .getByText('$75.00'))
        .toBeInTheDocument()
    const chartOptions = (): Highcharts.Options => (jest.mocked(HighchartsReact).mock.calls.slice(-1)[0][0].options)
    expect(chartOptions().tooltip?.formatter)
        .toBeDefined()
    view.rerender(<SalesDashboardChart chart={{ ...chart, stacked: false, unit: 'count' }} />)
    expect(chartOptions().tooltip?.formatter)
        .toBeUndefined()
    expect(screen.queryByRole('columnheader', { hidden: true, name: 'Total' })).not.toBeInTheDocument()
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

it('renders a customer-by-month matrix with accurate row, column and grand totals', () => {
    render(<SalesCustomerPaymentsTable data={customerPayments} />)
    const table = screen.getByRole('table')
    expect(within(table)
        .getAllByRole('columnheader')
        .map(cell => cell.textContent))
        .toEqual(['Customer', 'Apr 2026', 'May 2026', 'Jun 2026', 'Total'])
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
        .toBe('Total$12,500.00$14,500.00$18,000.00$45,000.00')
    expect(screen.getByRole('region'))
        .toHaveAttribute('tabindex', '0')
})

it('keeps unknown customer amounts distinct from zero and handles an empty dataset', () => {
    const view = render(<SalesCustomerPaymentsTable data={{ ...customerPayments,
        months: [{ month: '2026-04-01', values: { anz: -2.5, metro: null, rebel: 0 } }],
    }}
    />)
    expect(screen.getByRole('row', { name: /Metro/ }))
        .toHaveTextContent('Metro——')
    expect(screen.getByRole('row', { name: /Rebel/ }))
        .toHaveTextContent('Rebel$0.00$0.00')
    expect(screen.getByRole('row', { name: /^Total/ }))
        .toHaveTextContent('Total-$2.50-$2.50')
    view.rerender(<SalesCustomerPaymentsTable data={{ ...customerPayments, series: [] }} />)
    expect(screen.getByText('No customer payments in this fiscal year.'))
        .toBeInTheDocument()
})

it('uses the full customer dataset below payment charts and renders all new won-booking charts', async () => {
    const ids = [
        'closed-won', 'expected-revenue', 'pipeline-stage', 'won-offering', 'won-deal-category', 'won-customer-type',
    ]
    fetchDashboard.mockImplementation(async section => {
        if (section === 'payments') return { ...response, customerPayments }
        if (section === 'pipeline') {
            return { charts: ids.map(id => ({ ...response.charts[0], id, title: id })), notices: [] }
        }

        return { charts: [], notices: [] }
    })
    render(<SalesDashboardsPage portal='sales' />)
    const table = await screen.findByRole('table', { name: 'All customers, monthly payments and totals (USD)' })
    expect(within(table)
        .getByRole('rowheader', { name: 'ANZ' }))
        .toBeInTheDocument()
    ids.forEach(id => expect(screen.getByRole('heading', { name: id }))
        .toBeInTheDocument())
    expect(screen.getByText('Member payments and flexible talent include customer work only.'))
        .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Bookings' }))
        .toBeInTheDocument()
})

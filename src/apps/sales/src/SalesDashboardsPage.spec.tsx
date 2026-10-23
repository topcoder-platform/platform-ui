/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null, react/function-component-definition */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import SalesDashboardsPage from './SalesDashboardsPage'
import SalesReportsPage from './SalesReportsPage'
import SalesDashboardChart, { axisLabel, chartHeadline } from './SalesDashboardChart'
import {
    fetchSalesDashboard,
    MonthlySalesChart,
    SalesDashboardPortal,
    SalesDashboardResponse,
} from './sales-dashboard.service'

jest.mock('./sales-dashboard.service', () => ({ fetchSalesDashboard: jest.fn() }))
jest.mock('./SalesPage', () => () => <div>Existing pipeline</div>)
jest.mock('./SalesProgressionPage', () => () => <div>Existing progression</div>)
jest.mock('highcharts-react-official', () => () => <div data-testid='monthly-chart' />)
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

/**
 * @param offset Months from the current UTC month.
 * @returns That month's first day, as the API sends it. Does not throw.
 */
function utcMonth(offset: number): string {
    const now = new Date()
    return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth() + offset, 1))
        .toISOString()
        .slice(0, 10)
}

/**
 * @param values Monthly values, oldest first.
 * @param overrides Chart fields to replace.
 * @param last Offset of the final month from the current UTC month.
 * @returns A test chart. Does not throw.
 */
function monthlyChart(
    values: Array<Record<string, number | null>>,
    overrides: Partial<MonthlySalesChart> = {},
    last: number = 0,
): MonthlySalesChart {
    return {
        description: 'Monthly values',
        id: 'chart',
        months: values.map((value, index) => ({ month: utcMonth(index - values.length + 1 + last), values: value })),
        series: [{ key: 'a', label: 'A' }, { key: 'b', label: 'B' }],
        stacked: true,
        title: 'Chart',
        unit: 'currency',
        ...overrides,
    }
}

it('headlines the current month stack total against the full previous month', () => {
    expect(chartHeadline(monthlyChart([{ a: 900, b: null }, { a: 1000, b: 500 }, { a: 2000, b: 301 }])))
        .toEqual({
            caption: 'Current month to date',
            figures: [{ change: { direction: 'up', text: '+53.4% vs last month' }, label: undefined, value: 2301 }],
        })
    expect(chartHeadline(monthlyChart([{ a: 1000 }, { a: 540 }]))?.figures[0].change)
        .toEqual({ direction: 'down', text: '-46.0% vs last month' })
})

it('headlines each series of a chart whose series cannot be added together', () => {
    const talent = monthlyChart([{ a: 9, b: 64 }, { a: 11, b: 64 }], { stacked: false, unit: 'count' })
    expect(chartHeadline(talent)?.figures)
        .toEqual([
            { change: { direction: 'up', text: '+22.2% vs last month' }, label: 'A', value: 11 },
            { change: { direction: 'flat', text: '0.0% vs last month' }, label: 'B', value: 64 },
        ])
    expect(chartHeadline({ ...talent, stacked: true })?.caption)
        .toBe('Current month to date · sums the stacked series')
})

it('uses percentage points for percent charts and omits changes it cannot calculate', () => {
    const series = [{ key: 'a', label: 'Markup' }]
    expect(chartHeadline(monthlyChart([{ a: 32.2 }, { a: 32.9 }], { series, stacked: false, unit: 'percent' }))
        ?.figures[0].change)
        .toEqual({ direction: 'up', text: '+0.7 pp vs last month' })
    expect(chartHeadline(monthlyChart([{ a: 0 }, { a: 10 }], { series, stacked: false }))?.figures[0])
        .toEqual({ change: undefined, label: undefined, value: 10 })
    expect(chartHeadline(monthlyChart([{ a: 5 }, { a: null }], { series, stacked: false }))?.figures[0])
        .toEqual({ change: undefined, label: undefined, value: 5 })
    expect(chartHeadline(monthlyChart([{ a: null }, { a: null }], { series, stacked: false }))?.figures[0])
        .toEqual({ change: undefined, label: undefined, value: null })
    expect(chartHeadline(monthlyChart([])))
        .toBeUndefined()
})

it('labels expected closes only when asked, and names the month when the chart ends before today', () => {
    const pipeline = monthlyChart([{ a: 1 }, { a: 2 }, { a: 3 }], {}, 1)
    expect(chartHeadline(pipeline, true)?.figures[0].value)
        .toBe(2)
    expect(chartHeadline(pipeline, true)?.caption)
        .toBe('Current month, including expected closes')
    expect(chartHeadline(pipeline)?.caption)
        .toBe('Current month to date')
    expect(chartHeadline(
        monthlyChart([{ a: 1 }, { a: 2 }]),
        true,
        new Date(Date.UTC(2100, 0, 1)),
    )?.caption)
        .toBe(new Date(`${utcMonth(0)}T00:00:00Z`)
            .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' }))
})

it('headlines the latest month with data while the current month has nothing recorded', () => {
    const revenue = monthlyChart([{ a: 208_055.8, b: 0 }, { a: 1_493_615.32, b: 0 }, { a: 0, b: null }])
    expect(chartHeadline(revenue))
        .toEqual({
            caption: `${new Date(`${utcMonth(-1)}T00:00:00Z`)
                .toLocaleDateString('en-US', { month: 'long', timeZone: 'UTC', year: 'numeric' })}`
                + ', the latest month with data',
            figures: [{
                change: { direction: 'up', text: '+617.9% vs previous month' },
                label: undefined,
                value: 1_493_615.32,
            }],
        })
    expect(chartHeadline(monthlyChart([{ a: 0 }, { a: 0 }]))?.caption)
        .toBe('Current month to date')
})

it('renders headlines, with expected closes only for pipeline charts grouped by close date', async () => {
    const pipeline = monthlyChart([{ a: 3_000_000, b: 0 }, { a: 4_377_046, b: 0 }, { a: 1, b: 0 }], {}, 1)
    fetchDashboard.mockImplementation(async section => (section === 'pipeline'
        ? { charts: [{ ...pipeline, title: 'Total opportunity size' }], notices: [] }
        : { charts: [], notices: [] }))
    render(<SalesDashboardsPage portal='sales' />)
    expect(await screen.findByText('$4,377,046', { selector: 'strong' }))
        .toBeInTheDocument()
    expect(screen.getByText('+45.9% vs last month'))
        .toBeInTheDocument()
    expect(screen.getByText('Current month, including expected closes'))
        .toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Created date' }))
    expect(await screen.findByText('Current month to date'))
        .toBeInTheDocument()
})

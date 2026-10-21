/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null, react/function-component-definition */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import SalesDashboardsPage from './SalesDashboardsPage'
import SalesReportsPage from './SalesReportsPage'
import SalesDashboardChart from './SalesDashboardChart'
import { fetchSalesDashboard, SalesDashboardPortal, SalesDashboardResponse } from './sales-dashboard.service'

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

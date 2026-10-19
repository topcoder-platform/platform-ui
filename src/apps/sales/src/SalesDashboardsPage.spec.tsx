/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
/* eslint-disable unicorn/no-null, react/function-component-definition */
import '@testing-library/jest-dom'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import SalesDashboardsPage from './SalesDashboardsPage'
import SalesReportsPage from './SalesReportsPage'
import SalesDashboardChart from './SalesDashboardChart'
import { fetchSalesDashboard, SalesDashboardResponse } from './sales-dashboard.service'

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
        description: 'Monthly markup',
        id: 'margin',
        months: [{ month: '2026-09-01', values: { markup: 25.5 } }, { month: '2026-10-01', values: { markup: null } }],
        series: [{ key: 'markup', label: 'Average markup' }],
        stacked: false,
        title: 'Average monthly markup',
        unit: 'percent',
    }],
    notices: [],
}

beforeEach(() => {
    jest.clearAllMocks()
    fetchDashboard.mockResolvedValue({ charts: [], notices: [] })
})

it('loads Reports with all payment types and Sales with customer work scope', async () => {
    const view = render(<SalesDashboardsPage />)
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(5))
    expect(fetchDashboard.mock.calls.every(call => call[1] === 'reports'))
        .toBe(true)
    view.unmount()
    render(<SalesDashboardsPage portal='sales' />)
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(10))
    expect(fetchDashboard.mock.calls.slice(5)
        .every(call => call[1] === 'sales'))
        .toBe(true)
})

it('changes only pipeline grouping and refreshes all sections', async () => {
    render(<SalesDashboardsPage portal='sales' />)
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(5))
    fireEvent.click(screen.getByRole('button', { name: 'Created date' }))
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(6))
    expect(fetchDashboard)
        .toHaveBeenLastCalledWith('pipeline', 'sales', 'created', expect.any(AbortSignal))
    fireEvent.click(screen.getByRole('button', { name: 'Refresh data' }))
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(11))
})

it('keeps independent sections usable when one source fails and retries just that source', async () => {
    fetchDashboard.mockImplementation(async section => {
        if (section === 'talent') throw new Error('offline')
        if (section === 'revenue') return { charts: [], notices: ['Revenue report pending configuration.'] }
        return section === 'gross-margin' ? response : { charts: [], notices: [] }
    })
    render(<SalesDashboardsPage />)
    expect(await screen.findByRole('alert'))
        .toHaveTextContent('Flexible talent could not be loaded')
    expect(screen.getByText('Revenue report pending configuration.'))
        .toBeInTheDocument()
    expect(screen.getByRole('heading', { name: 'Average monthly markup' }))
        .toBeInTheDocument()
    fetchDashboard.mockResolvedValue({ charts: [], notices: ['Talent data loaded.'] })
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    expect(await screen.findByText('Talent data loaded.'))
        .toBeInTheDocument()
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(6)
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
    render(<SalesDashboardChart chart={response.charts[0]} />)
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

/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { ButtonHTMLAttributes } from 'react'
import { fireEvent, render, screen, waitFor, within } from '@testing-library/react'

import { fetchSalesDashboard, SalesDashboardResponse } from './sales-dashboard.service'
import SalesGoodsSold from './SalesGoodsSold'

jest.mock('./sales-dashboard.service', () => ({ fetchSalesDashboard: jest.fn() }))
jest.mock('~/libs/ui', () => ({
    Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button type='button' onClick={props.onClick} disabled={props.disabled}>{props.children}</button>
    ),
    LoadingSpinner: (props: { message: string }) => <span role='status'>{props.message}</span>,
}), { virtual: true })

const response: SalesDashboardResponse = {
    charts: [],
    customerPayments: {
        description: '',
        id: 'payments',
        months: [
            { month: '2026-04-01', values: { a: 100, b: 50 } },
            { month: '2026-05-01', values: { a: 200, b: -20 } },
        ],
        series: [{ key: 'a', label: 'Acme' }, { key: 'b', label: 'Beta' }],
        stacked: true,
        title: '',
        unit: 'currency',
    },
    filterOptions: { offeringType: ['AI Training', 'Flexible Talent', 'TopGear'] },
    notices: [],
}
response.customerBookingCosts = {
    ...response.customerPayments!,
    months: [
        { month: '2026-04-01', values: { a: 125, b: 60 } },
        { month: '2026-05-01', values: { a: 250, b: -25 } },
    ],
}
const fetchDashboard = jest.mocked(fetchSalesDashboard)
const source = { data: response, retry: jest.fn() }
const table = (): HTMLElement => screen.getByRole('table', { name: 'Goods Sold Customer-Wise (USD)' })
const total = (): HTMLElement => within(table())
    .getByRole('row', { name: /^Total / })
const apply = (): void => {
    fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
}

beforeEach(() => {
    jest.clearAllMocks()
    fetchDashboard.mockResolvedValue(response)
})

it('switches member/booking amounts and quarterly totals without refetching', () => {
    const view = render(<SalesGoodsSold source={source} portal='sales' refreshKey={0} period='Monthly' />)
    expect(total())
        .toHaveTextContent('$330.00')
    fireEvent.click(screen.getByRole('button', { name: 'Booking Cost' }))
    expect(total())
        .toHaveTextContent('$410.00')
    expect(within(table())
        .getByRole('row', { name: /^Acme / }))
        .toHaveTextContent('$375.00')
    view.rerender(<SalesGoodsSold source={source} portal='sales' refreshKey={0} period='Quarterly' />)
    expect(within(total())
        .getAllByText('$410.00'))
        .toHaveLength(2)
    fireEvent.click(screen.getByRole('button', { name: 'Member Payment' }))
    expect(total())
        .toHaveTextContent('$330.00')
    expect(fetchDashboard).not.toHaveBeenCalled()
})

it('applies both dates and multiple offerings, then resets to the shared source', async () => {
    render(<SalesGoodsSold source={source} portal='sales' refreshKey={0} period='Monthly' />)
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-04-15' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-05-20' } })
    fireEvent.click(screen.getByLabelText('AI Training'))
    fireEvent.click(screen.getByLabelText('Flexible Talent'))
    expect(fetchDashboard).not.toHaveBeenCalled()
    apply()
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(1))
    expect(fetchDashboard)
        .toHaveBeenLastCalledWith('payments', 'sales', 'close', expect.any(AbortSignal), undefined, {
            endDate: '2026-05-20', offeringType: ['AI Training', 'Flexible Talent'], startDate: '2026-04-15',
        })
    expect(await screen.findByRole('columnheader', { name: 'Period total' }))
        .toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Reset filters' }))
    expect(screen.getByRole('columnheader', { name: 'Annual' }))
        .toBeInTheDocument()
    expect(screen.getByLabelText('ALL'))
        .toBeChecked()
    expect(fetchDashboard.mock.calls[0][3].aborted)
        .toBe(true)
    expect(fetchDashboard)
        .toHaveBeenCalledTimes(1)
})

it('rejects reversed dates without requesting or changing the displayed report', () => {
    render(<SalesGoodsSold source={source} portal='reports' refreshKey={0} period='Monthly' />)
    fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-05-21' } })
    fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-05-20' } })
    apply()
    expect(screen.getByRole('alert'))
        .toHaveTextContent('From date must be on or before To date.')
    expect(fetchDashboard).not.toHaveBeenCalled()
    expect(total())
        .toHaveTextContent('$330.00')
})

it('cancels superseded filters and retries failed filtered requests with the same scope', async () => {
    fetchDashboard.mockImplementationOnce(() => new Promise(() => { /* Superseded request. */ }))
    fetchDashboard.mockRejectedValueOnce(new Error('offline'))
    const view = render(<SalesGoodsSold source={source} portal='reports' refreshKey={0} period='Monthly' />)
    apply()
    const firstSignal = fetchDashboard.mock.calls[0][3]
    fireEvent.click(screen.getByLabelText('TopGear'))
    apply()
    expect(firstSignal.aborted)
        .toBe(true)
    expect(await screen.findByRole('alert'))
        .toHaveTextContent('Member payments could not be loaded')
    fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
    await screen.findByRole('table', { name: 'Goods Sold Customer-Wise (USD)' })
    expect(fetchDashboard.mock.calls[2][5]?.offeringType)
        .toEqual(['TopGear'])
    view.rerender(<SalesGoodsSold source={source} portal='reports' refreshKey={1} period='Monthly' />)
    await waitFor(() => expect(fetchDashboard)
        .toHaveBeenCalledTimes(4))
    view.unmount()
    expect(fetchDashboard.mock.calls[3][3].aborted)
        .toBe(true)
})

it('shows an empty filtered result and does not substitute payments for missing booking costs', async () => {
    fetchDashboard.mockResolvedValue({ ...response, customerPayments: { ...response.customerPayments!, series: [] } })
    render(<SalesGoodsSold
        source={{ ...source, data: { ...response, customerBookingCosts: undefined } }}
        portal='sales'
        refreshKey={0}
        period='Monthly'
    />)
    fireEvent.click(screen.getByRole('button', { name: 'Booking Cost' }))
    expect(screen.getByText('Booking cost details are unavailable for this source.'))
        .toBeInTheDocument()
    expect(screen.queryByRole('table')).not.toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Member Payment' }))
    apply()
    expect(await screen.findByText('No customer data matches these filters.'))
        .toBeInTheDocument()
})

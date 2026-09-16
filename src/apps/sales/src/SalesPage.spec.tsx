/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor } from '@testing-library/react'
import { ButtonHTMLAttributes, ChangeEvent, ReactNode } from 'react'

import SalesPage from './SalesPage'
import { SalesReport } from './sales.models'
import { fetchSalesReport } from './sales.service'

jest.mock('./sales.service', () => ({
    fetchSalesReport: jest.fn(),
    salesErrorMessage: () => 'Unable to refresh. Please try again.',
}))

jest.mock('~/libs/ui', () => ({
    Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button disabled={props.disabled} onClick={props.onClick} type={props.type === 'submit' ? 'submit' : 'button'}>
            {props.children}
        </button>
    ),
    IconOutline: { RefreshIcon: () => <span /> },
    InputText: (props: {
        label: string; disabled?: boolean; name: string; value: string;
        onChange: (event: ChangeEvent<HTMLInputElement>) => void
    }) => (
        <label htmlFor={props.name}>
            {props.label}
            <input disabled={props.disabled} id={props.name} value={props.value} onChange={props.onChange} />
        </label>
    ),
    LoadingSpinner: (props: { message: string }) => <span>{props.message}</span>,
    PageTitle: (props: { children: ReactNode }) => <title>{props.children}</title>,
}), { virtual: true })

const fetchReport = fetchSalesReport as jest.MockedFunction<typeof fetchSalesReport>

/** Creates non-customer Sales test data. @returns A synthetic report page. Does not throw. */
function fixture(): SalesReport {
    return {
        allData: true,
        columns: [{ dataType: 'string', id: 'NAME', label: 'Opportunity' }],
        page: 1,
        perPage: 25,
        refreshAfterSeconds: 60,
        refreshedAt: '2026-09-16T02:00:00Z',
        reportId: 'test-report',
        reportName: 'Bookings By Stage',
        rows: [{ cells: [{ label: 'Example opportunity', value: 'record-id' }], id: '0:0' }],
        sourceRowCount: 30,
        total: 30,
        totalPages: 2,
    }
}

describe('Sales page', () => {
    beforeEach(() => fetchReport.mockReset()
        .mockResolvedValue(fixture()))

    it('renders live metadata and sends search, column filters, sorting and pagination to the API', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Example' } })
        fireEvent.change(screen.getByLabelText('Filter field'), { target: { value: 'NAME' } })
        fireEvent.change(screen.getByLabelText('Contains'), { target: { value: 'opportunity' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                filterColumn: 'NAME', filterValue: 'opportunity', page: 1, search: 'Example',
            }), expect.any(AbortSignal)))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Opportunity' }))
            .not.toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'Opportunity' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ sortBy: 'NAME', sortOrder: 'asc' }),
                expect.any(AbortSignal),
            ))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Next' }))
            .not.toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal)))
    })

    it('refreshes without losing filters and labels retained data after failure', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fetchReport.mockRejectedValueOnce(new Error('upstream'))
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await screen.findByText('Showing previously loaded data')
        expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ refresh: true }), expect.any(AbortSignal))
        expect(screen.getByText('Example opportunity'))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        await waitFor(() => expect(screen.queryByRole('alert')).not.toBeInTheDocument())
    })

    it('removes previously loaded sales data when authorization is revoked', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fetchReport.mockRejectedValueOnce({ response: { status: 403 } })
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await screen.findByText('Unable to load sales data')
        expect(screen.queryByText('Example opportunity')).not.toBeInTheDocument()
    })

    it('shows completeness and empty-result states without rendering upstream markup', async () => {
        fetchReport.mockResolvedValueOnce({ ...fixture(), allData: false, rows: [], total: 0, totalPages: 0 })
        render(<SalesPage />)
        await screen.findByText('No sales records found')
        expect(screen.getByText(/Salesforce returned a limited set/))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Next' }))
            .toBeDisabled()
    })

    it('refreshes visible tabs every minute and stops polling after unmount', async () => {
        jest.useFakeTimers()
        const visibility = jest.spyOn(document, 'visibilityState', 'get')
            .mockReturnValue('visible')
        const view = render(<SalesPage />)
        await act(async () => { await Promise.resolve() })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(2)
        visibility.mockReturnValue('hidden')
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(2)
        visibility.mockReturnValue('visible')
        await act(async () => { fireEvent(document, new Event('visibilitychange')) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(3)
        view.unmount()
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(3)
        visibility.mockRestore()
        jest.useRealTimers()
    })
})

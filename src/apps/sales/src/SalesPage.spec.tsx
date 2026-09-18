/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'

import SalesPage from './SalesPage'
import { fetchOpportunity } from './opportunity.service'
import { SalesReport } from './sales.models'
import { fetchSalesReport } from './sales.service'

jest.mock('./sales.service', () => ({
    fetchSalesReport: jest.fn(),
    salesErrorMessage: () => 'Unable to refresh. Please try again.',
}))

jest.mock('./opportunity.service', () => ({
    fetchOpportunity: jest.fn(),
    opportunityErrorMessage: () => 'We could not load the opportunity details. Please try again.',
}))

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: { buttons?: ReactNode; children: ReactNode; open: boolean; title: ReactNode }) => (
        props.open ? (
            <div role='dialog'>
                <h2>{props.title}</h2>
                {props.children}
                {props.buttons}
            </div>
        ) : undefined
    ),
    Button: (props: ButtonHTMLAttributes<HTMLButtonElement>) => (
        <button disabled={props.disabled} onClick={props.onClick} type={props.type === 'submit' ? 'submit' : 'button'}>
            {props.children}
        </button>
    ),
    IconOutline: { RefreshIcon: () => <span /> },
    LoadingSpinner: (props: { message: string }) => <span>{props.message}</span>,
    PageTitle: (props: { children: ReactNode }) => <title>{props.children}</title>,
}), { virtual: true })

const fetchReport = fetchSalesReport as jest.MockedFunction<typeof fetchSalesReport>
const fetchOpportunityDetails = fetchOpportunity as jest.MockedFunction<typeof fetchOpportunity>

/** Creates non-customer Sales test data. @returns A synthetic report page. Does not throw. */
function fixture(): SalesReport {
    return {
        allData: true,
        columns: [
            { dataType: 'picklist', id: 'STAGE_NAME', label: 'Stage' },
            { dataType: 'string', id: 'NAME', label: 'Opportunity' },
            { dataType: 'currency', id: 'AMOUNT', label: 'Amount' },
            { dataType: 'datetime', id: 'CREATED_DATE', label: 'Created Date' },
            { dataType: 'date', id: 'CLOSE_DATE', label: 'Close Date' },
        ],
        page: 1,
        perPage: 25,
        refreshAfterSeconds: 60,
        refreshedAt: '2026-09-16T02:00:00Z',
        reportId: 'test-report',
        reportName: 'Bookings By Stage',
        rows: [{
            cells: [
                { label: 'Proposal', value: 'Proposal' },
                { label: 'Example opportunity', value: 'record-id' },
                { currencyCode: 'USD', label: '$1,000', value: 1000 },
                { label: '9/1/2026', value: '2026-09-01T10:00:00Z' },
                { label: '9/30/2026', value: '2026-09-30' },
            ],
            id: '0:0',
        }],
        sourceRowCount: 30,
        summary: {
            amounts: [{
                columnId: 'AMOUNT_CONVERTED',
                count: 28,
                currencyCode: 'USD',
                label: 'Amount (converted)',
                mixedCurrency: false,
                total: 1234567,
            }, {
                columnId: 'AMOUNT',
                count: 28,
                label: 'Amount',
                mixedCurrency: false,
                total: 987654,
            }, {
                columnId: 'EXP_AMOUNT',
                count: 28,
                label: 'Expected Revenue',
                mixedCurrency: false,
                total: 555555,
            }, {
                columnId: 'LOCAL_FEE',
                count: 3,
                label: 'Local fee',
                mixedCurrency: true,
                total: 2468,
            }],
            groups: [{
                amountColumnId: 'AMOUNT',
                buckets: [{ count: 18, label: 'Proposal', total: 900000 }],
                columnId: 'STAGE_NAME',
                currencyCode: 'USD',
                label: 'Stage',
                mixedCurrency: false,
                otherBuckets: 2,
            }],
            recordCount: 30,
        },
        total: 30,
        totalPages: 2,
    }
}

/** @returns The Clear control of the named section, keeping the two Clear buttons apart. Does not throw. */
function clearButton(section: string): HTMLElement {
    return within(screen.getByRole('region', { name: section }))
        .getByRole('button', { name: 'Clear' })
}

describe('Sales page', () => {
    beforeEach(() => {
        fetchOpportunityDetails.mockReset()
        fetchReport.mockReset()
            .mockResolvedValue(fixture())
    })

    it('renders live metadata and sends search, column filters, sorting and pagination to the API', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Example' } })
        fireEvent.change(screen.getByLabelText('Filter field'), { target: { value: 'NAME' } })
        fireEvent.change(screen.getByLabelText('Contains'), { target: { value: 'opportunity' } })
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

    it('searches as the user types after a short pause and applies immediately on enter', async () => {
        jest.useFakeTimers()
        render(<SalesPage />)
        await act(async () => { await Promise.resolve() })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Tal' } })
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Talent' } })
        await act(async () => { jest.advanceTimersByTime(399) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        await act(async () => { jest.advanceTimersByTime(1) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(2)
        expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ page: 1, search: 'Talent' }), expect.any(AbortSignal))
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Talent search' } })
        await act(async () => { fireEvent.submit(screen.getByLabelText('Search sales')) })
        expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ search: 'Talent search' }), expect.any(AbortSignal))
        await act(async () => { jest.advanceTimersByTime(400) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(3)
        expect(screen.queryByRole('button', { name: 'Apply' })).not.toBeInTheDocument()
        jest.useRealTimers()
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

    it('offers the report date fields, defaults to Created Date and applies a range as it changes', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const field = screen.getByLabelText('Filter type') as HTMLSelectElement
        expect([...field.options].map(option => option.text))
            .toEqual(['Created Date', 'Close Date'])
        expect(field.value)
            .toBe('CREATED_DATE')
        fireEvent.change(field, { target: { value: 'CLOSE_DATE' } })
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-07-01' } })
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-30' } })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        expect(screen.queryByRole('button', { name: 'Apply filter' })).not.toBeInTheDocument()
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                dateColumn: 'CLOSE_DATE', dateFrom: '2026-07-01', dateTo: '2026-09-30', page: 1,
            }), expect.any(AbortSignal)))
        // The three changes within one pause are sent as a single request.
        expect(fetchReport)
            .toHaveBeenCalledTimes(2)
        await screen.findByText(/Showing records by Close Date from 2026-07-01 through 2026-09-30/)
    })

    it('refuses an inverted range without sending a request and clears the error on Clear', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-30' } })
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-09-01' } })
        await screen.findByText('The From date must be on or before the To date.')
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        fireEvent.click(clearButton('Date range filter'))
        await waitFor(() => expect(screen.queryByText('The From date must be on or before the To date.'))
            .not.toBeInTheDocument())
        expect(screen.getByLabelText('From date'))
            .toHaveValue('')
        await screen.findByText('No date range applied.')
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
    })

    it('clears an applied range and keeps the range when report filters are cleared', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } })
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ dateColumn: 'CREATED_DATE', dateFrom: '2026-09-01' }),
                expect.any(AbortSignal),
            ))
        fireEvent.change(screen.getByLabelText('Search sales'), { target: { value: 'Example' } })
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ dateFrom: '2026-09-01', search: 'Example' }),
                expect.any(AbortSignal),
            ))
        // Clearing the report filters must not silently empty the separate date range.
        fireEvent.click(clearButton('Sales report'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.not.objectContaining({ search: 'Example' }),
                expect.any(AbortSignal),
            ))
        expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ dateColumn: 'CREATED_DATE', dateFrom: '2026-09-01' }),
                expect.any(AbortSignal),
            )
        fireEvent.click(clearButton('Date range filter'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ dateColumn: undefined, dateFrom: undefined, dateTo: undefined }),
                expect.any(AbortSignal),
            ))
        await screen.findByText('No date range applied.')
    })

    it('shows totals for every matching record without per-tile record counts', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        expect(screen.getByText('$1,234,567'))
            .toBeInTheDocument()
        // The plain Amount is redundant beside Amount (converted), so its tile is hidden.
        expect(screen.queryByText('$987,654'))
            .not.toBeInTheDocument()
        // An uncoded single-currency total reads in dollars like the converted columns.
        expect(screen.getByText('$555,555'))
            .toBeInTheDocument()
        expect(screen.getByText('2,468'))
            .toBeInTheDocument()
        expect(screen.getByText('Totals mix currencies.'))
            .toBeInTheDocument()
        expect(screen.queryByText('Matching records'))
            .not.toBeInTheDocument()
        expect(screen.queryByText(/records with a value/))
            .not.toBeInTheDocument()
        expect(screen.getByText('Stage breakdown'))
            .toBeInTheDocument()
        expect(screen.getByText('18 records'))
            .toBeInTheDocument()
        expect(screen.getByText('2 further values not shown.'))
            .toBeInTheDocument()
    })

    it('disables the range and hides totals for a report that provides neither', async () => {
        fetchReport.mockResolvedValue({
            ...fixture(),
            columns: [{ dataType: 'string', id: 'NAME', label: 'Opportunity' }],
            rows: [{ cells: [{ label: 'Example opportunity', value: 'record-id' }], id: '0:0' }],
            summary: undefined,
        })
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        expect(screen.getByLabelText('Filter type'))
            .toBeDisabled()
        expect(screen.getByLabelText('From date'))
            .toBeDisabled()
        expect(screen.queryByText('Opportunities'))
            .not.toBeInTheDocument()
    })

    it('opens the opportunity description in a popup and closes it again', async () => {
        fetchReport.mockResolvedValue({
            ...fixture(),
            rows: [{
                cells: [{ label: 'EMEA - AWS - PS BFSI', value: '006UN00000XamntYAB' }],
                id: '0:0',
            }],
        })
        fetchOpportunityDetails.mockResolvedValue({
            closeDate: '2026-07-31',
            description: 'Next AWS MVP for the BFSI practice.',
            id: '006UN00000XamntYAB',
            name: 'EMEA - AWS - PS BFSI',
            url: 'https://topcoder.my.salesforce.com/006UN00000XamntYAB',
        })

        render(<SalesPage />)
        fireEvent.click(await screen.findByRole('button', { name: 'EMEA - AWS - PS BFSI' }))

        expect(fetchOpportunityDetails)
            .toHaveBeenCalledWith('006UN00000XamntYAB', expect.any(AbortSignal))
        expect(await screen.findByText('Next AWS MVP for the BFSI practice.'))
            .toBeInTheDocument()
        expect(screen.getByRole('link', { name: 'View in Salesforce' }))
            .toHaveAttribute('href', 'https://topcoder.my.salesforce.com/006UN00000XamntYAB')

        fireEvent.click(screen.getByRole('button', { name: 'Close' }))
        await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument())
    })

    it('explains a failed opportunity lookup inside the popup', async () => {
        fetchReport.mockResolvedValue({
            ...fixture(),
            rows: [{
                cells: [{ label: 'EMEA - AWS - PS BFSI', value: '006UN00000XamntYAB' }],
                id: '0:0',
            }],
        })
        fetchOpportunityDetails.mockRejectedValue({ response: { status: 404 } })

        render(<SalesPage />)
        fireEvent.click(await screen.findByRole('button', { name: 'EMEA - AWS - PS BFSI' }))

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('We could not load the opportunity details. Please try again.')
    })

    it('leaves cells that do not carry an opportunity id as plain text', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')

        expect(screen.queryByRole('button', { name: 'Example opportunity' }))
            .not
            .toBeInTheDocument()
    })
})

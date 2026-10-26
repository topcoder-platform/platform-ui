/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import { act, fireEvent, render, screen, waitFor, within } from '@testing-library/react'
import { ButtonHTMLAttributes, ReactNode } from 'react'
import userEvent from '@testing-library/user-event'
import { useProfileContext } from '~/libs/core'

import SalesPage from './SalesReportsPage'
import { fetchSalesProgression, SalesProgressionReport } from './sales-progression.service'
import { fetchOpportunity } from './opportunity.service'
import { SalesReport } from './sales.models'
import { fetchSalesReport } from './sales.service'
import { syncSalesforceData } from './salesforce-sync.service'

jest.mock('~/libs/core', () => ({
    useProfileContext: jest.fn(),
    UserRole: { administrator: 'administrator' },
}), { virtual: true })

jest.mock('./sales-progression.service', () => ({
    fetchSalesProgression: jest.fn(),
    progressionErrorMessage: () => 'Unable to load complete progression data.',
}))

jest.mock('./salesforce-sync.service', () => ({
    salesforceSyncErrorMessage: () => 'Salesforce sync failed. Please try again.',
    syncSalesforceData: jest.fn(),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: { URLS: { WORK_APP: 'https://work.topcoder-dev.com' } },
}), { virtual: true })

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
const profileContext = useProfileContext as jest.MockedFunction<typeof useProfileContext>
const syncData = syncSalesforceData as jest.MockedFunction<typeof syncSalesforceData>
const syncCounts = { conflicted: 0, scanned: 2, unchanged: 0, unmatched: 1, updated: 1 }

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
            { dataType: 'percent', id: 'PROBABILITY', label: 'Probability (%)' },
            { dataType: 'currency', id: 'EXP_AMOUNT', label: 'Expected Revenue' },
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
                { label: '75%', value: 75 },
                { label: '$750', value: 750 },
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
                buckets: [{
                    amounts: [{
                        columnId: 'AMOUNT',
                        count: 18,
                        currencyCode: 'USD',
                        label: 'Amount',
                        mixedCurrency: false,
                        total: 900000,
                    }, {
                        columnId: 'EXP_AMOUNT',
                        count: 18,
                        currencyCode: 'USD',
                        label: 'Expected Revenue',
                        mixedCurrency: false,
                        total: 450000,
                    }],
                    count: 18,
                    label: 'Proposal',
                    total: 900000,
                }, {
                    amounts: [{
                        columnId: 'AMOUNT',
                        count: 6,
                        currencyCode: 'USD',
                        label: 'Amount',
                        mixedCurrency: false,
                        total: 87654,
                    }, {
                        columnId: 'EXP_AMOUNT',
                        count: 6,
                        currencyCode: 'USD',
                        label: 'Expected Revenue',
                        mixedCurrency: false,
                        total: 87654,
                    }],
                    count: 6,
                    label: 'Won - SOW Signed',
                    total: 87654,
                }],
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

/** @param query Applied period/stages. @returns Summary-only history response. Does not throw. */
function historyFixture(query: { dateFrom: string; dateTo: string }): SalesProgressionReport {
    return {
        ...query,
        openStages: ['Qualification', 'Proposal'],
        progressed: {
            breakdown: [{ fromStage: 'Qualification', opportunities: 2, toStage: 'Proposal', transitions: 4 }],
            opportunities: 2,
            transitions: 4,
        },
        refreshAfterSeconds: 60,
        refreshedAt: '2026-10-15T10:00:00Z',
        stages: ['Qualification', 'Proposal', 'Won', 'Lost'],
        timeZone: 'America/New_York',
        won: {
            breakdown: [{ fromStage: 'Proposal', opportunities: 1, toStage: 'Won', transitions: 2 }],
            opportunities: 1,
            transitions: 2,
        },
        wonStages: ['Won'],
    }
}

describe('Sales page', () => {
    beforeEach(() => {
        jest.mocked(fetchSalesProgression)
            .mockReset()
            .mockImplementation(query => Promise.resolve(historyFixture(query)))
        profileContext.mockReturnValue({ profile: { roles: ['administrator'] } } as never)
        syncData.mockReset()
            .mockResolvedValue({ billingAccounts: syncCounts, clients: syncCounts })
        fetchOpportunityDetails.mockReset()
        fetchReport.mockReset()
            .mockResolvedValue(fixture())
    })

    it('syncs once per click, waits for commit, then refreshes the page data', async () => {
        let complete: (value: Awaited<ReturnType<typeof syncSalesforceData>>) => void = () => undefined
        syncData.mockReturnValue(new Promise(resolve => { complete = resolve }))
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const button = screen.getByRole('button', { name: 'Sync SF Data' })
        expect(screen.getByText('Read only').nextElementSibling)
            .toBe(button)
        fireEvent.click(button)
        fireEvent.click(button)
        expect(syncData)
            .toHaveBeenCalledTimes(1)
        expect(screen.getByRole('button', { name: 'Syncing SF Data…' }))
            .toBeDisabled()
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        await act(async () => complete({ billingAccounts: syncCounts, clients: syncCounts }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ refresh: true }), expect.any(AbortSignal)))
        expect(await screen.findByText('Salesforce sync complete. 2 updated; 2 unmatched; 0 conflicts.'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Sync SF Data' }))
            .not.toBeDisabled()
    })

    it('hides the sync action from Talent Managers and unloaded profiles', async () => {
        profileContext.mockReturnValue({ profile: { roles: ['Talent Manager'] } } as never)
        const view = render(<SalesPage />)
        await screen.findByText('Example opportunity')
        expect(screen.queryByRole('button', { name: 'Sync SF Data' }))
            .not.toBeInTheDocument()
        profileContext.mockReturnValue({} as never)
        view.rerender(<SalesPage />)
        expect(screen.queryByRole('button', { name: 'Sync SF Data' }))
            .not.toBeInTheDocument()
    })

    it('refreshes after sync even while an earlier report request is still pending', async () => {
        fetchReport.mockReturnValueOnce(new Promise(() => { /* Deliberately pending until the effect cancels it. */ }))
        render(<SalesPage />)
        const originalSignal = fetchReport.mock.calls[0][1]
        fireEvent.click(screen.getByRole('button', { name: 'Sync SF Data' }))
        await screen.findByText('Example opportunity')
        expect(originalSignal?.aborted)
            .toBe(true)
        expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ refresh: true }), expect.any(AbortSignal))
    })

    it('keeps the loaded data and permits retry after a failed sync', async () => {
        syncData.mockRejectedValueOnce({ response: { status: 502 } })
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.click(screen.getByRole('button', { name: 'Sync SF Data' }))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Salesforce sync failed. Please try again.')
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        expect(screen.getByText('Example opportunity'))
            .toBeInTheDocument()
        fireEvent.click(screen.getByRole('button', { name: 'Sync SF Data' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenCalledTimes(2))
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

    it('applies multiple column values with OR and clears all report filters while keeping dates', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-09-01' } })
        fireEvent.submit(screen.getByLabelText('From date'))
        fireEvent.change(screen.getByLabelText('Filter field'), { target: { value: 'STAGE_NAME' } })
        fireEvent.change(screen.getByLabelText('Contains'), { target: { value: 'Proposal' } })
        fireEvent.click(screen.getByRole('button', { name: 'Add OR value' }))
        fireEvent.change(screen.getByLabelText('OR contains 2'), { target: { value: 'Contracts' } })
        fireEvent.submit(screen.getByLabelText('Contains'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: '2026-09-01', filterColumn: 'STAGE_NAME', filterValue: ['Proposal', 'Contracts'], page: 1,
            }), expect.any(AbortSignal)))
        fireEvent.change(screen.getByLabelText('Amount or Probability Filter'), { target: { value: 'AMOUNT' } })
        fireEvent.change(screen.getByLabelText('Greater than'), { target: { value: '100000' } })
        fireEvent.submit(screen.getByLabelText('Greater than'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                amountColumn: 'AMOUNT', amountMin: 100000, filterValue: ['Proposal', 'Contracts'], page: 1,
            }), expect.any(AbortSignal)))
        fireEvent.click(clearButton('Sales report'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                dateFrom: '2026-09-01', page: 1,
            }), expect.any(AbortSignal)))
        const query = fetchReport.mock.calls[fetchReport.mock.calls.length - 1][0]
        expect(query.filterValue)
            .toBeUndefined()
        expect(query.amountMin)
            .toBeUndefined()
        expect(screen.getByLabelText('Contains'))
            .toHaveValue('')
        expect(screen.queryByLabelText('OR contains 2')).not.toBeInTheDocument()
        expect(screen.getByLabelText('Greater than'))
            .toHaveDisplayValue('')
    })

    it('validates amount bounds and applies, refreshes and removes a numeric range', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.change(screen.getByLabelText('Amount or Probability Filter'), { target: { value: 'AMOUNT' } })
        fireEvent.change(screen.getByLabelText('Greater than'), { target: { value: '100000' } })
        fireEvent.change(screen.getByLabelText('Less than'), { target: { value: '50000' } })
        fireEvent.submit(screen.getByLabelText('Greater than'))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('The lower bound must be less')
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        fireEvent.change(screen.getByLabelText('Less than'), { target: { value: '200000.50' } })
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                amountColumn: 'AMOUNT', amountMax: 200000.5, amountMin: 100000, page: 1,
            }), expect.any(AbortSignal)))
        await waitFor(() => expect(screen.getByRole('button', { name: 'Refresh' })).not.toBeDisabled())
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                amountMax: 200000.5, amountMin: 100000, refresh: true,
            }), expect.any(AbortSignal)))
        fireEvent.change(screen.getByLabelText('Greater than'), { target: { value: '' } })
        fireEvent.change(screen.getByLabelText('Less than'), { target: { value: '' } })
        fireEvent.submit(screen.getByLabelText('Greater than'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                amountColumn: undefined, amountMax: undefined, amountMin: undefined,
            }), expect.any(AbortSignal)))
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

    it('does not refresh automatically on a timer or when the tab becomes visible', async () => {
        jest.useFakeTimers()
        const visibility = jest.spyOn(document, 'visibilityState', 'get')
            .mockReturnValue('visible')
        const view = render(<SalesPage />)
        await act(async () => { await Promise.resolve() })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        visibility.mockReturnValue('hidden')
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        visibility.mockReturnValue('visible')
        await act(async () => { fireEvent(document, new Event('visibilitychange')) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
        view.unmount()
        await act(async () => { jest.advanceTimersByTime(60000) })
        expect(fetchReport)
            .toHaveBeenCalledTimes(1)
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
        expect(screen.getByLabelText('Filter type'))
            .toHaveValue('CLOSE_DATE')
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

    it('combines category dropdowns and preserves them through refresh and report clear', async () => {
        const user = userEvent.setup()
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const filters = within(screen.getByRole('region', { name: 'Pipeline filters' }))
        expect(filters.getAllByText('ALL'))
            .toHaveLength(3)
        fireEvent.click(screen.getByRole('button', { name: 'Next' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ page: 2 }), expect.any(AbortSignal)))
        await user.click(filters.getByLabelText('Offering Type'))
        await user.click(filters.getByRole('option', { name: 'Flexible Talent' }))
        await user.click(filters.getByLabelText('Offering Type'))
        await user.click(filters.getByRole('option', { name: 'AI Training' }))
        await user.click(filters.getByLabelText('Deal Category'))
        await user.click(filters.getByRole('option', { name: 'Wipro-Direct' }))
        await user.click(filters.getByLabelText('Customer Type'))
        await user.click(filters.getByRole('option', { name: 'New Customer' }))
        const selected = {
            customerType: ['New Customer'],
            dealCategory: ['Wipro-Direct'],
            offeringType: ['Flexible Talent', 'AI Training'],
            page: 1,
        }
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining(selected), expect.any(AbortSignal)))
        fireEvent.click(await screen.findByRole('button', { name: 'Refresh' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({ ...selected, refresh: true }), expect.any(AbortSignal)))
        fireEvent.click(clearButton('Sales report'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining(selected), expect.any(AbortSignal)))
        await user.click(filters.getByLabelText('Offering Type'))
        await user.click(filters.getByRole('option', { name: 'ALL' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ ...selected, offeringType: undefined }),
                expect.any(AbortSignal),
            ))
    })

    it('offers probability bounds in percent units and keeps data aligned after column reordering', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const headers = screen.getAllByRole('columnheader')
            .map(header => header.textContent)
        expect(headers.slice(2, 5))
            .toEqual(['Amount ↕', 'Probability (%) ↕', 'Expected Amount ↕'])
        const row = screen.getByText('Example opportunity')
            .closest('tr') as HTMLElement
        expect(within(row)
            .getAllByRole('cell')
            .slice(2, 5)
            .map(cell => cell.textContent))
            .toEqual(['$1,000', '75%', '$750'])
        expect(screen.queryByText('Expected Revenue')).not.toBeInTheDocument()
        fireEvent.change(screen.getByLabelText('Amount or Probability Filter'), { target: { value: 'PROBABILITY' } })
        fireEvent.change(screen.getByLabelText('Greater than'), { target: { value: '60' } })
        fireEvent.change(screen.getByLabelText('Less than'), { target: { value: '90' } })
        fireEvent.submit(screen.getByLabelText('Greater than'))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(
                expect.objectContaining({ amountColumn: 'PROBABILITY', amountMax: 90, amountMin: 60, page: 1 }),
                expect.any(AbortSignal),
            ))
    })

    it('shows the four summary cards over every matching record', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const cards = ['Total Opportunities', 'Total Bookings Won',
            'Total Bookings in Pipeline', 'Total Expected Bookings in Pipeline']
        expect(within(screen.getByRole('region', { name: 'Filtered sales totals' }))
            .getAllByText(/Total /)
            .map(card => card.textContent))
            .toEqual(cards)
        cards.forEach(card => expect(screen.getByText(card))
            .toBeInTheDocument())
        expect(screen.getByText('30'))
            .toBeInTheDocument()
        // The plain Amount is redundant beside Amount (converted), so the card reads the converted total.
        expect(screen.getByText('$1,146,913'))
            .toBeInTheDocument()
        expect(screen.queryByText('$987,654'))
            .not.toBeInTheDocument()
        // An uncoded single-currency total reads in dollars like the converted columns.
        expect(screen.getByText('$467,901'))
            .toBeInTheDocument()
        // The WON SOW Signed card reports the signed Amount from the stage breakdown.
        expect(screen.getAllByText('$87,654').length)
            .toBeGreaterThan(0)
        // The removed columns no longer earn a tile of their own.
        expect(screen.queryByText('Local fee'))
            .not.toBeInTheDocument()
    })

    it('breaks the pipeline down by stage with both totals, in pipeline order', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        expect(screen.getByText('Stage breakdown'))
            .toBeInTheDocument()
        const stages = screen.getAllByRole('button', { pressed: false })
            .filter(button => button.textContent?.includes('Opportunities'))
        expect(stages.map(button => button.textContent))
            .toEqual([
                expect.stringContaining('Proposal'),
                expect.stringContaining('Won - SOW Signed'),
            ])
        expect(stages[0].textContent)
            .toContain('$450,000')
        expect(screen.getByText('2 further values not shown.'))
            .toBeInTheDocument()
    })

    it('drills the table into a stage and releases it when the stage is clicked again', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        const stage = screen.getAllByRole('button', { pressed: false })
            .find(button => button.textContent?.includes('Won - SOW Signed')) as HTMLElement
        fireEvent.click(stage)
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                drilldownColumn: 'STAGE_NAME', drilldownValue: 'Won - SOW Signed', page: 1,
            }), expect.any(AbortSignal)))
        expect(await screen.findByRole('button', { name: /Won - SOW Signed/, pressed: true }))
            .toBeInTheDocument()
        // The breakdown is still complete, because the drilldown never narrows the summary.
        expect(screen.getAllByRole('button', { pressed: false })
            .some(button => button.textContent?.includes('Proposal')))
            .toBe(true)
        fireEvent.click(screen.getByRole('button', { name: /Won - SOW Signed/, pressed: true }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                drilldownColumn: undefined, drilldownValue: undefined,
            }), expect.any(AbortSignal)))
    })

    it('selects multiple stages with OR and removes only the clicked selection', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        fireEvent.click(screen.getByRole('button', { name: /Proposal.*Opportunities/ }))
        fireEvent.click(screen.getByRole('button', { name: /Won - SOW Signed.*Opportunities/ }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                drilldownColumn: 'STAGE_NAME', drilldownValue: ['Proposal', 'Won - SOW Signed'], page: 1,
            }), expect.any(AbortSignal)))
        expect(screen.getAllByRole('button', { pressed: true }))
            .toHaveLength(2)
        fireEvent.click(screen.getByRole('button', { name: /Proposal.*Opportunities/ }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                drilldownValue: 'Won - SOW Signed',
            }), expect.any(AbortSignal)))
        fireEvent.click(screen.getByRole('button', { name: 'Clear stages' }))
        await waitFor(() => expect(fetchReport)
            .toHaveBeenLastCalledWith(expect.objectContaining({
                drilldownColumn: undefined, drilldownValue: undefined,
            }), expect.any(AbortSignal)))
        expect(screen.queryByRole('button', { pressed: true })).not.toBeInTheDocument()
    })

    it('shows only the PM-6392 columns, in order, without disturbing the row data', async () => {
        fetchReport.mockResolvedValue({
            ...fixture(),
            columns: [
                { dataType: 'string', id: 'ACCOUNT', label: 'Reporting Account' },
                { dataType: 'date', id: 'CLOSE_DATE', label: 'Close Date' },
                { dataType: 'picklist', id: 'STAGE_NAME', label: 'Stage' },
                { dataType: 'currency', id: 'AMOUNT', label: 'Amount' },
            ],
            rows: [{
                cells: [
                    { label: 'Hidden account', value: 'Hidden account' },
                    { label: '9/30/2026', value: '2026-09-30' },
                    { label: 'Proposal', value: 'Proposal' },
                    { currencyCode: 'USD', label: '$1,000', value: 1000 },
                ],
                id: '0:0',
            }],
        })
        render(<SalesPage />)
        await screen.findByText('$1,000')
        expect(screen.getAllByRole('columnheader')
            .map(header => header.textContent?.replace(/[\u2191\u2193\u2195]/g, '')
                .trim()))
            .toEqual(['Stage', 'Amount', 'Close Date'])
        expect(screen.queryByText('Hidden account'))
            .not.toBeInTheDocument()
        // The cells still follow their own column, not the header position.
        const cells = screen.getAllByRole('cell')
            .map(cell => cell.textContent)
        expect(cells)
            .toEqual(['Proposal', '$1,000', '9/30/2026'])
        // A removed column is no longer offered as a filter field either.
        expect([...(screen.getByLabelText('Filter field') as HTMLSelectElement).options].map(o => o.text))
            .toEqual(['Choose a field', 'Stage', 'Amount', 'Close Date'])
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
        expect(screen.queryByText('Total Opportunities'))
            .not.toBeInTheDocument()
        expect(screen.queryByText('Stage breakdown'))
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
    it('loads history only on its tab, supports keyboard switching, and aborts on tab exit', async () => {
        render(<SalesPage />)
        await screen.findByText('Example opportunity')
        expect(fetchSalesProgression).not.toHaveBeenCalled()
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Pipeline' }), { key: 'ArrowRight' })
        expect(screen.getByRole('tab', { name: 'Stage progression' }))
            .toHaveFocus()
        expect(await screen.findByRole('region', { name: 'Stage progression totals' }))
            .toHaveTextContent('2')
        expect(screen.getByRole('tab', { name: 'Stage progression' }))
            .toHaveAttribute('aria-selected', 'true')
        const signal = jest.mocked(fetchSalesProgression).mock.calls[0][1]
        fireEvent.keyDown(screen.getByRole('tab', { name: 'Stage progression' }), { key: 'Home' })
        expect(signal?.aborted)
            .toBe(true)
        await screen.findByText('Example opportunity')
    })

    it('sends period and stage filters and shows the won breakdown without summing row counts', async () => {
        render(<SalesPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Stage progression' }))
        const totals = await screen.findByRole('region', { name: 'Stage progression totals' })
        expect(within(totals)
            .getByText('Opportunities progressed').nextElementSibling)
            .toHaveTextContent('2')
        expect(within(totals)
            .getByText('Forward transitions').nextElementSibling)
            .toHaveTextContent('4')
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-07' } })
        fireEvent.change(screen.getByLabelText('From stage'), { target: { value: 'Proposal' } })
        fireEvent.change(screen.getByLabelText('To stage'), { target: { value: 'Won' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        await waitFor(() => expect(fetchSalesProgression)
            .toHaveBeenLastCalledWith({
                dateFrom: '2026-10-01', dateTo: '2026-10-07', fromStage: 'Proposal', toStage: 'Won',
            }, expect.any(AbortSignal)))
        await screen.findByText(/Period: 2026-10-01 to 2026-10-07/)
        fireEvent.change(screen.getByLabelText('Show'), { target: { value: 'won' } })
        const table = screen.getByRole('table')
        expect(within(table)
            .getByText('Won'))
            .toBeInTheDocument()
        expect(within(table)
            .queryByText('Qualification')).not.toBeInTheDocument()
    })

    it('validates the period, hides old totals after a filter change, and explains unavailable data', async () => {
        render(<SalesPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Stage progression' }))
        await screen.findByRole('region', { name: 'Stage progression totals' })
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2028-01-01' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        expect(screen.getByRole('alert'))
            .toHaveTextContent('From on or before To')
        expect(fetchSalesProgression)
            .toHaveBeenCalledTimes(1)
        jest.mocked(fetchSalesProgression)
            .mockRejectedValue({ response: { status: 503 } })
        fireEvent.change(screen.getByLabelText('From date'), { target: { value: '2026-10-01' } })
        fireEvent.change(screen.getByLabelText('To date'), { target: { value: '2026-10-15' } })
        fireEvent.click(screen.getByRole('button', { name: 'Apply filters' }))
        expect(screen.queryByRole('region', { name: 'Stage progression totals' })).not.toBeInTheDocument()
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Unable to load complete progression data.')
    })

    it('labels failed refreshes as stale and removes history on authorization failure', async () => {
        render(<SalesPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Stage progression' }))
        await screen.findByRole('region', { name: 'Stage progression totals' })
        jest.mocked(fetchSalesProgression)
            .mockRejectedValueOnce({ response: { status: 502 } })
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Showing previously loaded data')
        expect(screen.getByRole('region', { name: 'Stage progression totals' }))
            .toBeInTheDocument()
        jest.mocked(fetchSalesProgression)
            .mockRejectedValueOnce({ response: { status: 403 } })
        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        await waitFor(() => expect(screen.queryByRole('region', { name: 'Stage progression totals' }))
            .not.toBeInTheDocument())
    })

    it('renders complete empty history results as zero with an empty-state explanation', async () => {
        jest.mocked(fetchSalesProgression)
            .mockImplementation(query => Promise.resolve({
                ...historyFixture(query),
                progressed: { breakdown: [], opportunities: 0, transitions: 0 },
                won: { breakdown: [], opportunities: 0, transitions: 0 },
            }))
        render(<SalesPage />)
        fireEvent.click(screen.getByRole('tab', { name: 'Stage progression' }))
        expect(await screen.findByText('No matching stage transitions in this period.'))
            .toBeInTheDocument()
        expect(within(screen.getByRole('region', { name: 'Stage progression totals' }))
            .getAllByText('0'))
            .toHaveLength(4)
    })

})

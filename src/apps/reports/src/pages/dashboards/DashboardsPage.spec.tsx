/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type {
    ButtonHTMLAttributes,
    PropsWithChildren,
} from 'react'
import {
    act,
    fireEvent,
    render,
    screen,
    within,
} from '@testing-library/react'
import { MemoryRouter, Route, Routes } from 'react-router-dom'

import {
    DashboardSlug,
    DashboardsResponse,
    downloadBlobFile,
    downloadDashboardsCsv,
    fetchDashboard,
} from '../../lib/services'

import { dashboardSlugs, DashboardResponse, getDashboardResponse } from './dashboard.config'
import { DashboardsPage } from './DashboardsPage'

jest.mock('~/config', () => ({
    AppSubdomain: { reports: 'reports' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

jest.mock('~/libs/ui', () => {
    const Icon = (): JSX.Element => <svg />

    return {
        Button: (
            props: PropsWithChildren<
            Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick'>
            >,
        ): JSX.Element => (
            <button
                disabled={props.disabled}
                onClick={props.onClick}
                type='button'
            >
                {props.children}
            </button>
        ),
        IconOutline: new Proxy({}, {
            get: () => Icon,
        }),
        LoadingSpinner: (props: { inline?: boolean; overlay?: boolean; message?: string }): JSX.Element => (
            <div data-inline={props.inline} data-overlay={props.overlay} data-testid='loading-spinner'>
                {props.message}
            </div>
        ),
        PageTitle: (): JSX.Element => <></>,
    }
}, { virtual: true })

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (): JSX.Element => <div data-testid='dashboard-chart' />,
}))

jest.mock('../../lib/services', () => ({
    downloadBlobFile: jest.fn(),
    downloadDashboardsCsv: jest.fn(),
    fetchDashboard: jest.fn(),
}))

jest.mock('../../lib/utils', () => ({
    handleError: jest.fn(),
}))

const dashboardResponse: DashboardsResponse = {
    challengeParticipation: {
        dashboard: 'challenge-participation',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            month: '2026-07-01',
            registrants: 120,
            submitters: 75,
        }],
        startDate: '2026-02-01T00:00:00.000Z',
        summary: {
            peakMonth: '2026-07-01',
            peakMonthRegistrants: 120,
            submissionRate: 62.5,
            totalUniqueRegistrants: 1000,
            totalUniqueSubmitters: 625,
        },
    },
    memberPaymentByCustomer: {
        dashboard: 'member-payment-by-customer',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            month: '2026-07-01',
            values: {
                'customer-1': 125_000,
                'other-customers': 20_000,
            },
        }],
        series: [
            {
                customerId: 'customer-id-1',
                key: 'customer-1',
                label: 'Customer A',
            },
            {
                customerId: null, // eslint-disable-line unicorn/no-null
                key: 'other-customers',
                label: 'Other Customers',
            },
        ],
        startDate: '2026-02-01T00:00:00.000Z',
    },
    memberPaymentByMonth: {
        dashboard: 'member-payment-by-month',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            challenge: 75_000,
            engagement: 25_000,
            month: '2026-07-01',
            taas: 200_000,
            task: 100_000,
        }],
        startDate: '2026-02-01T00:00:00.000Z',
    },
    membersPaid: {
        dashboard: 'members-paid',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            challenge: 30,
            engagement: 10,
            month: '2026-07-01',
            taas: 12,
            task: 18,
        }],
        startDate: '2026-02-01T00:00:00.000Z',
        summary: {
            challengeUniqueMembers: 300,
            engagementUniqueMembers: 100,
            peakMonth: '2026-07-01',
            peakMonthUniqueMembers: 70,
            taasUniqueMembers: 120,
            taskUniqueMembers: 180,
            totalUniqueMembers: 600,
        },
    },
    newSignups: {
        dashboard: 'new-signups',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            activated: 90,
            month: '2026-07-01',
            notActivated: 10,
        }],
        startDate: '2026-02-01T00:00:00.000Z',
        summary: {
            activatedMembers: 900,
            activationRate: 90,
            notActivatedMembers: 100,
            peakMonth: '2026-07-01',
            peakMonthSignups: 100,
            totalSignups: 1000,
        },
    },
}

const mockedFetchDashboard = fetchDashboard as jest.Mock
const mockedDownloadDashboardsCsv = downloadDashboardsCsv as jest.Mock
const mockedDownloadBlobFile = downloadBlobFile as jest.Mock

/**
 * Flushes dashboard request promises and their resulting React state updates.
 *
 * @returns Promise resolved after queued microtasks are committed.
 * @throws Propagates unexpected React update errors.
 */
async function flushAsyncUpdates(): Promise<void> {
    await act(async () => {
        await Promise.resolve()
    })
}

/**
 * Creates a request whose completion is controlled by the test.
 *
 * @returns Promise and callbacks for simulating delayed successes or failures.
 * @throws Does not throw; reject settles the returned promise with an error.
 */
function createDeferred<T>(): {
    promise: Promise<T>
    resolve: (value: T) => void
    reject: (error: Error) => void
    } {
    let resolve: (value: T) => void = () => undefined
    let reject: (error: Error) => void = () => undefined
    const promise = new Promise<T>((resolvePromise, rejectPromise) => {
        resolve = resolvePromise
        reject = rejectPromise
    })

    return { promise, reject, resolve }
}

describe('Dashboards landing page', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-23T12:00:00.000Z'))
        jest.resetAllMocks()
        mockedFetchDashboard.mockImplementation((slug: DashboardSlug) => (
            Promise.resolve(getDashboardResponse(dashboardResponse, slug))
        ))
        mockedDownloadDashboardsCsv.mockResolvedValue(
            new Blob(['dashboard,month'], { type: 'text/csv' }),
        )
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('loads all widget cards, refreshes, and exports the displayed UTC range', async () => {
        render(
            <MemoryRouter>
                <DashboardsPage />
            </MemoryRouter>,
        )
        await flushAsyncUpdates()

        expect(screen.getByRole('heading', { name: 'Dashboards' }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /New Signups by Month/ }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Unique Members Paid per Month/ }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Challenge Registrants vs Submitters/ }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Member Payment \$ by Month/ }))
            .toBeInTheDocument()
        expect(screen.getByRole('heading', { name: /Member Payment \$ by Customer/ }))
            .toBeInTheDocument()
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(5)
        expect(screen.getAllByRole('table'))
            .toHaveLength(5)
        const detailLinks = screen.getAllByRole('link', { name: 'View full dashboard' })

        expect(detailLinks)
            .toHaveLength(5)
        expect(detailLinks[3])
            .toHaveAttribute('href', '/reports/dashboards/member-payment-by-month')
        expect(detailLinks[4])
            .toHaveAttribute('href', '/reports/dashboards/member-payment-by-customer')
        dashboardSlugs.forEach(slug => {
            expect(mockedFetchDashboard)
                .toHaveBeenCalledWith(slug, {
                    endDate: '2026-08-01',
                    startDate: '2026-02-01',
                })
        })

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await flushAsyncUpdates()

        expect(mockedFetchDashboard)
            .toHaveBeenCalledTimes(10)
        expect(screen.getByRole('button', { name: 'Download CSV' }))
            .toBeEnabled()

        fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
        await flushAsyncUpdates()

        expect(mockedDownloadDashboardsCsv)
            .toHaveBeenCalledWith({
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            })
        expect(mockedDownloadBlobFile)
            .toHaveBeenCalledWith(
                expect.any(Blob),
                'reports-dashboards-2026-02-01-to-2026-07-31.csv',
            )
    })

    it.each(dashboardSlugs)('navigates to %s while all previews are still pending', async slug => {
        const pending = createDeferred<DashboardResponse>()
        mockedFetchDashboard.mockReturnValue(pending.promise)

        render(
            <MemoryRouter initialEntries={['/reports/dashboards']}>
                <Routes>
                    <Route element={<DashboardsPage />} path='/reports/dashboards' />
                    <Route element={<h1>Selected dashboard</h1>} path={`/reports/dashboards/${slug}`} />
                </Routes>
            </MemoryRouter>,
        )

        const cards = screen.getAllByRole('article')
        expect(cards)
            .toHaveLength(5)
        expect(screen.queryAllByTestId('dashboard-chart'))
            .toHaveLength(0)
        cards.forEach((card, index) => {
            expect(within(card)
                .getByRole('heading'))
                .toBeInTheDocument()
            expect(within(card)
                .getByRole('status'))
                .toBeInTheDocument()
            expect(within(card)
                .getByTestId('loading-spinner'))
                .toHaveAttribute('data-inline', 'true')
            expect(within(card)
                .getByTestId('loading-spinner')).not.toHaveAttribute('data-overlay', 'true')
            expect(within(card)
                .getByRole('link', { name: 'View full dashboard' }))
                .toHaveAttribute('href', `/reports/dashboards/${dashboardSlugs[index]}`)
        })
        expect(mockedFetchDashboard)
            .toHaveBeenCalledTimes(5)

        fireEvent.click(within(cards[dashboardSlugs.indexOf(slug)])
            .getByRole('link'))
        expect(screen.getByRole('heading', { name: 'Selected dashboard' }))
            .toBeInTheDocument()

        pending.resolve(dashboardResponse.newSignups)
        await flushAsyncUpdates()
        expect(screen.getByRole('heading', { name: 'Selected dashboard' }))
            .toBeInTheDocument()
    })

    it('loads previews independently and retries only the failed card while another is pending', async () => {
        const pending = createDeferred<DashboardResponse>()
        mockedFetchDashboard
            .mockReturnValueOnce(pending.promise)
            .mockRejectedValueOnce(new Error('Members paid is unavailable'))

        render(<MemoryRouter><DashboardsPage /></MemoryRouter>)
        await flushAsyncUpdates()

        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(3)
        expect(screen.getAllByRole('status'))
            .toHaveLength(1)
        expect(screen.getByRole('alert'))
            .toHaveTextContent('Members paid is unavailable')
        expect(screen.getAllByRole('link', { name: 'View full dashboard' }))
            .toHaveLength(5)

        fireEvent.click(screen.getByRole('button', { name: 'Try again' }))
        expect(screen.getAllByRole('status'))
            .toHaveLength(2)
        await flushAsyncUpdates()

        expect(mockedFetchDashboard)
            .toHaveBeenCalledTimes(6)
        expect(mockedFetchDashboard)
            .toHaveBeenLastCalledWith('members-paid', {
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            })
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(4)
        expect(screen.getAllByRole('status'))
            .toHaveLength(1)

        pending.resolve(dashboardResponse.newSignups)
        await flushAsyncUpdates()
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(5)
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps links available during refresh and ignores superseded successes and failures', async () => {
        const staleSuccess = createDeferred<DashboardResponse>()
        const staleFailure = createDeferred<DashboardResponse>()
        mockedFetchDashboard
            .mockReturnValueOnce(staleSuccess.promise)
            .mockReturnValueOnce(staleFailure.promise)

        render(<MemoryRouter><DashboardsPage /></MemoryRouter>)
        await flushAsyncUpdates()

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        expect(screen.getAllByRole('status'))
            .toHaveLength(5)
        expect(screen.getAllByRole('link', { name: 'View full dashboard' }))
            .toHaveLength(5)
        await flushAsyncUpdates()

        staleSuccess.resolve({ ...dashboardResponse.newSignups, months: [] })
        staleFailure.reject(new Error('Outdated failure'))
        await flushAsyncUpdates()

        expect(mockedFetchDashboard)
            .toHaveBeenCalledTimes(10)
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(5)
        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
    })

    it('keeps all links available after an outage and recovers on refresh', async () => {
        mockedFetchDashboard.mockRejectedValue('Service unavailable')

        render(<MemoryRouter><DashboardsPage /></MemoryRouter>)
        await flushAsyncUpdates()

        expect(screen.getAllByRole('alert'))
            .toHaveLength(5)
        expect(screen.getAllByRole('alert')[0])
            .toHaveTextContent('Dashboard data could not be loaded. Please try again.')
        expect(screen.queryByRole('status')).not.toBeInTheDocument()
        expect(screen.getAllByRole('link', { name: 'View full dashboard' }))
            .toHaveLength(5)

        mockedFetchDashboard.mockImplementation((slug: DashboardSlug) => (
            Promise.resolve(getDashboardResponse(dashboardResponse, slug))
        ))
        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await flushAsyncUpdates()

        expect(screen.queryByRole('alert')).not.toBeInTheDocument()
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(5)
    })

    it('exports CSV without waiting for previews or blocking navigation', async () => {
        const previews = createDeferred<DashboardResponse>()
        const download = createDeferred<Blob>()
        mockedFetchDashboard.mockReturnValue(previews.promise)
        mockedDownloadDashboardsCsv.mockReturnValue(download.promise)

        render(
            <MemoryRouter initialEntries={['/reports/dashboards']}>
                <Routes>
                    <Route element={<DashboardsPage />} path='/reports/dashboards' />
                    <Route element={<h1>Selected dashboard</h1>} path='/reports/dashboards/new-signups' />
                </Routes>
            </MemoryRouter>,
        )

        fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
        expect(screen.getByRole('button', { name: 'Generating CSV…' }))
            .toBeDisabled()
        expect(screen.getAllByRole('link', { name: 'View full dashboard' }))
            .toHaveLength(5)
        expect(screen.getAllByTestId('loading-spinner'))
            .toHaveLength(5)

        fireEvent.click(screen.getAllByRole('link', { name: 'View full dashboard' })[0])
        expect(screen.getByRole('heading', { name: 'Selected dashboard' }))
            .toBeInTheDocument()

        download.resolve(new Blob(['dashboard,month'], { type: 'text/csv' }))
        previews.reject(new Error('Request finished after navigation'))
        await flushAsyncUpdates()
        expect(mockedDownloadBlobFile)
            .toHaveBeenCalledTimes(1)
        expect(screen.getByRole('heading', { name: 'Selected dashboard' }))
            .toBeInTheDocument()
    })

})

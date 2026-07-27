/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type {
    ButtonHTMLAttributes,
    PropsWithChildren,
} from 'react'
import type { RenderResult } from '@testing-library/react'
import {
    act,
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import {
    downloadBlobFile,
    downloadDashboardCsv,
    fetchDashboard,
    NewSignupsDashboard,
} from '../../lib/services'

import { DashboardDetailPage } from './DashboardDetailPage'

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
        LoadingSpinner: (): JSX.Element => <div>Loading dashboard</div>,
        PageTitle: (): JSX.Element => <></>,
    }
}, { virtual: true })

jest.mock('highcharts-react-official', () => ({
    __esModule: true,
    default: (): JSX.Element => <div data-testid='dashboard-chart' />,
}))

jest.mock('../../lib/services', () => ({
    downloadBlobFile: jest.fn(),
    downloadDashboardCsv: jest.fn(),
    fetchDashboard: jest.fn(),
}))

jest.mock('../../lib/utils', () => ({
    handleError: jest.fn(),
}))

const signupResponse: NewSignupsDashboard = {
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
}

const mockedFetchDashboard = fetchDashboard as jest.Mock
const mockedDownloadDashboardCsv = downloadDashboardCsv as jest.Mock
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
 * Renders the dashboard routes around the detail page under test.
 *
 * @param dashboardSlug Route slug to mount.
 * @returns Testing Library render result.
 * @throws Does not throw.
 */
function renderDetailRoute(dashboardSlug: string): RenderResult {
    return render(
        <MemoryRouter initialEntries={[`/reports/dashboards/${dashboardSlug}`]}>
            <Routes>
                <Route
                    element={<DashboardDetailPage />}
                    path='/reports/dashboards/:dashboardSlug'
                />
                <Route
                    element={<div>Dashboard landing</div>}
                    path='/reports/dashboards'
                />
            </Routes>
        </MemoryRouter>,
    )
}

describe('Dashboard detail page', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-23T12:00:00.000Z'))
        jest.clearAllMocks()
        mockedFetchDashboard.mockResolvedValue(signupResponse)
        mockedDownloadDashboardCsv.mockResolvedValue(
            new Blob(['month,activated'], { type: 'text/csv' }),
        )
    })

    afterEach(() => {
        jest.useRealTimers()
    })

    it('renders metrics, pages by six months, and exports the selected range', async () => {
        renderDetailRoute('new-signups')
        await flushAsyncUpdates()

        expect(screen.getByText('Total Signups'))
            .toBeInTheDocument()
        expect(screen.getByText('1,000'))
            .toBeInTheDocument()
        expect(screen.getByText('Feb ’26 – Jul ’26'))
            .toBeInTheDocument()
        expect(screen.getByTestId('dashboard-chart'))
            .toBeInTheDocument()
        expect(screen.getByRole('table', { name: 'New Signups by Month monthly data' }))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Next 6 Months' }))
            .toBeDisabled()
        expect(screen.getByRole('link', { name: 'Back to Dashboards' }))
            .toHaveAttribute('href', '/reports/dashboards')

        jest.setSystemTime(new Date('2026-08-01T00:01:00.000Z'))
        fireEvent.click(screen.getByRole('button', { name: 'Previous 6 Months' }))
        await flushAsyncUpdates()

        expect(mockedFetchDashboard)
            .toHaveBeenLastCalledWith('new-signups', {
                endDate: '2026-02-01',
                startDate: '2025-08-01',
            })
        expect(screen.getByText('Aug ’25 – Jan ’26'))
            .toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Download CSV' }))
            .toBeEnabled()

        fireEvent.click(screen.getByRole('button', { name: 'Download CSV' }))
        await flushAsyncUpdates()

        expect(mockedDownloadDashboardCsv)
            .toHaveBeenCalledWith('new-signups', {
                endDate: '2026-02-01',
                startDate: '2025-08-01',
            })
        expect(mockedDownloadBlobFile)
            .toHaveBeenCalledWith(
                expect.any(Blob),
                'new-signups-2025-08-01-to-2026-02-01.csv',
            )
    })

    it('redirects unknown dashboard slugs to the dashboard landing page', async () => {
        renderDetailRoute('unknown-dashboard')

        expect(await screen.findByText('Dashboard landing'))
            .toBeInTheDocument()
        expect(mockedFetchDashboard)
            .not.toHaveBeenCalled()
    })
})

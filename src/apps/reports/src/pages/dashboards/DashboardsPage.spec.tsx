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
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import {
    DashboardsResponse,
    downloadBlobFile,
    downloadDashboardsCsv,
    fetchDashboards,
} from '../../lib/services'

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
        LoadingSpinner: (): JSX.Element => <div>Loading dashboards</div>,
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
    fetchDashboards: jest.fn(),
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
    membersPaid: {
        dashboard: 'members-paid',
        endDate: '2026-08-01T00:00:00.000Z',
        months: [{
            contest: 30,
            engagement: 10,
            month: '2026-07-01',
            taas: 12,
            task: 18,
        }],
        startDate: '2026-02-01T00:00:00.000Z',
        summary: {
            contestUniqueMembers: 300,
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

const mockedFetchDashboards = fetchDashboards as jest.Mock
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

describe('Dashboards landing page', () => {
    beforeEach(() => {
        jest.useFakeTimers()
        jest.setSystemTime(new Date('2026-07-23T12:00:00.000Z'))
        jest.clearAllMocks()
        mockedFetchDashboards.mockResolvedValue(dashboardResponse)
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
        expect(screen.getAllByTestId('dashboard-chart'))
            .toHaveLength(3)
        expect(screen.getAllByRole('table'))
            .toHaveLength(3)
        expect(mockedFetchDashboards)
            .toHaveBeenCalledWith({
                endDate: '2026-08-01',
                startDate: '2026-02-01',
            })

        fireEvent.click(screen.getByRole('button', { name: 'Refresh' }))
        await flushAsyncUpdates()

        expect(mockedFetchDashboards)
            .toHaveBeenCalledTimes(2)
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
                'reports-dashboards-2026-02-01-to-2026-08-01.csv',
            )
    })
})

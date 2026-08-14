/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'
import type {
    ButtonHTMLAttributes,
    ChangeEvent,
    PropsWithChildren,
} from 'react'
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
    useLocation,
} from 'react-router-dom'

import {
    fetchReportJson,
    fetchReportsIndex,
    SfdcBillingAccountPaymentRow,
} from '../../lib/services'

import { BillingAccountsPage, ReportsPage } from './ReportsPage'

type MockSelectProps = {
    disabled?: boolean
    label?: string
    name?: string
    onChange?: (event: ChangeEvent<HTMLSelectElement>) => void
    options?: Array<{ label: string, value: string }>
    placeholder?: string
    value?: string
}

jest.mock('~/config', () => ({
    AppSubdomain: { reports: 'reports' },
    EnvironmentConfig: { SUBDOMAIN: 'platform-ui' },
}), { virtual: true })

jest.mock('~/apps/admin/src/lib', () => ({
    Pagination: (): JSX.Element => <></>,
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: PropsWithChildren): JSX.Element => <div>{props.children}</div>,
    Button: (
        props: PropsWithChildren<Pick<ButtonHTMLAttributes<HTMLButtonElement>, 'disabled' | 'onClick'>>,
    ): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.children}
        </button>
    ),
    IconOutline: {
        InformationCircleIcon: (): JSX.Element => <svg />,
    },
    InputDatePicker: (): JSX.Element => <input />,
    InputSelect: (props: MockSelectProps): JSX.Element => (
        <select
            aria-label={props.label}
            disabled={props.disabled}
            name={props.name}
            onChange={props.onChange}
            value={props.value}
        >
            <option value=''>{props.placeholder}</option>
            {props.options?.map(option => (
                <option key={option.value} value={option.value}>{option.label}</option>
            ))}
        </select>
    ),
    InputText: (): JSX.Element => <input />,
    LoadingSpinner: (): JSX.Element => <div>Loading reports</div>,
    PageTitle: (): JSX.Element => <></>,
    Tooltip: (props: PropsWithChildren): JSX.Element => <>{props.children}</>,
}), { virtual: true })

jest.mock('../../lib/services', () => ({
    downloadBlobFile: jest.fn(),
    downloadReportAsCsv: jest.fn(),
    downloadReportAsJson: jest.fn(),
    fetchReportJson: jest.fn(),
    fetchReportsIndex: jest.fn(),
}))

jest.mock('../../lib/utils', () => ({
    handleError: jest.fn(),
}))

const mockedFetchReportsIndex = fetchReportsIndex as jest.Mock
const mockedFetchReportJson = fetchReportJson as jest.Mock
const originalTimezone = process.env.TZ

const LocationProbe = (): JSX.Element => {
    const { pathname }: { pathname: string } = useLocation()

    return <output data-testid='location'>{pathname}</output>
}

describe('Reports page navigation', () => {
    beforeEach(() => {
        jest.clearAllMocks()
        mockedFetchReportsIndex.mockResolvedValue({
            identity: {
                basePath: '/identity',
                label: 'Identity',
                reports: [{
                    method: 'POST',
                    name: 'Users by Handles',
                    path: '/identity/users-by-handles',
                }],
            },
        })
    })

    afterEach(() => {
        if (originalTimezone) {
            process.env.TZ = originalTimezone
            return
        }

        delete process.env.TZ
    })

    it('opens Bulk Member Lookup from the Reports app root', async () => {
        render(
            <MemoryRouter initialEntries={['/reports/reports']}>
                <Routes>
                    <Route
                        path='/reports/*'
                        element={(
                            <>
                                <ReportsPage />
                                <LocationProbe />
                            </>
                        )}
                    />
                </Routes>
            </MemoryRouter>,
        )

        fireEvent.change(await screen.findByLabelText('Report category'), {
            target: { value: '/identity' },
        })
        fireEvent.change(screen.getByLabelText('Report'), {
            target: { value: '/identity/users-by-handles' },
        })
        fireEvent.click(screen.getByRole('button', { name: 'Open Bulk Member Lookup' }))

        expect(screen.getByTestId('location'))
            .toHaveTextContent('/reports/bulk-member-lookup')
    })

    it('renders SFDC payment dates in America/New_York', async () => {
        process.env.TZ = 'Asia/Colombo'
        const paymentDate = '2026-07-31T18:53:33.383-04:00'
        const payment: SfdcBillingAccountPaymentRow = {
            billingAccountId: '80000001',
            category: 'CHALLENGE_PAYMENT',
            challengeFee: '0.00',
            challengeId: 'challenge-id',
            challengeName: 'July payment',
            challengeStatus: 'Completed',
            isTask: false,
            paymentAmount: '100.00',
            paymentDate,
            paymentId: 'payment-id',
            paymentStatus: 'PAID',
            winnerFirstName: 'Ada',
            winnerHandle: 'ada',
            winnerId: '123',
            winnerLastName: 'Lovelace',
        }
        mockedFetchReportJson.mockResolvedValue([payment])

        render(
            <MemoryRouter initialEntries={['/reports/sfdc-payments']}>
                <BillingAccountsPage />
            </MemoryRouter>,
        )

        expect(await screen.findByText('July payment'))
            .toBeInTheDocument()
        const parsedPaymentDate = new Date(paymentDate)
        const displayedDate = parsedPaymentDate
            .toLocaleString(undefined, { timeZone: 'America/New_York' })
        const browserDisplayedDate = parsedPaymentDate
            .toLocaleString()

        expect(screen.getByText(displayedDate))
            .toBeInTheDocument()
        expect(parsedPaymentDate.getUTCDate())
            .toBe(31)
        expect(parsedPaymentDate.getDate())
            .toBe(1)
        expect(displayedDate)
            .not.toBe(browserDisplayedDate)

        mockedFetchReportJson.mockResolvedValueOnce({
            billingAccount: {
                budget: '1000.00',
                markup: '0.00',
                name: 'Boundary account',
                startDate: paymentDate,
                status: 'Active',
            },
        })
        fireEvent.click(screen.getByRole('button', { name: '80000001' }))

        expect(await screen.findByText(browserDisplayedDate))
            .toBeInTheDocument()
    })
})

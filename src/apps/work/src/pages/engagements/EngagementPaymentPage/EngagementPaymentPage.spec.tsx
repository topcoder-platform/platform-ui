/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import type {
    PropsWithChildren,
} from 'react'
import {
    fireEvent,
    render,
    screen,
    waitFor,
    within,
} from '@testing-library/react'
import {
    MemoryRouter,
    Route,
    Routes,
} from 'react-router-dom'

import type {
    Assignment,
} from '../../../lib/models'
import {
    useFetchEngagement,
    useFetchProject,
} from '../../../lib/hooks'

import {
    EditAssignmentModal,
    EngagementPaymentPage,
} from './EngagementPaymentPage'

jest.mock('~/apps/review/src/lib', () => ({
    PageWrapper: (props: PropsWithChildren<unknown>): JSX.Element => <div>{props.children}</div>,
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    BaseModal: (
        props: PropsWithChildren<{ buttons?: JSX.Element; open: boolean; title?: string }>,
    ): JSX.Element => (
        props.open
            ? (
                <div role='dialog'>
                    {props.title ? <div>{props.title}</div> : undefined}
                    {props.children}
                    {props.buttons}
                </div>
            )
            : <></>
    ),
    Button: (props: {
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), {
    virtual: true,
})

jest.mock('../../../lib/components', () => ({
    CompleteAssignmentModal: (): JSX.Element => <></>,
    ErrorMessage: (props: { message: string }): JSX.Element => <div>{props.message}</div>,
    LoadingSpinner: (): JSX.Element => <div>Loading</div>,
    PaymentFormModal: (): JSX.Element => <></>,
    PaymentHistoryModal: (): JSX.Element => <></>,
    TerminateAssignmentModal: (): JSX.Element => <></>,
}))

jest.mock('../../../lib/components/form', () => ({
    StartDateTimeInput: (props: {
        label: string
        value?: Date
    }): JSX.Element => (
        <label htmlFor='edit-assignment-start-date'>
            {props.label}
            <input
                id='edit-assignment-start-date'
                readOnly
                type='text'
                value={props.value
                    ? props.value.toISOString()
                    : ''}
            />
        </label>
    ),
}))

jest.mock('../../../lib/hooks', () => ({
    useFetchEngagement: jest.fn(),
    useFetchProject: jest.fn(),
}))

jest.mock('../../../lib/services', () => ({
    createMemberPayment: jest.fn(),
    partiallyUpdateEngagement: jest.fn(),
    updateEngagementAssignmentStatus: jest.fn(),
}))

jest.mock('../../../lib/utils', () => ({
    calculateAssignmentRatePerWeek: jest.fn((ratePerHour?: string, standardHoursPerWeek?: string) => {
        const rate = Number(ratePerHour || 0)
        const hours = Number(standardHoursPerWeek || 0)

        return rate > 0 && hours > 0
            ? (rate * hours)
                .toFixed(2)
            : ''
    }),
    deserializeTentativeAssignmentDate: jest.fn((value?: string) => (
        value
            ? new Date(value)
            : undefined
    )),
    normalizeAssignmentStatus: jest.fn((status: string) => status),
    sanitizePositiveNumericInput: jest.fn((value: string) => value),
    serializeTentativeAssignmentDate: jest.fn((value: Date) => value.toISOString()),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    toPositiveInteger: jest.fn((value: string) => {
        const parsed = Number.parseInt(value, 10)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    }),
    toPositiveNumber: jest.fn((value: string) => {
        const parsed = Number(value)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    }),
    toPositiveNumberWithMaxDecimalPlaces: jest.fn((value: string) => {
        const parsed = Number(value)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    }),
}))

jest.mock('../../../lib/utils/payment.utils', () => ({
    formatCurrency: jest.fn((value: number | string) => String(value)),
}))

const assignment: Assignment = {
    agreementRate: '411.00',
    durationMonths: 6,
    endDate: '2026-10-05T00:00:00.000Z',
    engagementId: 'engagement-1',
    id: 'assignment-1',
    memberHandle: 'testaws1',
    memberId: '12345',
    otherRemarks: 'testing 123',
    ratePerHour: '13.70',
    standardHoursPerWeek: 30,
    startDate: '2026-04-05T00:00:00.000Z',
    status: 'ASSIGNED',
    termsAccepted: true,
}

const mockedUseFetchEngagement = useFetchEngagement as jest.MockedFunction<typeof useFetchEngagement>
const mockedUseFetchProject = useFetchProject as jest.MockedFunction<typeof useFetchProject>

beforeEach(() => {
    jest.clearAllMocks()
})

describe('EngagementPaymentPage', () => {
    it('shows other remarks in a popup instead of inline text', async () => {
        mockedUseFetchEngagement.mockReturnValue({
            engagement: {
                assignments: [assignment],
                title: 'Test Engagement',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: jest.fn(),
        } as unknown as ReturnType<typeof useFetchEngagement>)

        mockedUseFetchProject.mockReturnValue({
            error: undefined,
            isLoading: false,
            mutate: jest.fn(),
            project: {
                billingAccountId: 'billing-account-1',
                name: 'Test Project',
            },
        } as unknown as ReturnType<typeof useFetchProject>)

        render(
            <MemoryRouter initialEntries={['/projects/project-1/engagements/engagement-1/assignments']}>
                <Routes>
                    <Route
                        element={<EngagementPaymentPage />}
                        path='/projects/:projectId/engagements/:engagementId/assignments'
                    />
                </Routes>
            </MemoryRouter>,
        )

        expect(screen.queryByText('testing 123'))
            .toBeNull()

        fireEvent.click(screen.getByRole('button', {
            name: 'View other remarks for testaws1',
        }))

        const dialog = await screen.findByRole('dialog')

        expect(dialog)
            .not.toBeNull()
        expect(within(dialog)
            .getByText('Other Remarks'))
            .not.toBeNull()
        expect(within(dialog)
            .getByText('testaws1'))
            .not.toBeNull()
        expect(within(dialog)
            .getByText('testing 123'))
            .not.toBeNull()

        fireEvent.click(screen.getByRole('button', { name: 'Close' }))

        await waitFor(() => {
            expect(screen.queryByText('testing 123'))
                .toBeNull()
        })
    })
})

describe('EditAssignmentModal', () => {
    it('populates the saved assignment values on the first open', async () => {
        const renderedModal: ReturnType<typeof render> = render(
            <EditAssignmentModal
                assignment={undefined}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open={false}
            />,
        )

        renderedModal.rerender(
            <EditAssignmentModal
                assignment={assignment}
                onCancel={jest.fn()}
                onConfirm={jest.fn()}
                open
            />,
        )

        await waitFor(() => {
            expect((screen.getByLabelText('Duration (in months)') as HTMLInputElement).value)
                .toBe('6')
            expect((screen.getByLabelText('Rate per hour *') as HTMLInputElement).value)
                .toBe('13.70')
            expect((screen.getByLabelText('Standard hours per week *') as HTMLInputElement).value)
                .toBe('30')
            expect((screen.getByLabelText('Other remarks') as HTMLTextAreaElement).value)
                .toBe('testing 123')
        })
    })
})

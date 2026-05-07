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
    useFetchProjectBillingAccount,
} from '../../../lib/hooks'
import {
    partiallyUpdateEngagement,
} from '../../../lib/services'
import {
    showErrorToast,
} from '../../../lib/utils'

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
    PaymentFormModal: (props: { open: boolean }): JSX.Element => (
        props.open
            ? <div>Create Payment</div>
            : <></>
    ),
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
    useFetchProjectBillingAccount: jest.fn(),
}))

jest.mock('../../../lib/services', () => ({
    createMemberPayment: jest.fn(),
    partiallyUpdateEngagement: jest.fn(),
    updateEngagementAssignmentStatus: jest.fn(),
}))

jest.mock('../../../lib/utils', () => ({
    calculateAssignmentRatePerWeek: (ratePerHour?: string, standardHoursPerWeek?: string) => {
        const rate = Number(ratePerHour || 0)
        const hours = Number(standardHoursPerWeek || 0)

        return rate > 0 && hours > 0
            ? (rate * hours)
                .toFixed(2)
            : ''
    },
    deserializeTentativeAssignmentDate: (value?: string) => (
        value
            ? new Date(value)
            : undefined
    ),
    getCountableEngagementAssignments: (assignments: Array<{ status?: string }> = []) => (
        assignments.filter(assignment => !['COMPLETED', 'OFFER_REJECTED', 'TERMINATED'].includes(
            String(assignment.status || '')
                .trim()
                .replace(/[\s-]+/g, '_')
                .toUpperCase(),
        ))
    ),
    normalizeAssignmentStatus: (status: string) => status,
    sanitizePositiveNumericInput: (value: string) => value,
    serializeTentativeAssignmentDate: (value: Date) => value.toISOString(),
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
    toPositiveInteger: (value: string) => {
        const parsed = Number.parseInt(value, 10)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    },
    toPositiveNumber: (value: string) => {
        const parsed = Number(value)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    },
    toPositiveNumberWithMaxDecimalPlaces: (value: string) => {
        const parsed = Number(value)

        return Number.isFinite(parsed) && parsed > 0
            ? parsed
            : undefined
    },
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
const mockedUseFetchProjectBillingAccount = useFetchProjectBillingAccount as jest.MockedFunction<
    typeof useFetchProjectBillingAccount
>
const mockedPartiallyUpdateEngagement = partiallyUpdateEngagement as jest.MockedFunction<
    typeof partiallyUpdateEngagement
>
const mockedShowErrorToast = showErrorToast as jest.MockedFunction<typeof showErrorToast>

beforeEach(() => {
    jest.clearAllMocks()
    mockedUseFetchProjectBillingAccount.mockReturnValue({
        billingAccount: {
            id: 'billing-account-1',
            markup: 0.15,
        },
        isLoading: false,
    } as unknown as ReturnType<typeof useFetchProjectBillingAccount>)
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

        const renderedPage: ReturnType<typeof render> = render(
            <MemoryRouter initialEntries={['/projects/project-1/engagements/engagement-1/assignments']}>
                <Routes>
                    <Route
                        element={<EngagementPaymentPage />}
                        path='/projects/:projectId/engagements/:engagementId/assignments'
                    />
                </Routes>
            </MemoryRouter>,
        )
        const container: HTMLElement = renderedPage.container

        expect(screen.queryByText('testing 123'))
            .toBeNull()
        const labels: Array<string | null> = Array.from(container.querySelectorAll('.label'))
            .map(element => element.textContent)

        expect(labels)
            .toEqual(expect.arrayContaining([
                'Billing Start Date*',
                'Rate Per Hour*',
                'Standard Hours Per Week*',
            ]))

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

    it('updates active assignment details without resubmitting terminal assignment history', async () => {
        const mutateEngagement = jest.fn()
            .mockResolvedValue(undefined)
        const terminatedAssignment: Assignment = {
            ...assignment,
            agreementRate: '200.00',
            endDate: '2026-04-01T00:00:00.000Z',
            id: 'assignment-terminated',
            memberHandle: 'finished_member',
            memberId: '67890',
            status: 'TERMINATED',
            terminationReason: 'Completed elsewhere',
        }

        mockedUseFetchEngagement.mockReturnValue({
            engagement: {
                assignments: [assignment, terminatedAssignment],
                title: 'Test Engagement',
            },
            error: undefined,
            isError: false,
            isLoading: false,
            mutate: mutateEngagement,
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

        mockedPartiallyUpdateEngagement.mockResolvedValue({
            assignments: [assignment, terminatedAssignment],
            title: 'Test Engagement',
        } as any)

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

        fireEvent.click(screen.getByRole('button', { name: 'Edit' }))
        fireEvent.click(within(await screen.findByRole('dialog'))
            .getByRole('button', { name: 'Save' }))

        await waitFor(() => {
            expect(mockedPartiallyUpdateEngagement)
                .toHaveBeenCalled()
        })

        const payload = mockedPartiallyUpdateEngagement.mock.calls[0][1] as {
            assignmentDetails?: Array<{ memberHandle?: string }>
        }

        expect(payload.assignmentDetails)
            .toHaveLength(1)
        expect(payload.assignmentDetails?.[0])
            .toEqual(expect.objectContaining({
                memberHandle: 'testaws1',
            }))
        expect(payload.assignmentDetails)
            .toEqual(expect.not.arrayContaining([
                expect.objectContaining({
                    memberHandle: 'finished_member',
                }),
            ]))
    })

    it('blocks payment creation when the project billing account is expired', () => {
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

        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                active: true,
                endDate: '2000-01-01T00:00:00.000Z',
                id: 'billing-account-1',
                markup: 0.15,
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useFetchProjectBillingAccount>)

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

        fireEvent.click(screen.getByRole('button', { name: 'Pay' }))

        expect(mockedShowErrorToast)
            .toHaveBeenCalledWith('Cannot create engagement payments because the project billing account is expired.')
        expect(screen.queryByText('Create Payment'))
            .toBeNull()
    })

    it('blocks payment creation when the project billing account is inactive', () => {
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

        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                active: false,
                id: 'billing-account-1',
                markup: 0.15,
            },
            isLoading: false,
        } as unknown as ReturnType<typeof useFetchProjectBillingAccount>)

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

        fireEvent.click(screen.getByRole('button', { name: 'Pay' }))

        expect(mockedShowErrorToast)
            .toHaveBeenCalledWith('Cannot create engagement payments because the project billing account is inactive.')
        expect(screen.queryByText('Create Payment'))
            .toBeNull()
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

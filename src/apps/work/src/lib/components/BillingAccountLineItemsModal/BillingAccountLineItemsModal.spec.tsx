/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'

import { useFetchEngagements } from '../../hooks/useFetchEngagements'
import type { Challenge } from '../../models'
import type { BillingAccountDetails } from '../../services'
import { fetchChallenge } from '../../services/challenges.service'

import BillingAccountLineItemsModal from './BillingAccountLineItemsModal'

jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
}))

jest.mock('../../hooks/useFetchEngagements', () => ({
    useFetchEngagements: jest.fn(),
}))

jest.mock('../../services/challenges.service', () => ({
    fetchChallenge: jest.fn(),
}))

jest.mock('~/config', () => ({
    EnvironmentConfig: {
        API: {
            V6: 'https://example.com/v6',
        },
    },
}), {
    virtual: true,
})

jest.mock('~/libs/core', () => ({
    xhrGetAsync: jest.fn(),
}), {
    virtual: true,
})

jest.mock('~/libs/ui', () => ({
    Button: (props: {
        label: string
        onClick: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    IconOutline: {
        LockClosedIcon: (): JSX.Element => <span>locked</span>,
        XIcon: (): JSX.Element => <span>close</span>,
    },
    IconSolid: {
        CheckCircleIcon: (): JSX.Element => <span>consumed</span>,
        ChevronDownIcon: (): JSX.Element => <span>sort-desc</span>,
        ChevronUpIcon: (): JSX.Element => <span>sort-asc</span>,
    },
}), {
    virtual: true,
})

const mockedUseFetchEngagements = useFetchEngagements as jest.MockedFunction<typeof useFetchEngagements>
const mockedFetchChallenge = fetchChallenge as jest.MockedFunction<typeof fetchChallenge>
let challengeMarkupById: Map<string, number>

const baseBillingAccountDetails: BillingAccountDetails = {
    budget: 1000,
    consumedAmounts: [],
    consumedBudget: 0,
    id: 80001063,
    lockedAmounts: [],
    lockedBudget: 0,
    name: 'Platform Dev - One',
    totalBudgetRemaining: 1000,
}

function renderModal(
    billingAccountDetails: BillingAccountDetails,
    showMemberPaymentsRemaining?: boolean,
    projectId?: number | string,
): ReturnType<typeof render> {
    return render(
        <BillingAccountLineItemsModal
            billingAccountDetails={billingAccountDetails}
            onClose={jest.fn()}
            projectId={projectId}
            showMemberPaymentsRemaining={showMemberPaymentsRemaining}
        />,
    )
}

describe('BillingAccountLineItemsModal', () => {
    beforeEach(() => {
        challengeMarkupById = new Map<string, number>()
        mockedFetchChallenge.mockReset()
        mockedFetchChallenge.mockImplementation(async (challengeId: string): Promise<Challenge> => ({
            billing: {
                markup: challengeMarkupById.get(challengeId) ?? 0.33,
            },
            id: challengeId,
            name: `Challenge ${challengeId}`,
            status: 'ACTIVE',
        }))
        mockedUseFetchEngagements.mockReset()
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 0,
                total: 0,
                totalPages: 0,
            },
            mutate: jest.fn(),
        })
    })

    it('builds challenge links under the work root for path-based deployments', () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge / 100',
                    externalName: 'Canonical Challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125.25,
            totalBudgetRemaining: 874.75,
        })

        const challengeLink = screen.getByRole('link', {
            name: 'Canonical Challenge',
        })

        expect(challengeLink.getAttribute('href'))
            .toBe('/work/challenges/challenge%20%2F%20100')
    })

    it('shows challenge member payments without removing markup from the stored subtotal', async () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '28.6',
                    date: '2026-05-12T00:00:00.000Z',
                    externalId: '5fdf48d2-811f-4914-b713-9e5f423c907d',
                    externalName: 'Copilot and Admin with reviews',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 28.6,
            markup: 0.33,
            totalBudgetRemaining: 971.4,
        })

        expect(screen.getByText('Member Payments'))
            .toBeTruthy()
        expect(screen.getByText('Challenge Fee'))
            .toBeTruthy()
        await waitFor(() => {
            expect(screen.getAllByText('$28.60'))
                .toHaveLength(2)
            expect(screen.getByText('$9.44'))
                .toBeTruthy()
        })
        expect(screen.queryByText('$21.50'))
            .toBeNull()
        expect(screen.queryByText('$7.10'))
            .toBeNull()
    })

    it('removes challenge markup once from consumed challenge charges before showing member payments', async () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '33.25',
                    date: '2026-05-12T00:00:00.000Z',
                    externalId: '2864601d-320a-45e2-85b4-a14f9f19785e',
                    externalName: 'May 12 challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            consumedBudget: 33.25,
            markup: 0.33,
            totalBudgetRemaining: 966.75,
        })

        await waitFor(() => {
            expect(screen.getByText('$25.00'))
                .toBeTruthy()
            expect(screen.getByText('$8.25'))
                .toBeTruthy()
        })
        expect(screen.queryByText('$10.97'))
            .toBeNull()
    })

    it('uses zero challenge markup instead of billing-account default markup for consumed charges', async () => {
        challengeMarkupById.set('0f4c801c-4d4d-4ac2-8e2e-60aeb16379d2', 0)

        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '9',
                    date: '2026-05-12T00:00:00.000Z',
                    externalId: '0f4c801c-4d4d-4ac2-8e2e-60aeb16379d2',
                    externalName: 'Member payment retest 1',
                    externalType: 'CHALLENGE',
                },
            ],
            consumedBudget: 9,
            markup: 0.33,
            totalBudgetRemaining: 991,
        })

        await waitFor(() => {
            expect(screen.getAllByText('$9.00'))
                .toHaveLength(2)
            expect(screen.getAllByText('$0.00'))
                .toHaveLength(2)
        })
        expect(screen.queryByText('$6.77'))
            .toBeNull()
        expect(screen.queryByText('$2.23'))
            .toBeNull()
    })

    it('builds engagement links from assignment-backed billing rows', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [
                {
                    anticipatedStart: 'IMMEDIATE',
                    assignedMemberHandles: [],
                    assignments: [
                        {
                            agreementRate: '100',
                            endDate: '2026-03-01T00:00:00.000Z',
                            engagementId: 'engagement-300',
                            id: 'assignment-300',
                            memberHandle: 'member',
                            memberId: 123,
                            otherRemarks: '',
                            startDate: '2026-02-01T00:00:00.000Z',
                            status: 'ACTIVE',
                            termsAccepted: true,
                        },
                    ],
                    compensationRange: '$100',
                    countries: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    description: 'Engagement description',
                    durationWeeks: 4,
                    id: 'engagement-300',
                    isPrivate: false,
                    projectId: 'project 200',
                    requiredMemberCount: 1,
                    role: 'SOFTWARE_DEVELOPER',
                    skills: [],
                    status: 'Active',
                    timezones: [],
                    title: 'Resolved Engagement',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                    workload: 'FULL_TIME',
                },
            ],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 1,
                total: 1,
                totalPages: 1,
            },
            mutate: jest.fn(),
        })

        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '120',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'assignment-300',
                    externalName: 'Resolved Engagement',
                    externalType: 'ENGAGEMENT',
                },
            ],
            consumedBudget: 120,
            markup: 0.2,
            totalBudgetRemaining: 880,
        }, false, 'project 200')

        const engagementLink = screen.getByRole('link', {
            name: 'Resolved Engagement',
        })

        expect(engagementLink.getAttribute('href'))
            .toBe('/work/projects/project%20200/engagements/engagement-300')
        expect(screen.getByText('$100.00'))
            .toBeTruthy()
        expect(screen.getByText('$20.00'))
            .toBeTruthy()
        expect(mockedUseFetchEngagements)
            .toHaveBeenLastCalledWith(
                'project 200',
                { includePrivate: true },
                { enabled: true },
            )
    })

    it('builds engagement links from assignment-backed billing rows for copilot views', () => {
        mockedUseFetchEngagements.mockReturnValue({
            engagements: [
                {
                    anticipatedStart: 'IMMEDIATE',
                    assignedMemberHandles: [],
                    assignments: [
                        {
                            agreementRate: '100',
                            endDate: '2026-03-01T00:00:00.000Z',
                            engagementId: 'engagement-300',
                            id: 'assignment-300',
                            memberHandle: 'member',
                            memberId: 123,
                            otherRemarks: '',
                            startDate: '2026-02-01T00:00:00.000Z',
                            status: 'ACTIVE',
                            termsAccepted: true,
                        },
                    ],
                    compensationRange: '$100',
                    countries: [],
                    createdAt: '2026-01-01T00:00:00.000Z',
                    description: 'Engagement description',
                    durationWeeks: 4,
                    id: 'engagement-300',
                    isPrivate: false,
                    projectId: 'project 200',
                    requiredMemberCount: 1,
                    role: 'SOFTWARE_DEVELOPER',
                    skills: [],
                    status: 'Active',
                    timezones: [],
                    title: 'Resolved Engagement',
                    updatedAt: '2026-01-01T00:00:00.000Z',
                    workload: 'FULL_TIME',
                },
            ],
            error: undefined,
            isLoading: false,
            isValidating: false,
            metadata: {
                page: 1,
                perPage: 1,
                total: 1,
                totalPages: 1,
            },
            mutate: jest.fn(),
        })

        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '120',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'assignment-300',
                    externalName: 'Resolved Engagement',
                    externalType: 'ENGAGEMENT',
                    memberPaymentAmount: '100',
                },
            ],
            consumedBudget: 120,
            memberPaymentsRemaining: 500,
            totalBudgetRemaining: 880,
        }, true, 'project 200')

        const engagementLink = screen.getByRole('link', {
            name: 'Resolved Engagement',
        })

        expect(engagementLink.getAttribute('href'))
            .toBe('/work/projects/project%20200/engagements/engagement-300')
        expect(mockedUseFetchEngagements)
            .toHaveBeenLastCalledWith(
                'project 200',
                { includePrivate: true },
                { enabled: true },
            )
    })

    it('renders legacy-only challenge rows as plain text', () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '125.25',
                    challengeId: 'legacy-challenge-100',
                    date: '2026-02-10T00:00:00.000Z',
                    externalName: 'Legacy Challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125.25,
            totalBudgetRemaining: 874.75,
        })

        expect(screen.getByText('Legacy Challenge'))
            .toBeTruthy()
        expect(screen.queryByRole('link', {
            name: 'Legacy Challenge',
        }))
            .toBeNull()
    })

    it('renders ISO midnight entry dates without local timezone shifts', () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Date Stable Challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125.25,
            totalBudgetRemaining: 874.75,
        })

        expect(screen.getByText('2026-02-10'))
            .toBeTruthy()
    })

    it('shows only remaining member payments and derived engagement row amounts for copilots', () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedBudget: 500,
            lockedAmounts: [
                {
                    amount: '50',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'engagement-100',
                    externalName: 'Markup Engagement',
                    externalType: 'ENGAGEMENT',
                },
            ],
            lockedBudget: 66.5,
            markup: 0.33,
            memberPaymentsRemaining: 200,
            totalBudgetRemaining: 433.5,
        }, true)

        expect(screen.getByText('Remaining member payments'))
            .toBeTruthy()
        expect(screen.getByText('$200.00'))
            .toBeTruthy()
        expect(screen.getByText('$37.59'))
            .toBeTruthy()
        expect(screen.queryByText('$50.00'))
            .toBeNull()
        expect(screen.queryByText('Consumed'))
            .toBeNull()
        expect(screen.queryByText('Remaining'))
            .toBeNull()
        expect(screen.queryByText('Challenge Fee'))
            .toBeNull()
    })

    it('shows challenge row amounts for copilots when API member-payment aliases include markup math', () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '9.15',
                    date: '2026-05-08T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Test',
                    externalType: 'CHALLENGE',
                    memberPaymentAmount: '6.88',
                },
            ],
            lockedBudget: 9.15,
            markup: 0.33,
            memberPaymentsRemaining: 273413.64,
            totalBudgetRemaining: 273413.64,
        }, true)

        expect(screen.getByText('$9.15'))
            .toBeTruthy()
        expect(screen.queryByText('$6.88'))
            .toBeNull()
    })

    it('shows consumed challenge member payments without challenge fees for copilots', async () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '33.25',
                    date: '2026-05-12T00:00:00.000Z',
                    externalId: '2864601d-320a-45e2-85b4-a14f9f19785e',
                    externalName: 'May 12 challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            consumedBudget: 33.25,
            markup: 0.33,
            memberPaymentsRemaining: 200,
            totalBudgetRemaining: 966.75,
        }, true)

        await waitFor(() => {
            expect(screen.getByText('$25.00'))
                .toBeTruthy()
        })
        expect(screen.queryByText('$33.25'))
            .toBeNull()
        expect(screen.queryByText('Challenge Fee'))
            .toBeNull()
    })

    it('uses API-provided engagement member-payment row amounts for copilot responses without markup', () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'engagement-100',
                    externalName: 'Consumed Markup Engagement',
                    externalType: 'ENGAGEMENT',
                    memberPaymentAmount: '100.20',
                },
            ],
            consumedBudget: 125.25,
            memberPaymentsRemaining: 200,
            totalBudgetRemaining: 250,
        }, true)

        expect(screen.getByText('Remaining member payments'))
            .toBeTruthy()
        expect(screen.getByText('$200.00'))
            .toBeTruthy()
        expect(screen.getByText('$100.20'))
            .toBeTruthy()
        expect(screen.queryByText('$125.25'))
            .toBeNull()
        expect(screen.queryByText('Remaining'))
            .toBeNull()
    })
})

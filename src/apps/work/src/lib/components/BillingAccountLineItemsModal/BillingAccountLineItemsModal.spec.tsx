/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import { useFetchEngagements } from '../../hooks/useFetchEngagements'
import type { BillingAccountDetails } from '../../services'

import BillingAccountLineItemsModal from './BillingAccountLineItemsModal'

jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
}))

jest.mock('../../hooks/useFetchEngagements', () => ({
    useFetchEngagements: jest.fn(),
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

    it('shows member payments and challenge fees for non-copilot users', () => {
        renderModal({
            ...baseBillingAccountDetails,
            lockedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Markup Challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 125.25,
            markup: 0.25,
            totalBudgetRemaining: 874.75,
        })

        expect(screen.getByText('Member Payments'))
            .toBeTruthy()
        expect(screen.getByText('Challenge Fee'))
            .toBeTruthy()
        expect(screen.getByText('$100.20'))
            .toBeTruthy()
        expect(screen.getByText('$25.05'))
            .toBeTruthy()
        expect(screen.getAllByText('$125.25'))
            .toHaveLength(1)
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

    it('shows only remaining member payments and member-payment row amounts for copilots', () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedBudget: 500,
            lockedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Markup Challenge',
                    externalType: 'CHALLENGE',
                },
            ],
            lockedBudget: 250,
            markup: 0.25,
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
        expect(screen.queryByText('Consumed'))
            .toBeNull()
        expect(screen.queryByText('Remaining'))
            .toBeNull()
        expect(screen.queryByText('Challenge Fee'))
            .toBeNull()
    })

    it('uses API-provided member-payment row amounts for copilot responses without markup', () => {
        renderModal({
            ...baseBillingAccountDetails,
            consumedAmounts: [
                {
                    amount: '125.25',
                    date: '2026-02-10T00:00:00.000Z',
                    externalId: 'challenge-100',
                    externalName: 'Consumed Markup Challenge',
                    externalType: 'CHALLENGE',
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

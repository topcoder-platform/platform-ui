/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    render,
    screen,
} from '@testing-library/react'

import type { BillingAccountDetails } from '../../services'

import BillingAccountLineItemsModal from './BillingAccountLineItemsModal'

jest.mock('../../../config/routes.config', () => ({
    rootRoute: '/work',
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
    showMemberPaymentsRemaining: boolean = false,
): ReturnType<typeof render> {
    return render(
        <BillingAccountLineItemsModal
            billingAccountDetails={billingAccountDetails}
            onClose={jest.fn()}
            showMemberPaymentsRemaining={showMemberPaymentsRemaining}
        />,
    )
}

describe('BillingAccountLineItemsModal', () => {
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

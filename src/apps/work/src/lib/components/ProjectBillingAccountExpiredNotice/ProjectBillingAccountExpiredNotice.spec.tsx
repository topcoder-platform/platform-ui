/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

import { WorkAppContext } from '../../contexts/WorkAppContext'
import type { WorkAppContextModel } from '../../models'
import type { BillingAccountDetails } from '../../services'
import {
    useFetchBillingAccountDetails,
    useFetchBillingAccounts,
    useFetchProjectBillingAccount,
} from '../../hooks'

import ProjectBillingAccountExpiredNotice from './ProjectBillingAccountExpiredNotice'

jest.mock('../../hooks', () => ({
    useFetchBillingAccountDetails: jest.fn(),
    useFetchBillingAccounts: jest.fn(),
    useFetchProjectBillingAccount: jest.fn(),
}))

jest.mock('../BillingAccountLineItemsModal', () => ({
    BillingAccountLineItemsModal: (props: {
        billingAccountDetails: BillingAccountDetails
    }): JSX.Element => (
        <div role='dialog'>
            Billing account details for
            {' '}
            {props.billingAccountDetails.id}
        </div>
    ),
}))

jest.mock('~/libs/ui', () => ({
    IconOutline: {
        InformationCircleIcon: (): JSX.Element => <span>info</span>,
    },
}), {
    virtual: true,
})

const mockedUseFetchBillingAccountDetails = useFetchBillingAccountDetails as jest.MockedFunction<
    typeof useFetchBillingAccountDetails
>
const mockedUseFetchBillingAccounts = useFetchBillingAccounts as jest.MockedFunction<typeof useFetchBillingAccounts>
const mockedUseFetchProjectBillingAccount = useFetchProjectBillingAccount as jest.MockedFunction<
    typeof useFetchProjectBillingAccount
>

const billingAccountDetails: BillingAccountDetails = {
    budget: 1000,
    consumedAmounts: [],
    consumedBudget: 0,
    id: 80001063,
    lockedAmounts: [],
    lockedBudget: 0,
    name: 'Test Project Engagement BA',
    totalBudgetRemaining: -25,
}

const defaultContextValue: WorkAppContextModel = {
    isAdmin: false,
    isAnonymous: false,
    isCopilot: false,
    isManager: false,
    isReadOnly: false,
    loginUserInfo: undefined,
    userRoles: [],
}

function renderNotice(
    contextValue?: WorkAppContextModel,
    displayMemberPaymentDetailsToCopilots?: boolean,
): void {
    render(
        <WorkAppContext.Provider value={contextValue || defaultContextValue}>
            <MemoryRouter>
                <ProjectBillingAccountExpiredNotice
                    billingAccountId={80001063}
                    billingAccountName='Test Project Engagement BA'
                    canManageProject
                    displayMemberPaymentDetailsToCopilots={
                        displayMemberPaymentDetailsToCopilots
                    }
                    projectId='project-1'
                />
            </MemoryRouter>
        </WorkAppContext.Provider>,
    )
}

describe('ProjectBillingAccountExpiredNotice', () => {
    beforeEach(() => {
        jest.clearAllMocks()

        mockedUseFetchBillingAccounts.mockReturnValue({
            billingAccounts: [],
            error: undefined,
            isError: false,
            isLoading: false,
        })
        mockedUseFetchBillingAccountDetails.mockReturnValue({
            billingAccountDetails,
            error: undefined,
            isError: false,
            isLoading: false,
        })
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                active: true,
                id: '80001063',
                name: 'Test Project Engagement BA',
                status: 'ACTIVE',
                totalBudgetRemaining: -25,
            },
            isLoading: false,
        })
    })

    it('keeps billing account details and line items available when remaining funds are insufficient', () => {
        renderNotice()

        expect(screen.getByText(/Billing account:/))
            .toBeTruthy()
        expect(screen.getByText(/Test Project Engagement BA/))
            .toBeTruthy()
        expect(screen.getByText(/80001063/))
            .toBeTruthy()
        expect(screen.getByText('$1,025 / $1,000 spent'))
            .toBeTruthy()
        expect(screen.getByText(/The billing account for this project has insufficient remaining funds,/))
            .toBeTruthy()
        expect(screen.getByRole('link', { name: 'click here to update' })
            .getAttribute('href'))
            .toBe('/projects/project-1/edit')

        fireEvent.click(screen.getByRole('button', {
            name: 'View billing account details',
        }))

        expect(screen.getByRole('dialog')
            .textContent)
            .toContain('Billing account details for 80001063')
    })

    it('shows member payments remaining instead of spent and total budget for copilots', () => {
        mockedUseFetchBillingAccountDetails.mockReturnValue({
            billingAccountDetails: {
                ...billingAccountDetails,
                budget: 1000,
                markup: 0.25,
                totalBudgetRemaining: 250,
            },
            error: undefined,
            isError: false,
            isLoading: false,
        })
        mockedUseFetchProjectBillingAccount.mockReturnValue({
            billingAccount: {
                active: true,
                id: '80001063',
                markup: 0.25,
                name: 'Test Project Engagement BA',
                status: 'ACTIVE',
                totalBudgetRemaining: 250,
            },
            isLoading: false,
        })

        renderNotice({
            ...defaultContextValue,
            isCopilot: true,
            userRoles: ['copilot'],
        })

        expect(screen.getByText('Member Payments Remaining: $200.00'))
            .toBeTruthy()
        expect(screen.queryByText('$750 / $1,000 spent'))
            .toBeNull()
    })

    it('hides member payments and billing details from copilots when the project disables the flag', () => {
        mockedUseFetchBillingAccountDetails.mockReturnValue({
            billingAccountDetails: {
                ...billingAccountDetails,
                budget: 1000,
                markup: 0.25,
                totalBudgetRemaining: 250,
            },
            error: undefined,
            isError: false,
            isLoading: false,
        })

        renderNotice({
            ...defaultContextValue,
            isCopilot: true,
            userRoles: ['copilot'],
        }, false)

        expect(screen.queryByText('Member Payments Remaining: $200.00'))
            .toBeNull()
        expect(screen.queryByText('$750 / $1,000 spent'))
            .toBeNull()
        expect(screen.queryByRole('button', {
            name: 'View billing account details',
        }))
            .toBeNull()
        expect(mockedUseFetchBillingAccountDetails)
            .toHaveBeenCalledWith(undefined)
    })
})

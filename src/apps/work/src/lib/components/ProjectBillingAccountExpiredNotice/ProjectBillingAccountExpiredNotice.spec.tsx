/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import {
    fireEvent,
    render,
    screen,
} from '@testing-library/react'
import { MemoryRouter } from 'react-router-dom'

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
        render(
            <MemoryRouter>
                <ProjectBillingAccountExpiredNotice
                    billingAccountId={80001063}
                    billingAccountName='Test Project Engagement BA'
                    canManageProject
                    projectId='project-1'
                />
            </MemoryRouter>,
        )

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
})

import type { ProjectBillingAccount } from '../services'

import {
    getProjectBillingAccountChallengeErrorMessage,
    getProjectBillingAccountChallengeIssue,
    getProjectBillingAccountNoticeMessage,
} from './project-billing-account.utils'

describe('project-billing-account challenge gating helpers', () => {
    it('treats inactive billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: false,
            id: '80001061',
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('inactive')
        expect(getProjectBillingAccountNoticeMessage('inactive'))
            .toBe('The billing account for this project is inactive.')
        expect(getProjectBillingAccountChallengeErrorMessage('inactive'))
            .toBe('Cannot launch challenges because the project billing account is inactive.')
    })

    it('treats expired billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2000-01-01T00:00:00.000Z',
            id: '80001061',
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('expired')
    })

    it('treats depleted billing accounts as blocked for challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2099-01-01T00:00:00.000Z',
            id: '80001061',
            status: 'ACTIVE',
            totalBudgetRemaining: 0,
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBe('insufficient-funds')
        expect(getProjectBillingAccountNoticeMessage('insufficient-funds'))
            .toBe('The billing account for this project has insufficient remaining funds.')
        expect(getProjectBillingAccountChallengeErrorMessage('insufficient-funds'))
            .toBe(
                'Cannot launch challenges because the project billing account has insufficient remaining funds.',
            )
    })

    it('allows active, funded billing accounts to launch challenges', () => {
        const billingAccount: ProjectBillingAccount = {
            active: true,
            endDate: '2099-01-01T00:00:00.000Z',
            id: '80001061',
            status: 'ACTIVE',
            totalBudgetRemaining: 150,
        }

        expect(getProjectBillingAccountChallengeIssue(billingAccount))
            .toBeUndefined()
    })
})

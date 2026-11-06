/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { copyTextToClipboard } from '~/libs/shared'

import { EngagementLead, EngagementLeadStatus, EngagementLeadType } from '../../models/EngagementLead.model'

import { FlexiTalentCalculatorModal } from './FlexiTalentCalculatorModal'

jest.mock('~/libs/shared', () => ({
    copyTextToClipboard: jest.fn(),
}), { virtual: true })

jest.mock('~/libs/ui', () => ({
    BaseModal: (props: {
        buttons?: JSX.Element
        children: JSX.Element
        open: boolean
    }): JSX.Element => (
        props.open ? (
            <div>
                {props.children}
                {props.buttons}
            </div>
        ) : <></>
    ),
    Button: (props: {
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
}), { virtual: true })

jest.mock('../../utils', () => ({
    extractErrorMessage: (_err: unknown, fallback: string): string => fallback,
    showErrorToast: jest.fn(),
    showSuccessToast: jest.fn(),
}))

const lead: EngagementLead = {
    accountName: 'Acme',
    createdAt: '2026-11-01T00:00:00.000Z',
    engagementDuration: '12 months',
    id: 'lead-1',
    jobDescription: 'Build things',
    leadType: EngagementLeadType.WIPRO_CONSUMPTION,
    remoteWorkAccepted: true,
    requiredSkills: [],
    resourcesRequired: 1,
    roleTitle: 'Java Developer',
    smu: 'EURP',
    status: EngagementLeadStatus.SUBMITTED,
    timeZoneRequirement: 'Any',
    updatedAt: '2026-11-01T00:00:00.000Z',
    workEmail: 'spoc@example.com',
    workingHoursPerDay: 8,
}

describe('FlexiTalentCalculatorModal', () => {
    beforeEach(() => {
        jest.mocked(copyTextToClipboard)
            .mockReset()
            .mockResolvedValue(undefined)
    })

    it('prefills the lead details', () => {
        render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)

        expect(screen.getByLabelText('Account Name'))
            .toHaveValue('Acme')
        expect(screen.getByLabelText('Role'))
            .toHaveValue('Java Developer')
        expect(screen.getByLabelText('SMU'))
            .toHaveValue('EURP')
        expect(screen.getByLabelText('Duration (Weeks)'))
            .toHaveValue('52')
        expect(screen.getByTestId('total-billing-hours'))
            .toHaveTextContent('2,080')
    })

    it('recalculates from the last edited commercial value', async () => {
        const user = userEvent.setup()
        render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)

        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220000')

        expect(screen.getByLabelText('Member Cost (USD)'))
            .toHaveValue('104000')
        expect(screen.getByLabelText('Actual Cost (USD)'))
            .toHaveValue('161260')

        await user.type(screen.getByLabelText('TC Margin %'), '{Control>}a{/Control}20')

        expect(screen.getByLabelText('TC Margin %'))
            .toHaveValue('20')
        expect(screen.getByLabelText('Actual Cost (USD)'))
            .toHaveValue('130000')

        await user.selectOptions(screen.getByLabelText('Referral'), 'yes')

        expect(screen.getByLabelText('TC Margin %'))
            .toHaveValue('20')
        expect(screen.getByLabelText('Actual Cost (USD)'))
            .toHaveValue('143000')
    })

    it('copies the cost proposal', async () => {
        const user = userEvent.setup()
        render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)

        await user.type(screen.getByLabelText('Member Name'), 'Jane Doe')
        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220000')
        await user.click(screen.getByRole('button', { name: 'Copy Cost Proposal' }))

        await waitFor(() => {
            expect(copyTextToClipboard)
                .toHaveBeenCalledWith(expect.stringContaining(
                    'Wipro Cost Benefit: USD 58,740 (26.70% for EURP SMU)',
                ))
        })
        expect(screen.getByTestId('cost-proposal'))
            .toHaveTextContent('Please find below the cost proposal for Jane Doe:')
    })
})

/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { ChangeEvent } from 'react'

import {
    render,
    screen,
    waitFor,
} from '@testing-library/react'
import userEvent from '@testing-library/user-event'

import { copyTextToClipboard } from '~/libs/shared'

import { EngagementLead, EngagementLeadStatus, EngagementLeadType } from '../../models/EngagementLead.model'
import {
    EngagementLeadCalculation,
    LeadCalculationCommercialInput,
    LeadCalculationMemberInput,
} from '../../models/EngagementLeadCalculation.model'
import {
    createEngagementLeadCalculation,
    deleteEngagementLeadCalculation,
    fetchEngagementLeadCalculations,
    updateEngagementLeadCalculation,
} from '../../services/engagement-leads.service'

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
        disabled?: boolean
        label: string
        onClick?: () => void
    }): JSX.Element => (
        <button disabled={props.disabled} onClick={props.onClick} type='button'>
            {props.label}
        </button>
    ),
    InputSelect: (props: {
        label: string
        name: string
        onChange: (event: ChangeEvent<HTMLSelectElement>) => void
        options: ReadonlyArray<{ label: string; value: string }>
        placeholder?: string
        value?: string
    }): JSX.Element => (
        <label>
            {props.label}
            <select name={props.name} value={props.value} onChange={props.onChange}>
                {props.placeholder && <option value=''>{props.placeholder}</option>}
                {props.options.map(option => (
                    <option key={option.value} value={option.value}>{option.label}</option>
                ))}
            </select>
        </label>
    ),
    InputText: (props: {
        label: string
        name: string
        onChange: (event: ChangeEvent<HTMLInputElement>) => void
        placeholder?: string
        readonly?: boolean
        value?: string
    }): JSX.Element => (
        <label>
            {props.label}
            <input
                name={props.name}
                placeholder={props.placeholder}
                readOnly={props.readonly}
                value={props.value}
                onChange={props.onChange}
            />
        </label>
    ),
}), { virtual: true })

jest.mock('../../services/engagement-leads.service', () => ({
    createEngagementLeadCalculation: jest.fn(),
    deleteEngagementLeadCalculation: jest.fn(),
    fetchEngagementLeadCalculations: jest.fn(),
    updateEngagementLeadCalculation: jest.fn(),
}))

jest.mock('../LoadingSpinner', () => ({
    LoadingSpinner: (): JSX.Element => <div>Loading</div>,
}))

jest.mock('../ErrorMessage', () => ({
    ErrorMessage: (props: { message: string }): JSX.Element => <div role='alert'>{props.message}</div>,
}))

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

const savedCalculation: EngagementLeadCalculation = {
    accountName: 'Acme Europe',
    commercialInputField: LeadCalculationCommercialInput.TC_MARGIN_PERCENT,
    commercialInputValue: 20,
    createdAt: '2026-11-10T00:00:00.000Z',
    durationWeeks: 10,
    engagementLeadId: 'lead-1',
    hoursPerDay: 8,
    id: 'calc-1',
    memberInputField: LeadCalculationMemberInput.MEMBER_RATE,
    memberInputValue: 50,
    memberName: 'Jane Doe',
    referral: false,
    smu: 'AMR1',
    updatedAt: '2026-11-10T00:00:00.000Z',
}

async function renderCalculator(): Promise<void> {
    render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)
    await screen.findByLabelText('Member Name')
}

describe('FlexiTalentCalculatorModal', () => {
    beforeEach(() => {
        jest.mocked(copyTextToClipboard)
            .mockReset()
            .mockResolvedValue(undefined)
        jest.mocked(fetchEngagementLeadCalculations)
            .mockReset()
            .mockResolvedValue([])
        jest.mocked(createEngagementLeadCalculation)
            .mockReset()
            .mockResolvedValue({ ...savedCalculation, id: 'calc-new' })
        jest.mocked(updateEngagementLeadCalculation)
            .mockReset()
            .mockResolvedValue(savedCalculation)
        jest.mocked(deleteEngagementLeadCalculation)
            .mockReset()
            .mockResolvedValue(undefined)
    })

    it('prefills a new calculation from the lead when none is saved', async () => {
        await renderCalculator()

        expect(fetchEngagementLeadCalculations)
            .toHaveBeenCalledWith('lead-1')
        expect(screen.getByLabelText('Account Name'))
            .toHaveValue('Acme')
        expect(screen.getByLabelText('SMU'))
            .toHaveValue('EURP')
        expect(screen.getByLabelText('Duration (Weeks)'))
            .toHaveValue('52')
        expect(screen.getByLabelText('Hours per Day'))
            .toHaveValue('8')
        expect(screen.getByRole('tab', { name: /Calculation 1/ }))
            .toBeInTheDocument()
    })

    it('recalculates from the last edited commercial value', async () => {
        const user = userEvent.setup()
        await renderCalculator()

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
        await renderCalculator()

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

    it('shows the last saved values of each saved calculation', async () => {
        jest.mocked(fetchEngagementLeadCalculations)
            .mockResolvedValue([
                savedCalculation,
                { ...savedCalculation, id: 'calc-2', memberName: 'John Roe', smu: 'EURP' },
            ])
        const user = userEvent.setup()
        await renderCalculator()

        expect(screen.getByLabelText('Member Name'))
            .toHaveValue('Jane Doe')
        expect(screen.getByLabelText('Account Name'))
            .toHaveValue('Acme Europe')
        expect(screen.getByLabelText('SMU'))
            .toHaveValue('AMR1')
        expect(screen.getByLabelText('TC Margin %'))
            .toHaveValue('20')
        // 50/h × 400 h = 20,000 member cost at a 20% margin.
        expect(screen.getByLabelText('Actual Cost (USD)'))
            .toHaveValue('25000')

        await user.click(screen.getByRole('tab', { name: 'John Roe' }))

        expect(screen.getByLabelText('Member Name'))
            .toHaveValue('John Roe')
        expect(screen.getByLabelText('SMU'))
            .toHaveValue('EURP')
    })

    it('saves a new calculation, then overwrites it on the next save', async () => {
        const user = userEvent.setup()
        await renderCalculator()

        const saveButton = screen.getByRole('button', { name: 'Save' })
        expect(saveButton)
            .toBeDisabled()

        await user.type(screen.getByLabelText('Member Name'), 'Jane Doe')
        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220,000')
        await user.click(saveButton)

        await waitFor(() => {
            expect(createEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', {
                    accountName: 'Acme',
                    commercialInputField: LeadCalculationCommercialInput.BOOKING_COST,
                    commercialInputValue: 220000,
                    durationWeeks: 52,
                    hoursPerDay: 8,
                    memberInputField: LeadCalculationMemberInput.MEMBER_RATE,
                    memberInputValue: 50,
                    memberName: 'Jane Doe',
                    referral: false,
                    smu: 'EURP',
                })
        })
        // The typed value stays as entered after saving.
        expect(screen.getByLabelText('Booking Cost (USD)'))
            .toHaveValue('220,000')

        await user.selectOptions(screen.getByLabelText('Referral'), 'yes')
        await user.click(screen.getByRole('button', { name: 'Save' }))

        await waitFor(() => {
            expect(updateEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', 'calc-new', expect.objectContaining({ referral: true }))
        })
        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledTimes(1)
    })

    it('adds a second calculation for the lead', async () => {
        jest.mocked(fetchEngagementLeadCalculations)
            .mockResolvedValue([savedCalculation])
        const user = userEvent.setup()
        await renderCalculator()

        await user.click(screen.getByRole('button', { name: '+ Add Calculation' }))

        expect(screen.getByRole('tab', { name: /Calculation 2/ }))
            .toHaveAttribute('aria-selected', 'true')
        expect(screen.getByLabelText('Member Name'))
            .toHaveValue('')
        expect(screen.getByLabelText('SMU'))
            .toHaveValue('EURP')
    })

    it('deletes a saved calculation after confirmation', async () => {
        jest.mocked(fetchEngagementLeadCalculations)
            .mockResolvedValue([savedCalculation])
        const user = userEvent.setup()
        await renderCalculator()

        await user.click(screen.getByRole('button', { name: 'Delete' }))
        expect(deleteEngagementLeadCalculation)
            .not.toHaveBeenCalled()

        await user.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => {
            expect(deleteEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', 'calc-1')
        })
        // Deleting the only calculation leaves a fresh one prefilled from the lead.
        expect(await screen.findByRole('tab', { name: /Calculation 1/ }))
            .toBeInTheDocument()
        expect(screen.getByLabelText('Member Name'))
            .toHaveValue('')
    })

    it('shows an error when the saved calculations cannot be loaded', async () => {
        jest.mocked(fetchEngagementLeadCalculations)
            .mockRejectedValue(new Error('boom'))
        render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)

        expect(await screen.findByRole('alert'))
            .toHaveTextContent('Unable to load the saved cost calculations.')
        expect(screen.queryByRole('button', { name: 'Save' }))
            .not.toBeInTheDocument()
    })
})

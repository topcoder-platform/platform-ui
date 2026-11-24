/* eslint-disable import/no-extraneous-dependencies, ordered-imports/ordered-imports */
import '@testing-library/jest-dom'

import { ChangeEvent } from 'react'

import {
    render,
    screen,
    waitFor,
    within,
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

import { fetchUsdToInrRate } from '../../services/exchange-rates.service'

import { AUTOSAVE_DELAY_MS, FlexiTalentCalculatorModal } from './FlexiTalentCalculatorModal'

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
    IconOutline: {
        ClipboardCopyIcon: (): JSX.Element => <svg />,
    },
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
        error?: string
        label: string
        name: string
        onBlur?: () => void
        onChange: (event: ChangeEvent<HTMLInputElement>) => void
        placeholder?: string
        readonly?: boolean
        value?: string
    }): JSX.Element => (
        <>
            <label>
                {props.label}
                <input
                    name={props.name}
                    placeholder={props.placeholder}
                    readOnly={props.readonly}
                    value={props.value}
                    onBlur={props.onBlur}
                    onChange={props.onChange}
                />
            </label>
            {props.error && <span>{props.error}</span>}
        </>
    ),
    Tooltip: (props: { children: JSX.Element }): JSX.Element => props.children,
}), { virtual: true })

jest.mock('../../services/engagement-leads.service', () => ({
    createEngagementLeadCalculation: jest.fn(),
    deleteEngagementLeadCalculation: jest.fn(),
    fetchEngagementLeadCalculations: jest.fn(),
    updateEngagementLeadCalculation: jest.fn(),
}))

jest.mock('../../services/exchange-rates.service', () => ({
    fetchUsdToInrRate: jest.fn(),
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

async function renderCalculator(calculatorLead: EngagementLead = lead): Promise<void> {
    render(<FlexiTalentCalculatorModal lead={calculatorLead} onClose={jest.fn()} />)
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
        jest.mocked(fetchUsdToInrRate)
            .mockReset()
            .mockResolvedValue({ date: '2026-11-24', rate: 92.73 })
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

    it('explains the commercial values in the Commercials section', async () => {
        await renderCalculator()

        const hint = screen.getByText('Enter any one commercial value; the others are calculated from it.')

        expect(hint.previousElementSibling)
            .toHaveTextContent('Commercials')
        expect(screen.getByText('Lead lead-1'))
            .toBeInTheDocument()
    })

    it('recalculates from the last edited commercial value', async () => {
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220000')

        expect(screen.getByLabelText('Member Cost (USD)'))
            .toHaveValue('104000')
        // Products: the member fee is the total member cost; the challenge fee is what is left.
        const products = screen.getByRole('heading', { name: 'Products' }).parentElement as HTMLElement
        expect(within(products)
            .getByText('Member Fee').nextElementSibling)
            .toHaveTextContent('USD 104,000')
        expect(within(products)
            .getByText('Challenge Fee').nextElementSibling)
            .toHaveTextContent('USD 116,000')
        expect(screen.queryByText(/Challenge fee:/))
            .not.toBeInTheDocument()
        expect(screen.queryByText(/Member Hourly Rate \(based on Actual Cost\)/))
            .not.toBeInTheDocument()
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

    it('lists the SMUs by code with their cost transfer %', async () => {
        await renderCalculator()

        expect(Array.from(
            (screen.getByLabelText('SMU') as HTMLSelectElement).options,
            option => option.textContent,
        ))
            .toEqual(expect.arrayContaining([
                'AMPE (74.90%)',
                'EURP (73.30%)',
                'AMR1 (73.10%)',
                'AMR2 (69.70%)',
                'Others (25.00%)',
            ]))
        expect(screen.queryByRole('option', { name: /Wipro-Internal/ }))
            .not.toBeInTheDocument()
    })

    it('calculates with the fixed 25% cost transfer for the Others SMU', async () => {
        const user = userEvent.setup()
        await renderCalculator({ ...lead, smu: 'Others' })

        expect(screen.getByLabelText('SMU'))
            .toHaveValue('Others')
        expect(screen.queryByLabelText('Cost Transfer %'))
            .not.toBeInTheDocument()

        await user.type(screen.getByLabelText('Booking Cost (USD)'), '40000')

        expect(screen.getByLabelText('Actual Cost (USD)'))
            .toHaveValue('10000')
    })

    it('shows the member monthly rate in INR with the exchange rate used', async () => {
        const user = userEvent.setup()
        await renderCalculator()

        // 50/hour, 8 hours a day for 52 weeks: USD 2,000 a week, so 2,000 * 52 / 12 a month.
        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')

        expect(await screen.findByText('(INR 803,660 at 1 USD = 92.73 INR)', { exact: false }))
            .toHaveAttribute('title', 'European Central Bank reference rate for 24-11-2026, via frankfurter.dev')
        expect(screen.getByText(/Member Monthly Rate: USD 8,666\.67/))
            .toBeInTheDocument()
    })

    it('shows the member monthly rate in USD only when the exchange rate cannot be loaded', async () => {
        jest.mocked(fetchUsdToInrRate)
            .mockRejectedValue(new Error('offline'))
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')

        expect(screen.getByText(/Member Monthly Rate: USD 8,666\.67/))
            .toBeInTheDocument()
        expect(screen.queryByText(/INR/))
            .not.toBeInTheDocument()
    })

    it('copies the cost proposal', async () => {
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Member Name'), 'Jane Doe')
        await user.type(screen.getByLabelText('Member Rate / Hour (USD)'), '50')
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220000')
        await user.click(screen.getByRole('button', { name: 'Copy cost proposal' }))

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

    it('only has a Close button in the footer', async () => {
        await renderCalculator()

        expect(screen.queryByRole('button', { name: 'Save' }))
            .not.toBeInTheDocument()
        expect(screen.queryByRole('button', { name: 'Copy Cost Proposal' }))
            .not.toBeInTheDocument()
        expect(screen.getByRole('button', { name: 'Close' }))
            .toBeInTheDocument()
    })

    it('does not save a calculation that was not edited', async () => {
        await renderCalculator()

        await new Promise(resolve => { setTimeout(resolve, AUTOSAVE_DELAY_MS + 100) })

        expect(createEngagementLeadCalculation)
            .not.toHaveBeenCalled()
    })

    it('autosaves once typing stops, creating the calculation only once', async () => {
        const user = userEvent.setup()
        await renderCalculator()

        // Typing in one field, without leaving it, saves only after the autosave delay.
        await user.type(screen.getByLabelText('Booking Cost (USD)'), '220,000')

        expect(createEngagementLeadCalculation)
            .not.toHaveBeenCalled()

        await waitFor(() => {
            expect(createEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', {
                    accountName: 'Acme',
                    commercialInputField: LeadCalculationCommercialInput.BOOKING_COST,
                    commercialInputValue: 220000,
                    durationWeeks: 52,
                    hoursPerDay: 8,
                    memberInputField: undefined,
                    memberInputValue: undefined,
                    memberName: undefined,
                    referral: false,
                    smu: 'EURP',
                })
        })
        expect(await screen.findByText('All changes saved'))
            .toBeInTheDocument()
        // The typed value stays as entered after saving.
        expect(screen.getByLabelText('Booking Cost (USD)'))
            .toHaveValue('220,000')

        await user.selectOptions(screen.getByLabelText('Referral'), 'yes')

        await waitFor(() => {
            expect(updateEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', 'calc-new', expect.objectContaining({ referral: true }))
        })
        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledTimes(1)
    })

    it('works as a general calculator without a lead', async () => {
        const user = userEvent.setup()
        render(<FlexiTalentCalculatorModal onClose={jest.fn()} />)
        await screen.findByLabelText('Member Name')

        expect(fetchEngagementLeadCalculations)
            .toHaveBeenCalledWith(undefined)
        expect(screen.getByText(/General calculation, not linked to a lead/))
            .toBeInTheDocument()
        // Nothing to prefill from apart from the usual working day.
        expect(screen.getByLabelText('Account Name'))
            .toHaveValue('')
        expect(screen.getByLabelText('Duration (Weeks)'))
            .toHaveValue('')
        expect(screen.getByLabelText('Hours per Day'))
            .toHaveValue('8')

        await user.type(screen.getByLabelText('Account Name'), 'Globex')
        await user.tab()

        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledWith(undefined, expect.objectContaining({ accountName: 'Globex' }))

        await user.click(screen.getByRole('button', { name: 'Delete Calculation' }))
        await user.click(screen.getByRole('button', { name: 'Delete' }))

        await waitFor(() => expect(deleteEngagementLeadCalculation)
            .toHaveBeenCalledWith(undefined, 'calc-new'))
    })

    it('saves straight away when a field loses focus', async () => {
        jest.mocked(fetchEngagementLeadCalculations)
            .mockResolvedValue([savedCalculation])
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Hours per Day'), '{Backspace}6')
        await user.tab()

        expect(updateEngagementLeadCalculation)
            .toHaveBeenCalledWith('lead-1', 'calc-1', expect.objectContaining({ hoursPerDay: 6 }))

        // Nothing is left for the autosave timer to save.
        await new Promise(resolve => { setTimeout(resolve, AUTOSAVE_DELAY_MS + 100) })
        expect(updateEngagementLeadCalculation)
            .toHaveBeenCalledTimes(1)
    })

    it('saves edits made while a save is running once it finishes', async () => {
        let finishCreate: (value: EngagementLeadCalculation) => void = () => undefined
        jest.mocked(createEngagementLeadCalculation)
            .mockReturnValue(new Promise(resolve => { finishCreate = resolve }))
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Member Name'), 'Jane')
        await user.tab()
        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledTimes(1)

        await user.type(screen.getByLabelText('Member Name'), ' Doe')
        await user.tab()
        expect(updateEngagementLeadCalculation)
            .not.toHaveBeenCalled()

        finishCreate({ ...savedCalculation, id: 'calc-new' })

        await waitFor(() => {
            expect(updateEngagementLeadCalculation)
                .toHaveBeenCalledWith('lead-1', 'calc-new', expect.objectContaining({ memberName: 'Jane Doe' }))
        })
        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledTimes(1)
    })

    it('shows when a calculation could not be saved', async () => {
        jest.mocked(createEngagementLeadCalculation)
            .mockRejectedValue(new Error('boom'))
        const user = userEvent.setup()
        await renderCalculator()

        await user.type(screen.getByLabelText('Member Name'), 'Jane')
        await user.tab()

        expect(await screen.findByText('Not saved. It will be retried on your next change.'))
            .toBeInTheDocument()
    })

    it('saves pending edits when the calculator is closed', async () => {
        const user = userEvent.setup()
        const view = render(<FlexiTalentCalculatorModal lead={lead} onClose={jest.fn()} />)
        await screen.findByLabelText('Member Name')

        await user.type(screen.getByLabelText('Member Name'), 'Jane')
        view.unmount()

        expect(createEngagementLeadCalculation)
            .toHaveBeenCalledWith('lead-1', expect.objectContaining({ memberName: 'Jane' }))
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

        await user.click(screen.getByRole('button', { name: 'Delete Calculation' }))
        expect(deleteEngagementLeadCalculation)
            .not.toHaveBeenCalled()
        expect(screen.getByText('Delete this calculation?'))
            .toBeInTheDocument()

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
        expect(screen.queryByRole('button', { name: 'Delete Calculation' }))
            .not.toBeInTheDocument()
    })
})

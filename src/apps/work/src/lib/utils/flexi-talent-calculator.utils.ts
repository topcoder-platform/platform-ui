/**
 * Calculations for the Flexi Talent cost and booking calculator.
 *
 * The calculator has two anchors:
 * - a member anchor (Member Rate / Hour or Member Cost), which fixes what the member is paid;
 * - a commercial anchor (TC Margin %, TC Margin Amount, Booking Cost, Booking Rate / Hour,
 *   Actual Cost or Actual Rate / Hour), which fixes what is charged.
 * Whichever field of each group was edited last is kept as typed and every other value is derived from it.
 */

export const WORKING_DAYS_PER_WEEK = 5
export const REFERRAL_FEE_RATE = 0.1
const WEEKS_PER_YEAR = 52
const MONTHS_PER_YEAR = 12

export interface FlexiTalentSmuOption {
    /** Code used in the cost proposal and on engagement leads. */
    code: string
    /** Share of the booking cost transferred to Topcoder, as a fraction. */
    costTransferRate: number
    label: string
}

export const FLEXI_TALENT_SMU_OPTIONS: ReadonlyArray<FlexiTalentSmuOption> = [
    { code: 'AMPE', costTransferRate: 0.749, label: 'APMEA' },
    { code: 'EURP', costTransferRate: 0.733, label: 'Europe' },
    { code: 'AMR1', costTransferRate: 0.731, label: 'Americas 1' },
    { code: 'AMR2', costTransferRate: 0.697, label: 'Americas 2' },
    { code: 'Wipro-Internal', costTransferRate: 0.75, label: 'Wipro-Internal' },
]

export type MemberInputField = 'memberCost' | 'memberRate'

export type CommercialInputField =
    | 'actualCost'
    | 'actualRate'
    | 'bookingCost'
    | 'bookingRate'
    | 'tcMarginAmount'
    | 'tcMarginPercent'

export interface CalculatorInput<TField extends string> {
    field: TField
    value?: number
}

export interface FlexiTalentCalculatorInputs {
    commercialInput?: CalculatorInput<CommercialInputField>
    durationWeeks?: number
    hoursPerDay?: number
    memberInput?: CalculatorInput<MemberInputField>
    referral: boolean
    smuCode?: string
}

export interface FlexiTalentCalculatorResult {
    actualCost?: number
    actualRate?: number
    bookingCost?: number
    bookingRate?: number
    /** Fraction, e.g. 0.733. */
    costTransferRate?: number
    memberCost?: number
    memberMonthlyRate?: number
    memberRate?: number
    memberWeeklyRate?: number
    referralFee?: number
    tcMarginAmount?: number
    /** Percentage, e.g. 25 for 25%. */
    tcMarginPercent?: number
    totalBillingHours?: number
    totalMemberCost?: number
    /** Booking cost not transferred to Topcoder. */
    wiproCostBenefit?: number
    /** Percentage, e.g. 26.7 for 26.70%. */
    wiproCostBenefitPercent?: number
}

function isPositive(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value) && value > 0
}

function isFiniteNumber(value: number | undefined): value is number {
    return value !== undefined && Number.isFinite(value)
}

function divide(numerator: number | undefined, denominator: number | undefined): number | undefined {
    if (!isFiniteNumber(numerator) || !isPositive(denominator)) {
        return undefined
    }

    return numerator / denominator
}

function multiply(left: number | undefined, right: number | undefined): number | undefined {
    if (!isFiniteNumber(left) || !isFiniteNumber(right)) {
        return undefined
    }

    return left * right
}

export function getSmuOption(smu: string | undefined): FlexiTalentSmuOption | undefined {
    const normalized = String(smu || '')
        .trim()
        .toLowerCase()

    if (!normalized) {
        return undefined
    }

    return FLEXI_TALENT_SMU_OPTIONS.find(option => (
        option.code.toLowerCase() === normalized || option.label.toLowerCase() === normalized
    ))
}

/**
 * Parses a user-typed number. Thousands separators are allowed; anything else that is not a number
 * yields `undefined`.
 */
export function parseCalculatorNumber(raw: string | undefined): number | undefined {
    const normalized = String(raw ?? '')
        .replace(/,/g, '')
        .trim()

    if (!normalized) {
        return undefined
    }

    const value = Number(normalized)

    return Number.isFinite(value) ? value : undefined
}

/**
 * Converts a free-text lead duration ("12 weeks", "6 months", "1 year") to weeks.
 * Returns `undefined` when it cannot be read, e.g. for "ongoing".
 */
export function parseDurationToWeeks(duration: string | undefined | null): number | undefined {
    const match = String(duration || '')
        .trim()
        .toLowerCase()
        .match(/^(\d+(?:\.\d+)?)\s*(w|wk|wks|week|weeks|m|mo|mos|month|months|y|yr|yrs|year|years)?\b/)

    if (!match) {
        return undefined
    }

    const amount = Number(match[1])
    const unit = match[2] || 'month'

    if (!isPositive(amount)) {
        return undefined
    }

    if (unit.startsWith('w')) {
        return amount
    }

    if (unit.startsWith('y')) {
        return amount * WEEKS_PER_YEAR
    }

    return Math.round((amount * WEEKS_PER_YEAR) / MONTHS_PER_YEAR)
}

function calculateActualCost(
    input: CalculatorInput<CommercialInputField> | undefined,
    totalMemberCost: number | undefined,
    totalBillingHours: number | undefined,
    costTransferRate: number | undefined,
): number | undefined {
    if (!input || !isFiniteNumber(input.value)) {
        return undefined
    }

    switch (input.field) {
        case 'tcMarginPercent': {
            const marginRate = input.value / 100

            return marginRate < 1 ? divide(totalMemberCost, 1 - marginRate) : undefined
        }

        case 'tcMarginAmount':
            return isFiniteNumber(totalMemberCost) ? totalMemberCost + input.value : undefined
        case 'bookingCost':
            return multiply(input.value, costTransferRate)
        case 'bookingRate':
            return multiply(multiply(input.value, totalBillingHours), costTransferRate)
        case 'actualCost':
            return input.value
        case 'actualRate':
            return multiply(input.value, totalBillingHours)
        default:
            return undefined
    }
}

/**
 * Derives every calculator value from the inputs. Values that cannot be derived yet (missing
 * inputs, zero hours, no SMU) are left `undefined`.
 */
export function calculateFlexiTalentCosts(
    inputs: FlexiTalentCalculatorInputs,
): FlexiTalentCalculatorResult {
    const costTransferRate = getSmuOption(inputs.smuCode)?.costTransferRate
    const totalBillingHours = isPositive(inputs.hoursPerDay) && isPositive(inputs.durationWeeks)
        ? inputs.hoursPerDay * WORKING_DAYS_PER_WEEK * inputs.durationWeeks
        : undefined

    const memberInput = inputs.memberInput
    let memberCost: number | undefined
    let memberRate: number | undefined

    if (memberInput?.field === 'memberCost') {
        memberCost = isFiniteNumber(memberInput.value) ? memberInput.value : undefined
        memberRate = divide(memberCost, totalBillingHours)
    } else if (memberInput?.field === 'memberRate') {
        memberRate = isFiniteNumber(memberInput.value) ? memberInput.value : undefined
        memberCost = multiply(memberRate, totalBillingHours)
    }

    const referralFee = isFiniteNumber(memberCost)
        ? (inputs.referral ? memberCost * REFERRAL_FEE_RATE : 0)
        : undefined
    const totalMemberCost = isFiniteNumber(memberCost) && isFiniteNumber(referralFee)
        ? memberCost + referralFee
        : undefined
    const memberWeeklyRate = divide(memberCost, inputs.durationWeeks)
    const memberMonthlyRate = divide(multiply(memberWeeklyRate, WEEKS_PER_YEAR), MONTHS_PER_YEAR)

    const actualCost = calculateActualCost(
        inputs.commercialInput,
        totalMemberCost,
        totalBillingHours,
        costTransferRate,
    )
    // An entered booking cost or rate gives the booking cost directly, even before an SMU is chosen.
    const bookingCost = inputs.commercialInput?.field === 'bookingCost'
        ? inputs.commercialInput.value
        : inputs.commercialInput?.field === 'bookingRate'
            ? multiply(inputs.commercialInput.value, totalBillingHours)
            : divide(actualCost, costTransferRate)
    const tcMarginAmount = isFiniteNumber(actualCost) && isFiniteNumber(totalMemberCost)
        ? actualCost - totalMemberCost
        : undefined
    const tcMarginPercent = inputs.commercialInput?.field === 'tcMarginPercent'
        ? inputs.commercialInput.value
        : multiply(divide(tcMarginAmount, actualCost), 100)
    const wiproCostBenefit = isFiniteNumber(bookingCost) && isFiniteNumber(actualCost)
        ? bookingCost - actualCost
        : undefined

    return {
        actualCost,
        actualRate: divide(actualCost, totalBillingHours),
        bookingCost,
        bookingRate: divide(bookingCost, totalBillingHours),
        costTransferRate,
        memberCost,
        memberMonthlyRate,
        memberRate,
        memberWeeklyRate,
        referralFee,
        tcMarginAmount,
        tcMarginPercent: isFiniteNumber(actualCost) ? tcMarginPercent : undefined,
        totalBillingHours,
        totalMemberCost,
        wiproCostBenefit,
        wiproCostBenefitPercent: isFiniteNumber(costTransferRate)
            ? (1 - costTransferRate) * 100
            : undefined,
    }
}

/** Formats an amount with thousands separators and at most two decimals, e.g. 58,740 or 1,234.5. */
export function formatCalculatorAmount(value: number | undefined): string {
    if (!isFiniteNumber(value)) {
        return '—'
    }

    return value.toLocaleString('en-US', {
        maximumFractionDigits: 2,
        minimumFractionDigits: 0,
    })
}

/** Formats a value for display inside an editable field: two decimals, no separators. */
export function formatCalculatorInputValue(value: number | undefined): string {
    if (!isFiniteNumber(value)) {
        return ''
    }

    return String(Math.round(value * 100) / 100)
}

export interface CostProposalDetails {
    accountName?: string
    durationWeeks?: number
    hoursPerDay?: number
    memberName?: string
    result: FlexiTalentCalculatorResult
    roleTitle?: string
    smuCode?: string
}

function orPlaceholder(value: string | number | undefined, placeholder: string): string {
    const text = String(value ?? '')
        .trim()

    return text || placeholder
}

/** Builds the customer-facing cost proposal text. Missing values are shown as `<placeholders>`. */
export function buildCostProposal(details: CostProposalDetails): string {
    const memberName = orPlaceholder(details.memberName, '<Member Name>')
    const accountName = orPlaceholder(details.accountName, '<Account Name>')
    const roleTitle = orPlaceholder(details.roleTitle, '<Role>')
    const duration = orPlaceholder(details.durationWeeks, '<Duration>')
    const hoursPerDay = orPlaceholder(details.hoursPerDay, '<Hours>')
    const smuCode = orPlaceholder(details.smuCode, '<SMU>')
    const benefitPercent = isFiniteNumber(details.result.wiproCostBenefitPercent)
        ? details.result.wiproCostBenefitPercent.toFixed(2)
        : '—'

    return [
        `Please find below the cost proposal for ${memberName}:`,
        `${memberName} will be supporting the ${accountName} for a duration of ${duration} weeks as ${roleTitle}`,
        `Duration: ${duration} weeks`,
        `Working Hours: ${hoursPerDay} hours/day and ${WORKING_DAYS_PER_WEEK} days/week`,
        `Total Booking Cost: USD ${formatCalculatorAmount(details.result.bookingCost)}`,
        `Wipro Cost Benefit: USD ${formatCalculatorAmount(details.result.wiproCostBenefit)}`
            + ` (${benefitPercent}% for ${smuCode} SMU)`,
        `Total Cost Transfer: USD ${formatCalculatorAmount(details.result.actualCost)}`,
    // A blank line between lines, as in the agreed proposal format.
    ].join('\n\n')
}

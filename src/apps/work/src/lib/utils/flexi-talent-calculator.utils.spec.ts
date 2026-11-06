import {
    buildCostProposal,
    calculateFlexiTalentCosts,
    FlexiTalentCalculatorInputs,
    getSmuOption,
    parseCalculatorNumber,
    parseDurationToWeeks,
} from './flexi-talent-calculator.utils'

// 8 h/day × 5 days × 10 weeks = 400 billing hours; member cost 400 × 50 = 20,000.
const baseInputs: FlexiTalentCalculatorInputs = {
    durationWeeks: 10,
    hoursPerDay: 8,
    memberInput: { field: 'memberRate', value: 50 },
    referral: false,
    smuCode: 'EURP',
}

describe('calculateFlexiTalentCosts', () => {
    it('derives the member costs', () => {
        const result = calculateFlexiTalentCosts({ ...baseInputs, referral: true })

        expect(result.totalBillingHours)
            .toBe(400)
        expect(result.memberCost)
            .toBe(20000)
        expect(result.referralFee)
            .toBe(2000)
        expect(result.totalMemberCost)
            .toBe(22000)
        expect(result.memberWeeklyRate)
            .toBe(2000)
        expect(result.memberMonthlyRate)
            .toBeCloseTo(8666.67, 2)
    })

    it('derives the member rate when the member cost is entered', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            memberInput: { field: 'memberCost', value: 30000 },
        })

        expect(result.memberRate)
            .toBe(75)
        expect(result.memberCost)
            .toBe(30000)
    })

    it('calculates from TC Margin %', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'tcMarginPercent', value: 20 },
        })

        expect(result.actualCost)
            .toBe(25000)
        expect(result.tcMarginAmount)
            .toBe(5000)
        expect(result.tcMarginPercent)
            .toBe(20)
        expect(result.bookingCost)
            .toBeCloseTo(25000 / 0.733, 6)
        expect(result.actualRate)
            .toBe(62.5)
    })

    it('calculates from TC Margin Amount', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'tcMarginAmount', value: 5000 },
        })

        expect(result.actualCost)
            .toBe(25000)
        expect(result.tcMarginPercent)
            .toBeCloseTo(20, 10)
    })

    it('calculates from Booking Cost', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'bookingCost', value: 220000 },
        })

        expect(result.bookingCost)
            .toBe(220000)
        expect(result.actualCost)
            .toBeCloseTo(161260, 6)
        expect(result.wiproCostBenefit)
            .toBeCloseTo(58740, 6)
        expect(result.wiproCostBenefitPercent)
            .toBeCloseTo(26.7, 10)
        expect(result.tcMarginAmount)
            .toBeCloseTo(141260, 6)
        expect(result.tcMarginPercent)
            .toBeCloseTo((141260 / 161260) * 100, 6)
    })

    it('calculates from Booking Rate / Hour', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'bookingRate', value: 100 },
        })

        expect(result.bookingCost)
            .toBe(40000)
        expect(result.actualCost)
            .toBeCloseTo(29320, 6)
    })

    it('calculates from Actual Cost', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'actualCost', value: 25000 },
        })

        expect(result.bookingCost)
            .toBeCloseTo(25000 / 0.733, 6)
        expect(result.tcMarginAmount)
            .toBe(5000)
        expect(result.tcMarginPercent)
            .toBe(20)
    })

    it('calculates from Actual Rate / Hour', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'actualRate', value: 62.5 },
        })

        expect(result.actualCost)
            .toBe(25000)
        expect(result.tcMarginPercent)
            .toBe(20)
    })

    it('includes the referral fee in the margin calculation', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'tcMarginPercent', value: 20 },
            referral: true,
        })

        expect(result.actualCost)
            .toBe(27500)
    })

    it('leaves the booking cost empty until an SMU is chosen', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'actualCost', value: 25000 },
            smuCode: '',
        })

        expect(result.actualCost)
            .toBe(25000)
        expect(result.bookingCost)
            .toBeUndefined()
    })

    it('does not divide by zero for a 100% margin or zero hours', () => {
        expect(calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'tcMarginPercent', value: 100 },
        }).actualCost)
            .toBeUndefined()
        expect(calculateFlexiTalentCosts({ ...baseInputs, hoursPerDay: 0 }).memberCost)
            .toBeUndefined()
    })
})

describe('parseDurationToWeeks', () => {
    it.each([
        ['12 weeks', 12],
        ['6 months', 26],
        ['12 months', 52],
        ['1 year', 52],
        ['3', 13],
        ['ongoing', undefined],
        ['', undefined],
    ])('parses "%s"', (input, expected) => {
        expect(parseDurationToWeeks(input))
            .toBe(expected)
    })
})

describe('parseCalculatorNumber', () => {
    it('accepts thousands separators and rejects text', () => {
        expect(parseCalculatorNumber('220,000.5'))
            .toBe(220000.5)
        expect(parseCalculatorNumber('abc'))
            .toBeUndefined()
        expect(parseCalculatorNumber(''))
            .toBeUndefined()
    })
})

describe('getSmuOption', () => {
    it('matches lead SMU codes and labels', () => {
        expect(getSmuOption('EURP')?.label)
            .toBe('Europe')
        expect(getSmuOption('americas 2')?.code)
            .toBe('AMR2')
        expect(getSmuOption('Others'))
            .toBeUndefined()
    })
})

describe('buildCostProposal', () => {
    it('formats the proposal', () => {
        const result = calculateFlexiTalentCosts({
            ...baseInputs,
            commercialInput: { field: 'bookingCost', value: 220000 },
            durationWeeks: 52,
        })

        expect(buildCostProposal({
            accountName: 'Acme',
            durationWeeks: 52,
            hoursPerDay: 8,
            memberName: 'Jane Doe',
            result,
            roleTitle: 'Java Developer',
            smuCode: 'EURP',
        }))
            .toBe([
                'Please find below the cost proposal for Jane Doe:',
                'Jane Doe will be supporting the Acme for a duration of 52 weeks as Java Developer',
                'Duration: 52 weeks',
                'Working Hours: 8 hours/day and 5 days/week',
                'Total Booking Cost: USD 220,000',
                'Wipro Cost Benefit: USD 58,740 (26.70% for EURP SMU)',
                'Total Cost Transfer: USD 161,260',
            ].join('\n'))
    })

    it('uses placeholders for missing details', () => {
        const proposal = buildCostProposal({ result: {} })

        expect(proposal)
            .toContain('Please find below the cost proposal for <Member Name>:')
        expect(proposal)
            .toContain('Total Booking Cost: USD —')
    })
})

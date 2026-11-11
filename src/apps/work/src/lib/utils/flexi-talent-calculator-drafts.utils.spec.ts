import { EngagementLead } from '../models/EngagementLead.model'
import {
    EngagementLeadCalculation,
    LeadCalculationCommercialInput,
    LeadCalculationMemberInput,
} from '../models/EngagementLeadCalculation.model'

import {
    CalculatorDraft,
    createDraftFromCalculation,
    createDraftFromLead,
    getDraftCalculatorInputs,
    getDraftLabel,
    getDraftSavePayload,
} from './flexi-talent-calculator-drafts.utils'

const lead = {
    accountName: 'Acme',
    engagementDuration: '6 months',
    id: 'lead-1',
    smu: 'AMR2',
    workingHoursPerDay: 6,
} as EngagementLead

const calculation: EngagementLeadCalculation = {
    accountName: 'Acme',
    commercialInputField: LeadCalculationCommercialInput.BOOKING_RATE,
    commercialInputValue: 75.5,
    createdAt: '2026-11-10T00:00:00.000Z',
    durationWeeks: 12,
    engagementLeadId: 'lead-1',
    hoursPerDay: 8,
    id: 'calc-1',
    memberInputField: LeadCalculationMemberInput.MEMBER_COST,
    memberInputValue: 20000,
    memberName: 'Jane Doe',
    referral: true,
    smu: 'EURP',
    updatedAt: '2026-11-10T00:00:00.000Z',
}

describe('createDraftFromLead', () => {
    it('prefills the account, SMU, hours and duration from the lead', () => {
        const draft = createDraftFromLead(lead)

        expect(draft)
            .toEqual(expect.objectContaining({
                accountName: 'Acme',
                dirty: false,
                durationWeeksRaw: '26',
                hoursPerDayRaw: '6',
                memberName: '',
                referral: false,
                smuCode: 'AMR2',
            }))
        expect(draft.id)
            .toBeUndefined()
    })

    it('gives every new draft its own key', () => {
        expect(createDraftFromLead(lead).key)
            .not.toBe(createDraftFromLead(lead).key)
    })

    it('leaves the SMU and duration empty when the lead has none the calculator knows', () => {
        const draft = createDraftFromLead({ ...lead, engagementDuration: 'ongoing', smu: 'Others' })

        expect(draft.smuCode)
            .toBe('')
        expect(draft.durationWeeksRaw)
            .toBe('')
    })
})

describe('createDraftFromCalculation', () => {
    it('reopens the saved values and which fields they were typed in', () => {
        expect(createDraftFromCalculation(calculation))
            .toEqual({
                accountName: 'Acme',
                commercialDraft: { field: 'bookingRate', raw: '75.5' },
                dirty: false,
                durationWeeksRaw: '12',
                hoursPerDayRaw: '8',
                id: 'calc-1',
                key: 'calc-1',
                memberDraft: { field: 'memberCost', raw: '20000' },
                memberName: 'Jane Doe',
                referral: true,
                smuCode: 'EURP',
            })
    })

    it('handles a calculation saved without commercial or member values', () => {
        const draft = createDraftFromCalculation({
            ...calculation,
            commercialInputField: undefined,
            commercialInputValue: undefined,
            memberInputField: undefined,
            memberInputValue: undefined,
            smu: undefined,
        })

        expect(draft.commercialDraft)
            .toBeUndefined()
        expect(draft.memberDraft)
            .toBeUndefined()
        expect(draft.smuCode)
            .toBe('')
    })
})

describe('getDraftSavePayload', () => {
    it('round-trips a saved calculation', () => {
        const draft = createDraftFromCalculation(calculation)

        expect(getDraftSavePayload(draft))
            .toEqual({
                accountName: 'Acme',
                commercialInputField: LeadCalculationCommercialInput.BOOKING_RATE,
                commercialInputValue: 75.5,
                durationWeeks: 12,
                hoursPerDay: 8,
                memberInputField: LeadCalculationMemberInput.MEMBER_COST,
                memberInputValue: 20000,
                memberName: 'Jane Doe',
                referral: true,
                smu: 'EURP',
            })
    })

    it('leaves out empty text and values that are not numbers', () => {
        const draft: CalculatorDraft = {
            ...createDraftFromLead(lead),
            accountName: '  ',
            commercialDraft: { field: 'tcMarginPercent', raw: 'abc' },
            durationWeeksRaw: '',
            memberDraft: { field: 'memberRate', raw: '' },
        }

        expect(getDraftSavePayload(draft))
            .toEqual(expect.objectContaining({
                accountName: undefined,
                commercialInputField: undefined,
                commercialInputValue: undefined,
                durationWeeks: undefined,
                memberInputField: undefined,
                memberInputValue: undefined,
                memberName: undefined,
            }))
    })

    it('rounds to the precision the API stores', () => {
        const draft: CalculatorDraft = {
            ...createDraftFromLead(lead),
            commercialDraft: { field: 'tcMarginPercent', raw: '26.123456' },
            hoursPerDayRaw: '7.555',
        }

        expect(getDraftSavePayload(draft))
            .toEqual(expect.objectContaining({
                commercialInputValue: 26.1235,
                hoursPerDay: 7.56,
            }))
    })
})

describe('getDraftCalculatorInputs', () => {
    it('parses the typed values for the calculation', () => {
        expect(getDraftCalculatorInputs(createDraftFromCalculation(calculation)))
            .toEqual({
                commercialInput: { field: 'bookingRate', value: 75.5 },
                durationWeeks: 12,
                hoursPerDay: 8,
                memberInput: { field: 'memberCost', value: 20000 },
                referral: true,
                smuCode: 'EURP',
            })
    })
})

describe('getDraftLabel', () => {
    it('uses the member name, or the position when there is none', () => {
        const draft = createDraftFromLead(lead)

        expect(getDraftLabel(draft, 1))
            .toBe('Calculation 2')
        expect(getDraftLabel({ ...draft, memberName: ' Jane ' }, 1))
            .toBe('Jane')
    })
})

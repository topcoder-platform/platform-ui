import { EngagementLead } from '../models/EngagementLead.model'
import {
    EngagementLeadCalculation,
    EngagementLeadCalculationInput,
    LeadCalculationCommercialInput,
    LeadCalculationMemberInput,
} from '../models/EngagementLeadCalculation.model'

import {
    CommercialInputField,
    FlexiTalentCalculatorInputs,
    getSmuOption,
    MemberInputField,
    parseCalculatorNumber,
    parseDurationToWeeks,
} from './flexi-talent-calculator.utils'

const DEFAULT_HOURS_PER_DAY = 8

/** A value the user typed, kept as typed so the field shows exactly what was entered. */
export interface DraftInput<TField extends string> {
    field: TField
    raw: string
}

/** One calculation as it is being edited in the calculator. */
export interface CalculatorDraft {
    accountName: string
    commercialDraft?: DraftInput<CommercialInputField>
    durationWeeksRaw: string
    hoursPerDayRaw: string
    /** Set once the calculation has been saved. */
    id?: string
    /** Identifies the draft in the UI, including before it has been saved. */
    key: string
    memberDraft?: DraftInput<MemberInputField>
    memberName: string
    referral: boolean
    /** Goes up on every edit. */
    revision: number
    /** Revision the saved calculation matches; behind `revision` while there are unsaved edits. */
    savedRevision: number
    smuCode: string
}

const MEMBER_FIELD_TO_API: Record<MemberInputField, LeadCalculationMemberInput> = {
    memberCost: LeadCalculationMemberInput.MEMBER_COST,
    memberRate: LeadCalculationMemberInput.MEMBER_RATE,
}

const COMMERCIAL_FIELD_TO_API: Record<CommercialInputField, LeadCalculationCommercialInput> = {
    actualCost: LeadCalculationCommercialInput.ACTUAL_COST,
    actualRate: LeadCalculationCommercialInput.ACTUAL_RATE,
    bookingCost: LeadCalculationCommercialInput.BOOKING_COST,
    bookingRate: LeadCalculationCommercialInput.BOOKING_RATE,
    tcMarginAmount: LeadCalculationCommercialInput.TC_MARGIN_AMOUNT,
    tcMarginPercent: LeadCalculationCommercialInput.TC_MARGIN_PERCENT,
}

function invert<TKey extends string, TValue extends string>(
    record: Record<TKey, TValue>,
): Record<TValue, TKey> {
    return Object.fromEntries(
        Object.entries(record)
            .map(([key, value]) => [value, key]),
    ) as Record<TValue, TKey>
}

const MEMBER_FIELD_FROM_API = invert(MEMBER_FIELD_TO_API)
const COMMERCIAL_FIELD_FROM_API = invert(COMMERCIAL_FIELD_TO_API)

let nextDraftKey = 0

function createDraftKey(): string {
    nextDraftKey += 1
    return `draft-${nextDraftKey}`
}

function numberToRaw(value: number | null | undefined): string {
    return typeof value === 'number' ? String(value) : ''
}

function toDraftInput<TField extends string>(
    field: TField | undefined,
    value: number | null | undefined,
): DraftInput<TField> | undefined {
    return field ? { field, raw: numberToRaw(value) } : undefined
}

/** A new, unsaved calculation prefilled from the lead: account, SMU, hours per day and duration. */
export function createDraftFromLead(lead: EngagementLead): CalculatorDraft {
    return {
        accountName: lead.accountName || '',
        durationWeeksRaw: numberToRaw(parseDurationToWeeks(lead.engagementDuration)),
        hoursPerDayRaw: String(lead.workingHoursPerDay || DEFAULT_HOURS_PER_DAY),
        key: createDraftKey(),
        memberName: '',
        referral: false,
        revision: 0,
        savedRevision: 0,
        smuCode: getSmuOption(lead.smu)?.code || '',
    }
}

/** Reopens a saved calculation with the values it was saved with. */
export function createDraftFromCalculation(calculation: EngagementLeadCalculation): CalculatorDraft {
    return {
        accountName: calculation.accountName || '',
        commercialDraft: toDraftInput(
            calculation.commercialInputField
                ? COMMERCIAL_FIELD_FROM_API[calculation.commercialInputField]
                : undefined,
            calculation.commercialInputValue,
        ),
        durationWeeksRaw: numberToRaw(calculation.durationWeeks),
        hoursPerDayRaw: numberToRaw(calculation.hoursPerDay),
        id: calculation.id,
        key: calculation.id,
        memberDraft: toDraftInput(
            calculation.memberInputField
                ? MEMBER_FIELD_FROM_API[calculation.memberInputField]
                : undefined,
            calculation.memberInputValue,
        ),
        memberName: calculation.memberName || '',
        referral: calculation.referral,
        revision: 0,
        savedRevision: 0,
        smuCode: calculation.smu || '',
    }
}

/** The calculator inputs a draft stands for. */
export function getDraftCalculatorInputs(draft: CalculatorDraft): FlexiTalentCalculatorInputs {
    return {
        commercialInput: draft.commercialDraft && {
            field: draft.commercialDraft.field,
            value: parseCalculatorNumber(draft.commercialDraft.raw),
        },
        durationWeeks: parseCalculatorNumber(draft.durationWeeksRaw),
        hoursPerDay: parseCalculatorNumber(draft.hoursPerDayRaw),
        memberInput: draft.memberDraft && {
            field: draft.memberDraft.field,
            value: parseCalculatorNumber(draft.memberDraft.raw),
        },
        referral: draft.referral,
        smuCode: draft.smuCode,
    }
}

function emptyToUndefined(value: string): string | undefined {
    return value.trim() || undefined
}

// Rounded to what the API stores (4 decimals for amounts, 2 for hours and weeks), which it enforces.
function round(value: number | undefined, decimals: number): number | undefined {
    if (value === undefined) {
        return undefined
    }

    const factor = 10 ** decimals
    return Math.round(value * factor) / factor
}

/**
 * What to send to the API to save a draft. Empty values are left out, which clears them. A value
 * that is not a number is left out along with the field it was typed in, so the calculation
 * reopens with nothing to calculate from.
 */
export function getDraftSavePayload(draft: CalculatorDraft): EngagementLeadCalculationInput {
    const memberValue = round(parseCalculatorNumber(draft.memberDraft?.raw), 4)
    const commercialValue = round(parseCalculatorNumber(draft.commercialDraft?.raw), 4)

    return {
        accountName: emptyToUndefined(draft.accountName),
        commercialInputField: draft.commercialDraft && commercialValue !== undefined
            ? COMMERCIAL_FIELD_TO_API[draft.commercialDraft.field]
            : undefined,
        commercialInputValue: commercialValue,
        durationWeeks: round(parseCalculatorNumber(draft.durationWeeksRaw), 2),
        hoursPerDay: round(parseCalculatorNumber(draft.hoursPerDayRaw), 2),
        memberInputField: draft.memberDraft && memberValue !== undefined
            ? MEMBER_FIELD_TO_API[draft.memberDraft.field]
            : undefined,
        memberInputValue: memberValue,
        memberName: emptyToUndefined(draft.memberName),
        referral: draft.referral,
        smu: emptyToUndefined(draft.smuCode),
    }
}

/** Whether the draft has edits that are not saved yet. */
export function hasUnsavedChanges(draft: CalculatorDraft): boolean {
    return draft.revision !== draft.savedRevision
}

/** Tab label: the member's name once entered, otherwise its position. */
export function getDraftLabel(draft: CalculatorDraft, index: number): string {
    return draft.memberName.trim() || `Calculation ${index + 1}`
}

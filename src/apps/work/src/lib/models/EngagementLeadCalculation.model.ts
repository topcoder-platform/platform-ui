/** Member value a saved cost calculation was worked out from. */
export enum LeadCalculationMemberInput {
    MEMBER_COST = 'MEMBER_COST',
    MEMBER_RATE = 'MEMBER_RATE',
}

/** Commercial value a saved cost calculation was worked out from. */
export enum LeadCalculationCommercialInput {
    ACTUAL_COST = 'ACTUAL_COST',
    ACTUAL_RATE = 'ACTUAL_RATE',
    BOOKING_COST = 'BOOKING_COST',
    BOOKING_RATE = 'BOOKING_RATE',
    TC_MARGIN_AMOUNT = 'TC_MARGIN_AMOUNT',
    TC_MARGIN_PERCENT = 'TC_MARGIN_PERCENT',
}

/**
 * What a Talent Manager entered in the cost calculator; every other value is recalculated from it.
 * Saving overwrites the calculation, and a field left out is cleared.
 */
export interface EngagementLeadCalculationInput {
    accountName?: string
    commercialInputField?: LeadCalculationCommercialInput
    commercialInputValue?: number
    durationWeeks?: number
    hoursPerDay?: number
    memberInputField?: LeadCalculationMemberInput
    memberInputValue?: number
    memberName?: string
    referral: boolean
    smu?: string
}

/** A saved calculation as the API returns it; values that were not entered come back as null. */
export interface EngagementLeadCalculation {
    accountName?: string | null
    commercialInputField?: LeadCalculationCommercialInput | null
    commercialInputValue?: number | null
    createdAt: string
    createdBy?: string | null
    durationWeeks?: number | null
    engagementLeadId: string
    hoursPerDay?: number | null
    id: string
    memberInputField?: LeadCalculationMemberInput | null
    memberInputValue?: number | null
    memberName?: string | null
    referral: boolean
    smu?: string | null
    updatedAt: string
    updatedBy?: string | null
}

import * as yup from 'yup'

import { SALESFORCE_OPPORTUNITY_ID_PATTERN } from '../constants/salesforce.constants'
import { LEGACY_SMU_VALUES, SMU_VALUES } from '../constants/showcase.constants'

/**
 * Checks a date-only value without converting its calendar day to a local timezone.
 * @param value Optional YYYY-MM-DD input from the project or showcase form.
 * @returns True for empty optional values or an existing calendar date.
 * @throws Does not throw.
 */
function isCalendarDate(value: string | undefined): boolean {
    if (!value) return true
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
    const date = new Date(`${value}T00:00:00.000Z`)
    return Number.isFinite(date.getTime()) && date.toISOString()
        .slice(0, 10) === value
}

/**
 * Builds shared project metadata validation for the project editor and showcase form.
 * @param required Whether Customer, SMU and Deal Close Date must be populated.
 * @returns Yup fields; Other SMU is always required when Others is selected.
 * @throws Does not throw; Yup reports invalid input when the form is validated.
 */
export function projectMetadataSchemaFields(required: boolean): {
    customer: yup.StringSchema<string | undefined>
    dealCloseDate: yup.StringSchema<string | undefined>
    salesforceOpportunityId: yup.StringSchema<string | undefined>
    smu: yup.StringSchema<string | undefined>
    smuOther: yup.StringSchema<string | undefined>
} {
    const text = yup.string()
        .trim()
        .max(255)
    // Projects saved before the Salesforce naming alignment still hold the legacy labels.
    const smu = yup.string()
        .oneOf([...SMU_VALUES, ...Object.keys(LEGACY_SMU_VALUES), ''])
    const date = yup.string()
        .test('calendar-date', 'Enter a valid deal close date', isCalendarDate)
    return {
        customer: required ? text.required('Customer is required') : text.optional(),
        dealCloseDate: required ? date.required('Deal Close Date is required') : date.optional(),
        salesforceOpportunityId: yup.string()
            .trim()
            .test(
                'salesforce-opportunity-id',
                'Enter a valid 15 or 18 character Salesforce Opportunity ID',
                value => !value || SALESFORCE_OPPORTUNITY_ID_PATTERN.test(value),
            )
            .optional(),
        smu: required ? smu.required('SMU is required') : smu.optional(),
        smuOther: text.when('smu', {
            is: 'Others',
            otherwise: schema => schema.optional(),
            then: schema => schema.required('Other SMU is required'),
        }),
    }
}

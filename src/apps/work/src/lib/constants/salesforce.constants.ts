/**
 * Salesforce opportunity record ids: the `006` key prefix followed by 12 or 15
 * case-sensitive alphanumeric characters.
 */
export const SALESFORCE_OPPORTUNITY_ID_PATTERN = /^006[a-zA-Z0-9]{12}(?:[a-zA-Z0-9]{3})?$/

/**
 * Checks whether a value can be sent to the opportunity lookup endpoint.
 * @param opportunityId Raw input from the project form.
 * @returns True for a 15 or 18 character Salesforce opportunity id.
 * @throws Does not throw.
 */
export function isSalesforceOpportunityId(opportunityId: string | undefined): boolean {
    return !!opportunityId && SALESFORCE_OPPORTUNITY_ID_PATTERN.test(opportunityId)
}

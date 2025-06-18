/**
 * Model for billing accounts filter form
 */
export interface FormBillingAccountsFilter {
    name?: string
    user?: string
    status?: string
    startDate?: Date | null
    endDate?: Date | null
}

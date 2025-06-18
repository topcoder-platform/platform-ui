/**
 * Model for editing billing account form
 */
export interface FormEditBillingAccount {
    name: string
    companyId: number
    startDate: Date
    endDate: Date
    status: string
    budgetAmount?: number
    poNumber: string
    subscriptionNumber?: number
    description: string
    paymentTerms?: number
    salesTax?: number
    client: {
        id: number
        name: string
    }
}

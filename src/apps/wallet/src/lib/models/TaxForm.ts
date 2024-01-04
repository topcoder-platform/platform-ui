export interface TaxForm {
    id: string
    userId: string
    dateFiled: string
    withholdingAmount: string
    withholdingPercentage: string
    taxForm: {
        name: string
        text: string
        description: string
    }
    status: string
}

export interface SetupTaxFormResponse {
    transactionId: string
    eSignLink: string
}

export interface Balance {
    amount: number
    type: string
    unit: string
}

export interface AccountDetails {
    balances: Balance[]
}

export interface WalletDetails {
    account: AccountDetails
    withdrawalMethod: {
        isSetupComplete: boolean
        type: 'paypal' | 'bank'
    }
    // TOOD: remove
    taxForm: {
        isSetupComplete: boolean
    }
    primaryCurrency?: string | null;
    estimatedFees?: string | null;
    taxWithholdingPercentage?: string | null;
}

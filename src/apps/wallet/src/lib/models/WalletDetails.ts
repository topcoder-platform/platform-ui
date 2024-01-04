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
    }
    taxForm: {
        isSetupComplete: boolean
    }
}

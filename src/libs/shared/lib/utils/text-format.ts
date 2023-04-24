export function textFormatDateLocaleShortString(date?: Date): string | undefined {
    return date?.toLocaleDateString(
        undefined,
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        },
    )
}

export function textFormatGetSafeString(param?: string): string {
    return param ?? ''
}

export function textFormatMoneyLocaleString(amount?: number): string | undefined {
    return amount?.toLocaleString('en-US', {
        currency: 'USD', // TODO: handle other currencies
        maximumFractionDigits: 0,
        style: 'currency',
    })
}

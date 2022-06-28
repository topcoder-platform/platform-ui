export function dateLocaleShortString(date?: Date): string | undefined {
    return date?.toLocaleDateString(undefined,
        {
            day: 'numeric',
            month: 'short',
            year: 'numeric',
        })
}

export function moneyLocaleString(amount?: number): string | undefined {
    return amount?.toLocaleString('en-US', {
        currency: 'USD', // TODO: handle other currencies
        maximumFractionDigits: 0,
        style: 'currency',
    })
}

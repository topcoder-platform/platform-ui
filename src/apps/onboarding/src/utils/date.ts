export const dateTimeToDate: (s: string) => Date | undefined = (s: string) => (s ? new Date(s) : undefined)

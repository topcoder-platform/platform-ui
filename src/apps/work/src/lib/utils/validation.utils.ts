export enum ValidationValueType {
    INTEGER = 'integer',
    NUMBER = 'number',
    STRING = 'string',
}

function normalizeCurrencyIntegerValue(value: string, prefixText: string = ''): string {
    const sanitizedValue = value
        .replace(prefixText, '')
        .replace(/\s+/g, '')
        .replace(/,/g, '')
        .replace(/[^0-9.]/g, '')
    const [integerPart] = sanitizedValue.split('.')

    return integerPart || ''
}

function validateInteger(value: string, prefixText: string = ''): string {
    const normalizedValue = value
        .replace(prefixText, '')
        .replace(' ', '')
        .replace(/[^0-9]/g, '')

    if (!normalizedValue.length) {
        return ''
    }

    return prefixText
        ? `${prefixText} ${normalizedValue}`
        : normalizedValue
}

function validateString(value: string): string {
    return /\S/.test(value)
        ? value
        : ''
}

export function validateValue(
    value: unknown,
    checkType: ValidationValueType | '' = '',
    prefix: string = '',
): unknown {
    switch (checkType) {
        case ValidationValueType.INTEGER:
            return validateInteger(String(value ?? ''), prefix)
        case ValidationValueType.STRING:
            return validateString(String(value ?? ''))
        case ValidationValueType.NUMBER:
            return Number.isFinite(Number(value))
                ? Number(value)
                : 0
        default:
            return value
    }
}

export function convertDollarToInteger(value: unknown, prefix: string = ''): number {
    if (value === null || value === undefined || value === '') {
        return 0
    }

    const parsed = parseInt(normalizeCurrencyIntegerValue(String(value), prefix), 10)

    return Number.isFinite(parsed)
        ? parsed
        : 0
}

export function parseNumber(value: unknown, fallback: number = 0): number {
    const parsed = Number(value)

    return Number.isFinite(parsed)
        ? parsed
        : fallback
}

export function formatNumber(value: unknown, maximumFractionDigits: number = 2): string {
    const parsed = Number(value)

    if (!Number.isFinite(parsed)) {
        return '0'
    }

    return new Intl.NumberFormat('en-US', {
        maximumFractionDigits,
    })
        .format(parsed)
}

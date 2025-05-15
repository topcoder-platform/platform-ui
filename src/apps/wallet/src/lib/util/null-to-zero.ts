/**
 * Converts a given value to the string `'0'` if it is `null`, `undefined`, or the string `'null'`.
 *
 * @param value - The input value which can be a string, `null`, or `undefined`.
 * @returns The original value if it is a valid string (and not `'null'`), otherwise returns `'0'`.
 */
export const nullToZero = (value: string | null | undefined): string => (value === 'null' ? '0' : value ?? '0')

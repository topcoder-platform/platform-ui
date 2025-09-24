/**
 * Util for string
 */

/**
 * Check if variable is string
 * @param str input variable
 * @returns true if the object is a string, false if otherwise
 */
export function isStringObject(str: any): boolean {
    if (typeof str === 'string' || str instanceof String) {
        return true
    }

    return false
}

/**
 * Check if string is number
 * @param str string to check
 * @returns if string is numberic
 */
export function checkIsStringNumeric(str: string): boolean {
    if (typeof str !== 'string') return false // we only process strings!
    return (
        !Number.isNaN(str as any)
        && !Number.isNaN(parseFloat(str)) // use type coercion to parse the
        // _entirety_ of the string (`parseFloat` alone does not do this)
        // and ensure strings of whitespace fail
    )
}

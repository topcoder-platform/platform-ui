/**
 * Util for string
 */

/**
 * Check if string is valid number or not
 * @param str string
 * @returns true or false
 */
export function stringIsNumberic(str?: string): boolean {
    if (typeof str !== 'string') return false // we only process strings!
    return (
        !Number.isNaN(str as any)
        // use type coercion to parse the _entirety_ of the string (`parseFloat` alone does not do this)...
        && !Number.isNaN(parseFloat(str))
    ) // ...and ensure strings of whitespace fail
}

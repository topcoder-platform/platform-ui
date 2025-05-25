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

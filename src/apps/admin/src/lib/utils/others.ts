/**
 * Util for other check
 */

/**
 * Check if object is date
 * @param date date object
 * @returns true if object is date
 */
export function checkIsDateObject(date: any): boolean {
    return Object.prototype.toString.call(date) === '[object Date]'
}

/**
 * Check if object is number
 * @param numberObject number object
 * @returns true if object is number
 */
export function checkIsNumberObject(numberObject: any): boolean {
    return typeof numberObject === 'number'
}

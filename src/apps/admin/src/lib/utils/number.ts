/**
 * Util for number
 */

import _ from 'lodash'

/**
 * Remove decimal in number
 * @param num number
 * @returns number
 */
function removeDecimal(num: number): string | undefined {
    // eslint-disable-next-line prefer-regex-literals
    const re = new RegExp('^-?\\d+')
    return num.toString()
        .match(re)?.[0]
}

/**
 * Fixed the input number
 * @param num number
 * @param decimal number of unit to fix
 * @returns number
 */
function toAcurateFixed(num: number, decimal: number): string | undefined {
    const re = new RegExp(`^-?\\d+(?:.\\d{0,${decimal}})?`)
    return num.toString()
        .match(re)?.[0]
}

/**
 * Fix the input number
 * @param num number
 * @param decimal number of unit to fix
 * @returns number
 */
export function toFixed(
    num: number | string | undefined,
    decimal: number,
): number | undefined {
    if (num === undefined) {
        return num
    }

    if (Number.isNaN(Number(num))) return num as number
    const numFloat = parseFloat(num as string)

    const result = _.toFinite(toAcurateFixed(numFloat, decimal))
    const integerResult = _.toFinite(removeDecimal(numFloat))

    if (_.isInteger(result)) {
        return integerResult
    }

    return result
}

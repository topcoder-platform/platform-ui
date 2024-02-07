import { get } from 'lodash'

/**
 * Get a numeric field value from an item based on the provided possible existing fields.
 *
 * @param {any} item - The item to retrieve the field value from.
 * @param {string[]} fields - An array of possible field names to retrieve value from.
 * @returns {number} The retrieved field value or 0 if not found.
 */
const getFieldValue = (item: any, fields: string[]): number => (
    fields
        .map(f => get(item, f))
        .filter(Boolean)[0] ?? 0
)

/**
 * Calculate the proportional average based on specified fields and total count.
 *
 * @param {any[]} items - An array of items to calculate the proportional average from.
 * @param {string[]} proportionalFields - Fields used to calculate the proportion.
 * @param {string[]} valueFields - Fields used to get values for the calculation.
 * @param {number} totalCount - The total count used for proportion calculation.
 * @returns {number} The calculated proportional average.
 */
export const calcProportionalAverage = (
    items: any[],
    proportionalFields: string[],
    valueFields: string[],
    totalCount: number,
): number => (
    items
        .filter(s => getFieldValue(s, proportionalFields) > 0 && getFieldValue(s, valueFields) > 0)
        .reduce((average, item) => {
            const proportion = (getFieldValue(item, proportionalFields) as number) / totalCount
            const proportionaItemlValue = getFieldValue(item, valueFields) * proportion

            return average + proportionaItemlValue
        }, 0)
)

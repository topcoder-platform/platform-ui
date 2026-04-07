import {
    PrizeSet,
} from '../../../../../lib/models'

type PrizeType = 'USD' | 'POINT'

/**
 * Updates an optional single-prize set used by the challenge editor billing fields.
 *
 * `CopilotFeeField` uses this helper to keep the optional copilot fee synchronized with
 * the form's `prizeSets` array. Clearing the input removes the matching optional prize set
 * instead of keeping a zero-value row that would fail validation.
 *
 * @param prizeSets Current `prizeSets` form value.
 * @param setType Prize set type to insert, replace, or remove.
 * @param prizeType Prize currency/type for the single stored prize.
 * @param value Next prize amount. Non-finite or non-positive values remove the matching set.
 * @returns Updated `prizeSets` array with the requested single-prize set change applied.
 * @throws Does not throw.
 */
export function updateOptionalSinglePrizeSet(
    prizeSets: PrizeSet[],
    setType: string,
    prizeType: PrizeType,
    value: number,
): PrizeSet[] {
    const setIndex = prizeSets.findIndex(prizeSet => prizeSet.type === setType)

    if (!Number.isFinite(value) || value <= 0) {
        return setIndex < 0
            ? prizeSets
            : prizeSets.filter((_, index) => index !== setIndex)
    }

    const nextPrizeSet: PrizeSet = {
        prizes: [
            {
                type: prizeType,
                value,
            },
        ],
        type: setType,
    }

    if (setIndex < 0) {
        return [
            ...prizeSets,
            nextPrizeSet,
        ]
    }

    return prizeSets.map((prizeSet, index) => (index === setIndex
        ? nextPrizeSet
        : prizeSet))
}

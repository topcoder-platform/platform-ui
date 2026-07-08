import {
    MAX_MANUAL_REVIEWER_COUNT,
    MAX_PRIZE_VALUE,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
} from '../constants/challenge-editor.constants'
import { PrizeSet } from '../models'

type PrizeType = 'USD' | 'POINT'

interface ReviewerInput {
    baseCoefficient?: unknown
    fixedAmount?: unknown
    incrementalCoefficient?: unknown
    isMemberReview?: boolean
    memberReviewerCount?: unknown
}

function toNumber(value: unknown): number {
    if (typeof value === 'number') {
        return Number.isFinite(value)
            ? value
            : 0
    }

    if (typeof value === 'string') {
        const parsed = Number(value)
        return Number.isFinite(parsed)
            ? parsed
            : 0
    }

    return 0
}

export function getPrizeType(prizeSets?: PrizeSet[]): PrizeType {
    if (!Array.isArray(prizeSets) || !prizeSets.length) {
        return PRIZE_TYPES.USD
    }

    const placementPrizeType = prizeSets
        .find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.PLACEMENT)
        ?.prizes?.[0]
        ?.type

    if (placementPrizeType === PRIZE_TYPES.POINT || placementPrizeType === PRIZE_TYPES.USD) {
        return placementPrizeType
    }

    const firstPrizeType = prizeSets
        .flatMap(prizeSet => prizeSet.prizes || [])
        .find(prize => prize.type === PRIZE_TYPES.POINT || prize.type === PRIZE_TYPES.USD)
        ?.type

    return firstPrizeType === PRIZE_TYPES.POINT
        ? PRIZE_TYPES.POINT
        : PRIZE_TYPES.USD
}

export function applyPrizeTypeToPrizeSets(
    prizeSets: PrizeSet[],
    prizeType: PrizeType,
): PrizeSet[] {
    if (!Array.isArray(prizeSets)) {
        return []
    }

    return prizeSets.map(prizeSet => ({
        ...prizeSet,
        prizes: (prizeSet.prizes || []).map(prize => ({
            ...prize,
            type: prizeType,
        })),
    }))
}

export function validatePrizeValue(value: string): string {
    const digitsOnly = value.replace(/[^\d]/g, '')

    if (!digitsOnly) {
        return ''
    }

    const parsedValue = Number.parseInt(digitsOnly, 10)
    if (Number.isNaN(parsedValue)) {
        return ''
    }

    return String(Math.min(parsedValue, MAX_PRIZE_VALUE))
}

export const DEFAULT_ESTIMATED_SUBMISSIONS_COUNT = 2

export function getFirstPlacePrizeValue(prizeSets?: PrizeSet[]): number {
    if (!Array.isArray(prizeSets)) {
        return 0
    }

    const placementPrizeSet = prizeSets
        .find(prizeSet => prizeSet.type === PRIZE_SET_TYPES.PLACEMENT)

    return toNumber(placementPrizeSet?.prizes?.[0]?.value)
}

function getReviewerCount(reviewer?: ReviewerInput): number {
    return Math.min(
        MAX_MANUAL_REVIEWER_COUNT,
        Math.max(1, Math.trunc(toNumber(reviewer?.memberReviewerCount) || 1)),
    )
}

export function calculateEstimatedReviewerCost(
    firstPlacePrizeValue: unknown,
    reviewers?: ReviewerInput[],
    estimatedSubmissionsCount: number = DEFAULT_ESTIMATED_SUBMISSIONS_COUNT,
): number {
    const normalizedFirstPlacePrize = toNumber(firstPlacePrizeValue)
    const normalizedEstimatedSubmissionsCount = Math.max(0, toNumber(estimatedSubmissionsCount))

    return (reviewers || [])
        .reduce((sum, reviewer) => {
            if (reviewer?.isMemberReview === false) {
                return sum
            }

            const fixedAmount = toNumber(reviewer?.fixedAmount)
            const baseCoefficient = toNumber(reviewer?.baseCoefficient)
            const incrementalCoefficient = toNumber(reviewer?.incrementalCoefficient)
            const reviewerCount = getReviewerCount(reviewer)
            const reviewerCost = fixedAmount + (
                baseCoefficient + (incrementalCoefficient * normalizedEstimatedSubmissionsCount)
            ) * normalizedFirstPlacePrize

            return sum + reviewerCost * reviewerCount
        }, 0)
}

/**
 * Calculates the billable challenge subtotal before billing markup is applied.
 *
 * The subtotal includes configured prize payouts plus the estimated reviewer
 * cost shown in the billing summary. Point-based placement prizes are excluded
 * from the USD subtotal so only billable dollar amounts remain.
 *
 * @param prizeSets prize sets currently configured on the challenge form.
 * @param reviewers reviewer rows currently configured on the challenge form.
 * @returns billable subtotal before the derived challenge fee.
 */
export function calculateChallengeTotal(
    prizeSets?: PrizeSet[],
    reviewers?: ReviewerInput[],
): number {
    const prizeType = getPrizeType(prizeSets)
    const prizeSetsForTotal = prizeType === PRIZE_TYPES.POINT
        ? (prizeSets || []).filter(prizeSet => prizeSet.type === PRIZE_SET_TYPES.COPILOT)
        : (prizeSets || [])
    const prizesTotal = prizeSetsForTotal
        .reduce((sum, prizeSet) => sum + (prizeSet.prizes || [])
            .reduce((acc, prize) => acc + toNumber(prize.value), 0), 0)
    const firstPlacePrizeValue = prizeType === PRIZE_TYPES.POINT
        ? 0
        : getFirstPlacePrizeValue(prizeSets)
    const reviewerTotal = prizeType === PRIZE_TYPES.POINT
        ? 0
        : calculateEstimatedReviewerCost(firstPlacePrizeValue, reviewers)

    return prizesTotal + reviewerTotal
}

/**
 * Normalizes billing markup into a decimal multiplier.
 *
 * Stored markup is the direct multiplier used by challenge billing and
 * billing-account ledger math. Values greater than `1` are valid and must not
 * be converted to percentage form. Missing or invalid inputs return
 * `undefined`.
 *
 * @param billingMarkup raw billing markup from challenge billing data.
 * @returns normalized decimal markup, or `undefined` when unavailable.
 */
function normalizeBillingMarkup(billingMarkup: unknown): number | undefined {
    if (typeof billingMarkup === 'number') {
        if (!Number.isFinite(billingMarkup)) {
            return undefined
        }

        return billingMarkup
    }

    if (typeof billingMarkup !== 'string') {
        return undefined
    }

    const trimmedMarkup = billingMarkup.trim()
    if (!trimmedMarkup) {
        return undefined
    }

    const normalizedMarkup = Number(trimmedMarkup)
    if (!Number.isFinite(normalizedMarkup)) {
        return undefined
    }

    return normalizedMarkup
}

/**
 * Calculates the derived challenge fee for the current billable subtotal.
 *
 * @param challengeTotal billable subtotal before markup is applied.
 * @param billingMarkup raw billing markup from challenge billing data.
 * @returns calculated challenge fee, or `undefined` when markup is unavailable.
 */
export function calculateChallengeFee(
    challengeTotal: number,
    billingMarkup: unknown,
): number | undefined {
    const normalizedMarkup = normalizeBillingMarkup(billingMarkup)

    if (normalizedMarkup === undefined) {
        return undefined
    }

    return challengeTotal * normalizedMarkup
}

/**
 * Formats a dollar amount with a fixed two-decimal display.
 *
 * @param value raw amount to format.
 * @returns formatted USD string such as `$481.80`.
 */
export function formatUsdCurrency(value: unknown): string {
    return `$${toNumber(value)
        .toLocaleString(undefined, {
            maximumFractionDigits: 2,
            minimumFractionDigits: 2,
        })}`
}

export function formatCurrency(
    value: number,
    prizeType: PrizeType,
): string {
    const safeValue = Number.isFinite(value)
        ? value
        : 0

    if (prizeType === PRIZE_TYPES.POINT) {
        return `${Math.round(safeValue)
            .toLocaleString()} Pts`
    }

    return `$${Math.round(safeValue)
        .toLocaleString()}`
}

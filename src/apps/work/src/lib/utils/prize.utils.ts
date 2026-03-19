import {
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
    return Math.max(1, Math.trunc(toNumber(reviewer?.memberReviewerCount) || 1))
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

export function calculateChallengeTotal(
    prizeSets?: PrizeSet[],
    reviewers?: ReviewerInput[],
): number {
    const prizesTotal = (prizeSets || [])
        .reduce((sum, prizeSet) => sum + (prizeSet.prizes || [])
            .reduce((acc, prize) => acc + toNumber(prize.value), 0), 0)

    const reviewerTotal = (reviewers || [])
        .reduce((sum, reviewer) => {
            if (reviewer?.isMemberReview === false) {
                return sum
            }

            const baseCoefficient = toNumber(reviewer?.baseCoefficient)
            const incrementalCoefficient = toNumber(reviewer?.incrementalCoefficient)
            const reviewerCount = Math.max(Math.trunc(toNumber(reviewer?.memberReviewerCount)), 0)

            if (reviewerCount <= 0) {
                return sum + baseCoefficient
            }

            return sum + baseCoefficient + incrementalCoefficient * Math.max(reviewerCount - 1, 0)
        }, 0)

    return prizesTotal + reviewerTotal
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

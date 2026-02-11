import {
    MAX_PRIZE_VALUE,
    PRIZE_SET_TYPES,
    PRIZE_TYPES,
} from '../constants/challenge-editor.constants'
import { PrizeSet } from '../models'

type PrizeType = 'USD' | 'POINT'

interface ReviewerInput {
    baseCoefficient?: number
    incrementalCoefficient?: number
    isMemberReview?: boolean
    memberReviewerCount?: number
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

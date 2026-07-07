import {
    FC,
    MouseEvent,
    useCallback,
    useMemo,
    useState,
} from 'react'
import useSWR from 'swr'

import {
    Button,
    IconOutline,
    IconSolid,
} from '~/libs/ui'

import { rootRoute } from '../../../config/routes.config'
import { useFetchEngagements } from '../../hooks/useFetchEngagements'
import type {
    AssignmentPayment,
    Challenge,
    Engagement,
} from '../../models'
import {
    BillingAccountDetails,
    BillingAccountLineItem,
    combineBillingAccountLineItems,
} from '../../services/billing-accounts.service'
import { fetchChallenge } from '../../services/challenges.service'
import { fetchAssignmentPaymentSplits } from '../../services/payments.service'
import {
    calculatePaymentChallengeFee,
    getPaymentAmount,
    getPaymentChallengeFee,
} from '../../utils/payment.utils'
import {
    calculateMemberPaymentAmount,
    getCopilotMemberPaymentsBudgetInfo,
} from '../../utils/project-billing-account.utils'

import styles from './BillingAccountLineItemsModal.module.scss'

type SortField = 'amount' | 'status' | 'date'
type SortOrder = 'asc' | 'desc'
type ChallengeDetailsById = Map<string, Challenge>
type AssignmentPaymentsById = Map<string, AssignmentPayment[]>

interface BillingAccountModalLineItem extends BillingAccountLineItem {
    challengeFeeAmount?: number
    displayAmount?: number
}

interface EngagementPaymentSplit {
    challengeFee?: number
    paymentAmount: number
}

interface EngagementPaymentSplitMatch {
    payment: AssignmentPayment
    split: EngagementPaymentSplit
}

interface EngagementPaymentSplitMatchResult {
    matchCount: number
    split?: EngagementPaymentSplit
}

const ENGAGEMENT_ASSIGNMENT_FILTERS = {
    includePrivate: true,
}

const EMPTY_CHALLENGE_DETAILS_BY_ID: ChallengeDetailsById = new Map<string, Challenge>()
const EMPTY_ASSIGNMENT_PAYMENTS_BY_ID: AssignmentPaymentsById = new Map<string, AssignmentPayment[]>()
const CURRENCY_AMOUNT_TOLERANCE = 0.01

const EXTERNAL_TYPE_LABELS: Record<BillingAccountLineItem['externalType'], string> = {
    CHALLENGE: 'Challenge',
    ENGAGEMENT: 'Engagement',
}

export interface BillingAccountLineItemsModalProps {
    billingAccountDetails: BillingAccountDetails
    onClose: () => void
    projectId?: number | string
    showMemberPaymentsRemaining?: boolean
}

function formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-US', {
        currency: 'USD',
        maximumFractionDigits: 2,
        minimumFractionDigits: 2,
        style: 'currency',
    })
        .format(amount)
}

function formatDate(dateString: string): string {
    const isoDateMatch = dateString.match(/^(\d{4}-\d{2}-\d{2})/)

    if (isoDateMatch) {
        return isoDateMatch[1]
    }

    const date = new Date(dateString)
    const year = date.getUTCFullYear()
    const month = String(date.getUTCMonth() + 1)
        .padStart(2, '0')
    const day = String(date.getUTCDate())
        .padStart(2, '0')
    return `${year}-${month}-${day}`
}

/**
 * Normalizes timestamp-like values to a UTC date key.
 *
 * @param value Raw timestamp or date value from billing-account or finance data.
 * @returns `YYYY-MM-DD` date key, or `undefined` when the value is blank or invalid.
 * @remarks Used only to disambiguate repeated engagement payments with the
 * same ledger amount.
 */
function getDateKey(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = value instanceof Date
        ? value
        : String(value)
            .trim()

    if (!normalizedValue) {
        return undefined
    }

    const isoDateMatch = String(normalizedValue)
        .match(/^(\d{4}-\d{2}-\d{2})/)

    if (isoDateMatch) {
        return isoDateMatch[1]
    }

    const date = new Date(normalizedValue)

    if (Number.isNaN(date.getTime())) {
        return undefined
    }

    return date.toISOString()
        .slice(0, 10)
}

/**
 * Collects date keys carried by a finance payment.
 *
 * @param payment Finance payment row.
 * @returns Unique date keys from payment-level and detail-level timestamps.
 * @remarks Finance responses have varied over time, so both top-level and
 * detail-level date fields are considered when matching billing-account rows.
 */
function getPaymentDateKeys(payment: AssignmentPayment): string[] {
    return Array.from(new Set([
        getDateKey(payment.createdAt),
        getDateKey(payment.updatedAt),
        getDateKey(payment.datePaid),
        getDateKey(payment.releaseDate),
        ...(payment.details || []).flatMap(detail => [
            getDateKey(detail.datePaid),
            getDateKey(detail.releaseDate),
        ]),
    ].filter((dateKey): dateKey is string => !!dateKey)))
}

/**
 * Checks whether a finance payment date matches a billing-account line item.
 *
 * @param payment Finance payment row.
 * @param item Billing-account line item being reconciled.
 * @returns `true` when both records carry the same UTC date.
 */
function paymentDateMatchesLineItem(
    payment: AssignmentPayment,
    item: BillingAccountLineItem,
): boolean {
    const lineItemDateKey = getDateKey(item.date)

    return !!lineItemDateKey && getPaymentDateKeys(payment)
        .includes(lineItemDateKey)
}

/**
 * Resolves the amount used when sorting modal line items.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Display amount, or zero when a copilot-safe amount cannot be calculated.
 * @remarks Used only by the billing-account details modal amount sort.
 */
function getSortableAmount(item: BillingAccountModalLineItem): number {
    return item.displayAmount ?? 0
}

function compareByAmount(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    return getSortableAmount(a) - getSortableAmount(b)
}

function compareByStatus(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    return a.status.localeCompare(b.status)
}

function compareByDate(a: BillingAccountModalLineItem, b: BillingAccountModalLineItem): number {
    const dateA = new Date(a.date)
    const dateB = new Date(b.date)
    return dateA.getTime() - dateB.getTime()
}

function sortLineItems(
    items: BillingAccountModalLineItem[],
    sortBy: SortField,
    sortOrder: SortOrder,
): BillingAccountModalLineItem[] {
    return [...items].sort((a, b) => {
        let comparison = 0

        switch (sortBy) {
            case 'amount':
                comparison = compareByAmount(a, b)
                break
            case 'status':
                comparison = compareByStatus(a, b)
                break
            case 'date':
                comparison = compareByDate(a, b)
                break
            default:
                comparison = 0
        }

        return sortOrder === 'asc' ? comparison : -comparison
    })
}

/**
 * Normalizes optional route identifiers before using them in work-app links.
 *
 * @param value Raw route identifier from project or billing-account row data.
 * @returns Trimmed string id, or `undefined` when the value is blank.
 * @remarks Used only by billing-account line-item links to avoid invalid route segments.
 */
function normalizeRouteId(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

/**
 * Rounds payment split values to cents for display and row matching.
 *
 * @param amount Raw amount from billing or finance data.
 * @returns Currency amount rounded to two decimal places.
 * @remarks Billing-account rows are stored at ledger precision, while the
 * modal displays cents and only needs cent-level comparisons.
 */
function roundCurrencyAmount(amount: number): number {
    return Number(amount.toFixed(2))
}

/**
 * Compares two currency amounts at display precision.
 *
 * @param firstAmount First amount to compare.
 * @param secondAmount Second amount to compare.
 * @returns `true` when the amounts match within one cent.
 */
function currencyAmountsMatch(firstAmount: number, secondAmount: number): boolean {
    return Math.abs(roundCurrencyAmount(firstAmount) - roundCurrencyAmount(secondAmount))
        <= CURRENCY_AMOUNT_TOLERANCE
}

/**
 * Resolves billing-account ids carried by one finance payment.
 *
 * @param payment Finance payment row.
 * @returns Unique billing-account ids from top-level and detail fields.
 */
function getPaymentBillingAccountIds(payment: AssignmentPayment): string[] {
    return Array.from(new Set([
        normalizeRouteId(payment.billingAccountId),
        ...(payment.details || []).map(detail => normalizeRouteId(detail.billingAccount)),
    ].filter((billingAccountId): billingAccountId is string => !!billingAccountId)))
}

/**
 * Filters assignment payments to the billing account currently being displayed.
 *
 * @param payments Payments returned for one engagement assignment.
 * @param billingAccountId Billing account id from the detail modal.
 * @returns Payments with a matching billing-account id, or all payments when
 * finance did not expose any billing-account id fields.
 */
function filterPaymentsForBillingAccount(
    payments: AssignmentPayment[],
    billingAccountId: unknown,
): AssignmentPayment[] {
    const normalizedBillingAccountId = normalizeRouteId(billingAccountId)

    if (!normalizedBillingAccountId) {
        return payments
    }

    const paymentsWithBillingAccount = payments.filter(payment => (
        getPaymentBillingAccountIds(payment).length > 0
    ))

    if (paymentsWithBillingAccount.length === 0) {
        return payments
    }

    return paymentsWithBillingAccount.filter(payment => (
        getPaymentBillingAccountIds(payment)
            .includes(normalizedBillingAccountId)
    ))
}

/**
 * Converts a finance payment into the member-payment and fee values used by the modal.
 *
 * @param payment Finance payment row.
 * @returns Payment split when a member-payment amount is available.
 */
function getFinancePaymentSplit(payment: AssignmentPayment): EngagementPaymentSplit | undefined {
    const paymentAmount = getPaymentAmount(payment)

    if (paymentAmount === undefined) {
        return undefined
    }

    const challengeFee = getPaymentChallengeFee(payment)
    const paymentDate = getFinancePaymentDate(payment)

    return {
        challengeFee: challengeFee === undefined
            ? undefined
            : roundCurrencyAmount(challengeFee),
        ...(paymentDate ? { date: paymentDate } : {}),
        paymentAmount: roundCurrencyAmount(paymentAmount),
    }
}

/**
 * Converts a finance payment into a candidate billing-account row match.
 *
 * @param payment Finance payment row.
 * @returns Payment and split pair when the finance amount can be read.
 */
function getFinancePaymentSplitMatch(
    payment: AssignmentPayment,
): EngagementPaymentSplitMatch | undefined {
    const split = getFinancePaymentSplit(payment)

    return split
        ? {
            payment,
            split,
        }
        : undefined
}

/**
 * Resolves the finance payment date used to match one billing ledger row.
 *
 * @param payment Finance payment row.
 * @returns UTC date string at day precision, or `undefined` when no payment date is available.
 * @remarks Engagement assignments can have repeated payments with the same
 * amount. Matching by date lets the modal use the persisted payment amount for
 * the specific consumed row instead of falling back to current billing markup.
 */
function getFinancePaymentDate(payment: AssignmentPayment): string | undefined {
    const paymentDate = normalizeRouteId(payment.createdAt)
        || normalizeRouteId(payment.updatedAt)

    return paymentDate
        ? formatDate(paymentDate)
        : undefined
}

/**
 * Adds finance payment splits together for aggregate billing-account rows.
 *
 * @param splits Payment splits from finance for one assignment.
 * @returns Aggregate split, or `undefined` when no split exists.
 */
function getAggregatePaymentSplit(
    splits: EngagementPaymentSplit[],
): EngagementPaymentSplit | undefined {
    if (splits.length === 0) {
        return undefined
    }

    return {
        challengeFee: splits.some(split => split.challengeFee === undefined)
            ? undefined
            : roundCurrencyAmount(splits.reduce(
                (total, split) => total + (split.challengeFee || 0),
                0,
            )),
        paymentAmount: roundCurrencyAmount(splits.reduce(
            (total, split) => total + split.paymentAmount,
            0,
        )),
    }
}

/**
 * Resolves a single finance split that exactly matches a billing-account row.
 *
 * @param item Billing-account engagement row.
 * @param matches Finance payment candidates for the row assignment.
 * @returns Matching split plus the number of amount matches considered.
 * @remarks Date matching disambiguates repeated assignment payments that have
 * the same amount but represent different consumed ledger rows.
 */
function getLineItemMatchingPaymentSplit(
    item: BillingAccountLineItem,
    matches: EngagementPaymentSplitMatch[],
): EngagementPaymentSplitMatchResult {
    const amountMatches = matches.filter(match => (
        match.split.challengeFee !== undefined
        && currencyAmountsMatch(
            match.split.paymentAmount + match.split.challengeFee,
            item.amount,
        )
    ))
    const dateMatches = amountMatches.filter(match => (
        paymentDateMatchesLineItem(match.payment, item)
    ))
    const selectedMatches = dateMatches.length > 0
        ? dateMatches
        : amountMatches

    return {
        matchCount: amountMatches.length,
        split: selectedMatches.length === 1
            ? selectedMatches[0].split
            : undefined,
    }
}

/**
 * Builds an absolute work-app path with the configured root route prefix.
 *
 * @param path Path below the work-app root. It must start with `/`.
 * @returns Work-app URL path safe for direct anchors.
 * @remarks The work app runs at `/work` on non-work subdomains and `/` on the
 * work subdomain.
 */
function buildWorkUrl(path: string): string {
    const basePath = rootRoute.replace(/\/$/, '')
    return `${basePath}${path}`
}

/**
 * Builds the work-app challenge detail URL for a billing-account row.
 *
 * @param externalId Challenge id from the billing-account line item.
 * @returns Work-app challenge URL path.
 * @remarks Used by the billing-account details modal name column.
 */
function buildChallengeUrl(externalId: string): string {
    return buildWorkUrl(`/challenges/${encodeURIComponent(externalId)}`)
}

/**
 * Builds the work-app engagement editor URL for a billing-account row.
 *
 * @param projectId Project id that scopes the engagement route.
 * @param engagementId Engagement id resolved from the line item assignment id.
 * @returns Work-app engagement URL path.
 * @remarks Engagement budget entries are keyed by assignment id, so callers
 * resolve the engagement id before using this helper.
 */
function buildEngagementUrl(projectId: string, engagementId: string): string {
    return buildWorkUrl(
        `/projects/${encodeURIComponent(projectId)}/engagements/${encodeURIComponent(engagementId)}`,
    )
}

/**
 * Formats the role-specific line-item amount for the Member Payments column.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Formatted currency or `-` when a copilot-safe amount is unavailable.
 * @remarks Copilot rows use member payment amounts without exposing markup.
 * Manager/admin rows derive the payment amount from the billing ledger total
 * when markup is available.
 */
function formatLineItemAmount(item: BillingAccountModalLineItem): string {
    return item.displayAmount === undefined
        ? '-'
        : formatCurrency(item.displayAmount)
}

/**
 * Formats the line-item challenge fee for the manager/admin fee column.
 *
 * @param item Line item already mapped for the current caller role.
 * @returns Formatted currency, or `-` when the fee cannot be calculated.
 * @remarks Copilot rows do not receive fee values because markup is hidden for
 * that role.
 */
function formatLineItemChallengeFee(item: BillingAccountModalLineItem): string {
    return item.challengeFeeAmount === undefined
        ? '-'
        : formatCurrency(item.challengeFeeAmount)
}

/**
 * Collects challenge ids from billing-account line items that can be hydrated from challenge-api.
 *
 * @param items Normalized billing-account line items.
 * @returns Unique challenge ids from canonical external ids.
 * @remarks Legacy-only challenge rows do not expose a canonical external id,
 * so they are intentionally excluded from challenge billing hydration.
 */
function getChallengeLineItemIds(items: BillingAccountLineItem[]): string[] {
    return Array.from(new Set(
        items
            .filter(item => item.externalType === 'CHALLENGE')
            .map(item => normalizeRouteId(item.externalId))
            .filter((id): id is string => !!id),
    ))
}

/**
 * Collects consumed engagement assignment ids that may need finance split hydration.
 *
 * @param items Normalized billing-account line items.
 * @returns Unique assignment ids from engagement consumed rows.
 * @remarks Locked engagement rows do not correspond to completed finance
 * payments. Consumed rows always hydrate from finance so exact payment splits
 * can override stale or markup-derived billing-account aliases.
 */
function getEngagementPaymentAssignmentIds(items: BillingAccountLineItem[]): string[] {
    return Array.from(new Set(
        items
            .filter(item => (
                item.externalType === 'ENGAGEMENT'
                && item.status === 'consumed'
            ))
            .map(item => normalizeRouteId(item.externalId))
            .filter((id): id is string => !!id),
    ))
}

/**
 * Fetches challenge details for billing-account rows without failing the whole modal.
 *
 * @param challengeIds Challenge ids referenced by billing-account line items.
 * @returns A map of successfully loaded challenges keyed by id.
 * @remarks A missing challenge leaves that row without hydrated billing markup
 * rather than blocking the rest of the billing-account details modal.
 */
async function fetchChallengeDetailsById(
    challengeIds: string[],
): Promise<ChallengeDetailsById> {
    const entries = await Promise.all(challengeIds.map(async challengeId => {
        try {
            const challenge = await fetchChallenge(challengeId)

            return [challengeId, challenge] as const
        } catch {
            return undefined
        }
    }))

    return new Map(
        entries.filter((entry): entry is readonly [string, Challenge] => !!entry),
    )
}

/**
 * Fetches raw finance payments for engagement assignment ids.
 *
 * @param assignmentIds Engagement assignment ids referenced by consumed line items.
 * @returns Map keyed by assignment id with finance payment rows.
 * @remarks Individual assignment failures are ignored so billing-account
 * details still render with existing fallback values.
 */
async function fetchAssignmentPaymentsById(
    assignmentIds: string[],
): Promise<AssignmentPaymentsById> {
    const entries = await Promise.all(assignmentIds.map(async assignmentId => {
        try {
            const payments = await fetchAssignmentPaymentSplits(assignmentId)

            return [assignmentId, payments] as const
        } catch {
            return [assignmentId, [] as AssignmentPayment[]] as const
        }
    }))

    return new Map(entries)
}

/**
 * Resolves the billing markup that applies to a row's challenge fee.
 *
 * @param item Billing-account line item being displayed.
 * @param billingAccountDetails Billing account detail payload.
 * @param challengeDetailsById Hydrated challenge details, or `undefined` while loading.
 * @returns Challenge-specific markup when available, otherwise the billing-account markup fallback.
 * @remarks Canonical challenge rows use challenge billing markup so `0` markup
 * challenges do not inherit the billing account default fee once hydrated. The
 * billing-account fallback keeps locked rows from showing a blank fee when
 * challenge hydration is unavailable.
 */
function getLineItemChallengeMarkup(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    challengeDetailsById: ChallengeDetailsById | undefined,
): unknown {
    const challengeId = item.externalType === 'CHALLENGE'
        ? normalizeRouteId(item.externalId)
        : undefined

    if (!challengeId) {
        return billingAccountDetails.markup
    }

    return challengeDetailsById?.get(challengeId)?.billing?.markup
        ?? billingAccountDetails.markup
}

/**
 * Resolves the challenge member-payment amount that should be visible in the row.
 *
 * @param item Raw locked or consumed billing-account challenge line item.
 * @param billingAccountDetails Billing account detail payload containing markup when available.
 * @param challengeDetailsById Hydrated challenge details, or `undefined` while loading.
 * @returns Member payment amount for the challenge row.
 * @remarks Locked challenge rows store member payments directly. Consumed
 * challenge rows prefer the API-provided member-payment subtotal when present.
 * Older payloads only expose the final billing-account charge, so the billing
 * markup is removed once using the challenge's own billing markup.
 */
function getChallengeMemberPaymentAmount(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    challengeDetailsById: ChallengeDetailsById | undefined,
): number | undefined {
    if (item.status === 'locked') {
        return item.amount
    }

    if (item.memberPaymentAmount !== undefined) {
        return item.memberPaymentAmount
    }

    const challengeMarkup = getLineItemChallengeMarkup(
        item,
        billingAccountDetails,
        challengeDetailsById,
    )

    if (challengeMarkup === undefined) {
        return undefined
    }

    return calculateMemberPaymentAmount(
        item.amount,
        challengeMarkup,
    )
}

/**
 * Resolves a persisted challenge fee from a consumed billing row.
 *
 * @param item Raw billing-account line item.
 * @returns Fee amount derived from the ledger charge and API-provided member
 * payment subtotal, or `undefined` when the row does not expose both values.
 * @remarks Completed challenge rows can expose the exact member-payment
 * subtotal even when markup is hidden from the current caller, so the
 * difference is the safest fee value for the manager/admin fee column.
 */
function getConsumedChallengeFeeAmount(
    item: BillingAccountLineItem,
): number | undefined {
    if (
        item.externalType !== 'CHALLENGE'
        || item.status !== 'consumed'
        || item.memberPaymentAmount === undefined
    ) {
        return undefined
    }

    const feeAmount = Number((item.amount - item.memberPaymentAmount).toFixed(2))

    return feeAmount >= 0
        ? feeAmount
        : undefined
}

/**
 * Resolves an exact finance split for one consumed engagement line item.
 *
 * @param item Billing-account engagement row.
 * @param billingAccountDetails Parent billing account details.
 * @param assignmentPaymentsById Finance payments keyed by assignment id.
 * @returns Exact payment split when finance payments can be matched to the row.
 * @remarks Some billing-account rows store only the combined ledger charge.
 * Finance keeps the original member payment and fee, so those values are used
 * before trusting API-provided markup-derived member-payment fallbacks.
 */
function getEngagementFinancePaymentSplit(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    assignmentPaymentsById: AssignmentPaymentsById | undefined,
): EngagementPaymentSplit | undefined {
    if (item.externalType !== 'ENGAGEMENT' || item.status !== 'consumed') {
        return undefined
    }

    const assignmentId = normalizeRouteId(item.externalId)
    const assignmentPayments = assignmentId
        ? assignmentPaymentsById?.get(assignmentId)
        : undefined

    if (!assignmentPayments?.length) {
        return undefined
    }

    const financeSplitMatches = filterPaymentsForBillingAccount(
        assignmentPayments,
        billingAccountDetails.id,
    )
        .map(getFinancePaymentSplitMatch)
        .filter((match): match is EngagementPaymentSplitMatch => !!match)

    const financeSplits = financeSplitMatches.map(match => match.split)

    if (financeSplits.length === 0) {
        return undefined
    }

    const matchingPaymentSplitResult = getLineItemMatchingPaymentSplit(
        item,
        financeSplitMatches,
    )

    if (matchingPaymentSplitResult.split) {
        return matchingPaymentSplitResult.split
    }

    const aggregateSplit = getAggregatePaymentSplit(financeSplits)

    if (
        aggregateSplit
        && aggregateSplit.challengeFee !== undefined
        && currencyAmountsMatch(
            aggregateSplit.paymentAmount + aggregateSplit.challengeFee,
            item.amount,
        )
    ) {
        return aggregateSplit
    }

    if (
        aggregateSplit
        && aggregateSplit.paymentAmount <= item.amount
        && (
            financeSplits.length === 1
            || matchingPaymentSplitResult.matchCount === 0
        )
    ) {
        return {
            challengeFee: roundCurrencyAmount(item.amount - aggregateSplit.paymentAmount),
            paymentAmount: aggregateSplit.paymentAmount,
        }
    }

    return undefined
}

/**
 * Resolves the row challenge fee amount for callers allowed to see markup.
 *
 * @param item Raw locked or consumed billing-account line item.
 * @param displayAmount Member-payment amount selected for display.
 * @param engagementPaymentSplit Exact finance payment split for engagement rows, when available.
 * @param billingAccountDetails Billing account detail payload containing hidden markup when available.
 * @param challengeDetailsById Hydrated challenge details, or `undefined` while loading.
 * @returns Persisted engagement or consumed challenge fee, calculated markup fee, or
 * `undefined` when the fee cannot be derived.
 * @remarks Engagement payment rows can expose the exact finance split.
 * Consumed challenge rows with an explicit member subtotal do not need
 * challenge markup hydration to show the correct fee.
 */
function getLineItemChallengeFeeAmount(
    item: BillingAccountLineItem,
    displayAmount: number | undefined,
    engagementPaymentSplit: EngagementPaymentSplit | undefined,
    billingAccountDetails: BillingAccountDetails,
    challengeDetailsById: ChallengeDetailsById | undefined,
): number | undefined {
    if (engagementPaymentSplit?.challengeFee !== undefined) {
        return engagementPaymentSplit.challengeFee
    }

    if (item.externalType === 'ENGAGEMENT' && item.challengeFee !== undefined) {
        return Number(item.challengeFee.toFixed(2))
    }

    const consumedChallengeFeeAmount = getConsumedChallengeFeeAmount(item)

    if (consumedChallengeFeeAmount !== undefined) {
        return consumedChallengeFeeAmount
    }

    const challengeMarkup = item.externalType === 'CHALLENGE'
        ? getLineItemChallengeMarkup(item, billingAccountDetails, challengeDetailsById)
        : billingAccountDetails.markup

    return calculatePaymentChallengeFee(displayAmount, challengeMarkup)
}

/**
 * Resolves the engagement member-payment amount that should be visible in the row.
 *
 * @param item Raw locked or consumed billing-account engagement line item.
 * @param billingAccountDetails Billing account detail payload containing markup when available.
 * @param engagementPaymentSplit Exact finance payment split for engagement rows, when available.
 * @returns Member payment amount when it can be derived.
 * @remarks Engagement rows prefer persisted finance payment amounts, then
 * API-provided member-payment aliases. When only the billing-account charge
 * is available, markup is removed once.
 */
function getEngagementMemberPaymentAmount(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    engagementPaymentSplit: EngagementPaymentSplit | undefined,
): number | undefined {
    if (engagementPaymentSplit?.paymentAmount !== undefined) {
        return engagementPaymentSplit.paymentAmount
    }

    if (item.paymentAmount !== undefined) {
        return item.paymentAmount
    }

    if (item.memberPaymentAmount !== undefined) {
        return item.memberPaymentAmount
    }

    return calculateMemberPaymentAmount(
        item.amount,
        billingAccountDetails.markup,
    )
}

/**
 * Resolves the member-payment amount that should be visible in the row.
 *
 * @param item Raw locked or consumed billing-account line item.
 * @param billingAccountDetails Billing account detail payload containing markup when available.
 * @returns Member payment amount when it can be derived.
 * @remarks This is the only row amount used for display and fee calculation.
 */
function getLineItemMemberPaymentAmount(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    challengeDetailsById: ChallengeDetailsById | undefined,
    engagementPaymentSplit: EngagementPaymentSplit | undefined,
): number | undefined {
    return item.externalType === 'CHALLENGE'
        ? getChallengeMemberPaymentAmount(item, billingAccountDetails, challengeDetailsById)
        : getEngagementMemberPaymentAmount(item, billingAccountDetails, engagementPaymentSplit)
}

/**
 * Builds the modal row model with the amount that should be visible to the caller.
 *
 * @param item Raw locked or consumed billing-account line item.
 * @param billingAccountDetails Billing account detail payload containing hidden markup when available.
 * @param challengeDetailsById Hydrated challenge details, or `undefined` while loading.
 * @param assignmentPaymentsById Finance payments keyed by engagement assignment id.
 * @param showChallengeFee Whether the caller can see billing challenge fees.
 * @returns A line item with `displayAmount` set to the visible member-payment
 * amount and, for non-copilots, `challengeFeeAmount` set to the billing markup fee.
 * @remarks Copilots receive the same member-payment amount but no fee value.
 */
function getDisplayLineItem(
    item: BillingAccountLineItem,
    billingAccountDetails: BillingAccountDetails,
    challengeDetailsById: ChallengeDetailsById | undefined,
    assignmentPaymentsById: AssignmentPaymentsById | undefined,
    showChallengeFee: boolean,
): BillingAccountModalLineItem {
    const engagementPaymentSplit = getEngagementFinancePaymentSplit(
        item,
        billingAccountDetails,
        assignmentPaymentsById,
    )
    const displayAmount = getLineItemMemberPaymentAmount(
        item,
        billingAccountDetails,
        challengeDetailsById,
        engagementPaymentSplit,
    )
    const challengeFeeAmount = showChallengeFee
        ? getLineItemChallengeFeeAmount(
            item,
            displayAmount,
            engagementPaymentSplit,
            billingAccountDetails,
            challengeDetailsById,
        )
        : undefined

    return {
        ...item,
        challengeFeeAmount: challengeFeeAmount !== undefined && challengeFeeAmount >= 0
            ? challengeFeeAmount
            : undefined,
        displayAmount,
    }
}

/**
 * Builds a lookup from engagement assignment ids to their parent engagement ids.
 *
 * @param engagements Engagements fetched for the current project.
 * @returns Map keyed by assignment id with engagement id values.
 * @remarks Billing-account engagement rows store assignment ids, while the
 * work-app engagement route needs the parent engagement id.
 */
function buildEngagementIdsByAssignmentId(engagements: Engagement[]): Map<string, string> {
    return engagements.reduce((assignmentMap, engagement) => {
        const engagementId = normalizeRouteId(engagement.id)

        if (!engagementId) {
            return assignmentMap
        }

        engagement.assignments.forEach(assignment => {
            const assignmentId = normalizeRouteId(assignment.id)

            if (assignmentId) {
                assignmentMap.set(assignmentId, engagementId)
            }
        })

        return assignmentMap
    }, new Map<string, string>())
}

/**
 * Resolves the link target for a modal line item name.
 *
 * @param item Line item rendered in the billing-account details modal.
 * @param projectId Project id used for project-scoped engagement routes.
 * @param engagementIdsByAssignmentId Lookup from engagement assignment ids to engagement ids.
 * @returns Work-app URL path, or `undefined` when the row cannot be linked safely.
 * @remarks Challenge rows link directly by external id. Engagement rows first
 * use an explicit `engagementId` when provided, then fall back to the assignment
 * lookup because current billing-account rows are assignment-keyed.
 */
function getLineItemUrl(
    item: BillingAccountModalLineItem,
    projectId: string | undefined,
    engagementIdsByAssignmentId: Map<string, string>,
): string | undefined {
    const externalId = normalizeRouteId(item.externalId)

    if (item.externalType === 'CHALLENGE' && externalId) {
        return buildChallengeUrl(externalId)
    }

    if (item.externalType !== 'ENGAGEMENT' || !projectId) {
        return undefined
    }

    const engagementId = normalizeRouteId(item.engagementId)
        || (externalId ? engagementIdsByAssignmentId.get(externalId) : undefined)

    return engagementId
        ? buildEngagementUrl(projectId, engagementId)
        : undefined
}

export const BillingAccountLineItemsModal: FC<BillingAccountLineItemsModalProps> = (
    props: BillingAccountLineItemsModalProps,
) => {
    const [sortBy, setSortBy] = useState<SortField>('date')
    const [sortOrder, setSortOrder] = useState<SortOrder>('desc')
    const showChallengeFeeColumn = !props.showMemberPaymentsRemaining
    const rawLineItems = useMemo<BillingAccountLineItem[]>(
        () => combineBillingAccountLineItems(props.billingAccountDetails),
        [props.billingAccountDetails],
    )
    const challengeLineItemIds = useMemo(
        () => getChallengeLineItemIds(rawLineItems),
        [rawLineItems],
    )
    const engagementPaymentAssignmentIds = useMemo(
        () => getEngagementPaymentAssignmentIds(rawLineItems),
        [rawLineItems],
    )
    const challengeDetailsResult = useSWR<ChallengeDetailsById>(
        challengeLineItemIds.length > 0
            ? ['work/billing-account-line-item-challenges', challengeLineItemIds.join(',')]
            : undefined,
        () => fetchChallengeDetailsById(challengeLineItemIds),
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )
    const challengeDetailsById = challengeLineItemIds.length > 0
        ? challengeDetailsResult.data
        : EMPTY_CHALLENGE_DETAILS_BY_ID
    const assignmentPaymentsResult = useSWR<AssignmentPaymentsById>(
        engagementPaymentAssignmentIds.length > 0
            ? [
                'work/billing-account-line-item-engagement-payments',
                props.billingAccountDetails.id,
                engagementPaymentAssignmentIds.join(','),
            ]
            : undefined,
        () => fetchAssignmentPaymentsById(engagementPaymentAssignmentIds),
        {
            errorRetryCount: 2,
            shouldRetryOnError: true,
        },
    )
    const assignmentPaymentsById = engagementPaymentAssignmentIds.length > 0
        ? assignmentPaymentsResult.data
        : EMPTY_ASSIGNMENT_PAYMENTS_BY_ID

    const lineItems = useMemo<BillingAccountModalLineItem[]>(
        () => rawLineItems
            .map(item => getDisplayLineItem(
                item,
                props.billingAccountDetails,
                challengeDetailsById,
                assignmentPaymentsById,
                showChallengeFeeColumn,
            )),
        [
            assignmentPaymentsById,
            challengeDetailsById,
            props.billingAccountDetails,
            rawLineItems,
            showChallengeFeeColumn,
        ],
    )
    const normalizedProjectId = useMemo(
        () => normalizeRouteId(props.projectId),
        [props.projectId],
    )
    const hasEngagementLineItems = useMemo(
        () => lineItems.some(item => item.externalType === 'ENGAGEMENT' && !!item.externalId),
        [lineItems],
    )
    const engagementResult = useFetchEngagements(
        normalizedProjectId,
        ENGAGEMENT_ASSIGNMENT_FILTERS,
        {
            enabled: !!normalizedProjectId && hasEngagementLineItems,
        },
    )
    const engagementIdsByAssignmentId = useMemo(
        () => buildEngagementIdsByAssignmentId(engagementResult.engagements),
        [engagementResult.engagements],
    )

    const sortedLineItems = useMemo<BillingAccountModalLineItem[]>(
        () => sortLineItems(lineItems, sortBy, sortOrder),
        [lineItems, sortBy, sortOrder],
    )
    const copilotBudgetInfo = useMemo(() => (
        props.showMemberPaymentsRemaining
            ? getCopilotMemberPaymentsBudgetInfo(props.billingAccountDetails)
            : undefined
    ), [props.billingAccountDetails, props.showMemberPaymentsRemaining])
    const copilotBudgetStatusClass = copilotBudgetInfo
        ? styles[`budget${copilotBudgetInfo.status.charAt(0)
            .toUpperCase()}${copilotBudgetInfo.status.slice(1)}`]
        : ''
    const tableClassName = showChallengeFeeColumn
        ? styles.table
        : `${styles.table} ${styles.tableWithoutFee}`

    const handleContainerClick = useCallback(
        (event: MouseEvent<HTMLDivElement>): void => {
            event.stopPropagation()
        },
        [],
    )

    const handleSortAmount = useCallback((): void => {
        if (sortBy === 'amount') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('amount')
            setSortOrder('desc')
        }
    }, [sortBy])

    const handleSortStatus = useCallback((): void => {
        if (sortBy === 'status') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('status')
            setSortOrder('desc')
        }
    }, [sortBy])

    const handleSortDate = useCallback((): void => {
        if (sortBy === 'date') {
            setSortOrder(current => (current === 'asc' ? 'desc' : 'asc'))
        } else {
            setSortBy('date')
            setSortOrder('desc')
        }
    }, [sortBy])

    const renderSortIcon = useCallback((field: SortField): JSX.Element | undefined => {
        if (field !== sortBy) {
            return undefined
        }

        return sortOrder === 'asc'
            ? <IconSolid.ChevronUpIcon className={styles.sortIcon} />
            : <IconSolid.ChevronDownIcon className={styles.sortIcon} />
    }, [sortBy, sortOrder])

    return (
        <div
            className={styles.overlay}
            onClick={props.onClose}
            role='presentation'
        >
            <div
                aria-modal='true'
                className={styles.container}
                onClick={handleContainerClick}
                role='dialog'
            >
                <header className={styles.header}>
                    <h4 className={styles.title}>Billing Account Details</h4>
                    <button
                        aria-label='Close'
                        className={styles.closeButton}
                        onClick={props.onClose}
                        type='button'
                    >
                        <IconOutline.XIcon className={styles.closeIcon} />
                    </button>
                </header>

                {props.showMemberPaymentsRemaining ? (
                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Remaining member payments</span>
                            <span
                                className={[
                                    styles.summaryValue,
                                    styles.budgetValue,
                                    copilotBudgetStatusClass,
                                ].join(' ')}
                            >
                                {copilotBudgetInfo
                                    ? formatCurrency(copilotBudgetInfo.memberPaymentsRemaining)
                                    : '-'}
                            </span>
                        </div>
                    </div>
                ) : (
                    <div className={styles.summary}>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Locked</span>
                            <span className={styles.summaryValue}>
                                {formatCurrency(props.billingAccountDetails.lockedBudget)}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Consumed</span>
                            <span className={styles.summaryValue}>
                                {formatCurrency(props.billingAccountDetails.consumedBudget)}
                            </span>
                        </div>
                        <div className={styles.summaryItem}>
                            <span className={styles.summaryLabel}>Remaining</span>
                            <span className={styles.summaryValue}>
                                {formatCurrency(props.billingAccountDetails.totalBudgetRemaining)}
                            </span>
                        </div>
                    </div>
                )}

                <div className={styles.body}>
                    {sortedLineItems.length === 0 ? (
                        <div className={styles.emptyState}>
                            No line items found for this billing account.
                        </div>
                    ) : (
                        <table className={tableClassName}>
                            <thead>
                                <tr>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortAmount}
                                            type='button'
                                        >
                                            Member Payments
                                            {renderSortIcon('amount')}
                                        </button>
                                    </th>
                                    {showChallengeFeeColumn ? (
                                        <th>Challenge Fee</th>
                                    ) : undefined}
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortStatus}
                                            type='button'
                                        >
                                            Status
                                            {renderSortIcon('status')}
                                        </button>
                                    </th>
                                    <th>Type</th>
                                    <th>Name</th>
                                    <th>
                                        <button
                                            className={styles.sortButton}
                                            onClick={handleSortDate}
                                            type='button'
                                        >
                                            Date
                                            {renderSortIcon('date')}
                                        </button>
                                    </th>
                                </tr>
                            </thead>
                            <tbody>
                                {sortedLineItems.map(item => {
                                    const displayName = item.externalName || '-'
                                    const lineItemUrl = getLineItemUrl(
                                        item,
                                        normalizedProjectId,
                                        engagementIdsByAssignmentId,
                                    )

                                    return (
                                        <tr key={item.id}>
                                            <td>{formatLineItemAmount(item)}</td>
                                            {showChallengeFeeColumn ? (
                                                <td>{formatLineItemChallengeFee(item)}</td>
                                            ) : undefined}
                                            <td>
                                                <span
                                                    className={
                                                        item.status === 'locked'
                                                            ? styles.statusLocked
                                                            : styles.statusConsumed
                                                    }
                                                >
                                                    {item.status === 'locked' ? (
                                                        <IconOutline.LockClosedIcon className={styles.statusIcon} />
                                                    ) : (
                                                        <IconSolid.CheckCircleIcon className={styles.statusIcon} />
                                                    )}
                                                    {item.status === 'locked' ? 'Locked' : 'Consumed'}
                                                </span>
                                            </td>
                                            <td>{EXTERNAL_TYPE_LABELS[item.externalType]}</td>
                                            <td className={styles.nameCell}>
                                                {lineItemUrl ? (
                                                    <a
                                                        className={styles.resourceLink}
                                                        href={lineItemUrl}
                                                        rel='noreferrer noopener'
                                                        target='_blank'
                                                    >
                                                        {displayName}
                                                    </a>
                                                ) : displayName}
                                            </td>
                                            <td>{formatDate(item.date)}</td>
                                        </tr>
                                    )
                                })}
                            </tbody>
                        </table>
                    )}
                </div>

                <footer className={styles.footer}>
                    <Button
                        label='Close'
                        onClick={props.onClose}
                        secondary
                        size='lg'
                    />
                </footer>
            </div>
        </div>
    )
}

export default BillingAccountLineItemsModal

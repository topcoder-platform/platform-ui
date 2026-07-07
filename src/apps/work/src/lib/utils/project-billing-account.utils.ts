import type { ProjectBillingAccount } from '../services'

type ProjectBillingAccountChallengeIssue = 'expired' | 'inactive' | 'insufficient-funds' | 'missing'
type ProjectBillingAccountEngagementPaymentIssue = 'expired' | 'inactive'
export type BillingAccountBudgetStatus = 'healthy' | 'warning' | 'critical'

export interface BillingAccountBudgetSource {
    budget?: number | string
    consumedBudget?: number | string
    lockedBudget?: number | string
    markup?: number | string
    memberPaymentsRemaining?: number | string
    totalBudgetRemaining?: number | string
}

export interface BillingAccountBudgetInfo {
    spent: number
    status: BillingAccountBudgetStatus
    totalBudget: number
    totalBudgetRemaining: number
}

export interface CopilotMemberPaymentsBudgetInfo extends BillingAccountBudgetInfo {
    memberPaymentsRemaining: number
}

/**
 * Normalizes an optional billing-account string value for challenge gating checks.
 *
 * @param value Raw Projects API or Billing Accounts API field value.
 * @returns A trimmed string when present, otherwise `undefined`.
 * @remarks Used only by the work app billing-account challenge gating helpers.
 */
function normalizeOptionalString(value: unknown): string | undefined {
    if (value === undefined || value === null) {
        return undefined
    }

    const normalizedValue = String(value)
        .trim()

    return normalizedValue || undefined
}

/**
 * Normalizes an optional billing-account number value for challenge gating checks.
 *
 * @param value Raw Projects API or Billing Accounts API field value.
 * @returns A finite number when parsing succeeds, otherwise `undefined`.
 * @remarks Used only by the work app billing-account challenge gating helpers.
 */
function normalizeOptionalNumber(value: unknown): number | undefined {
    if (value === undefined || value === null || value === '') {
        return undefined
    }

    const normalizedValue = Number(value)

    return Number.isFinite(normalizedValue)
        ? normalizedValue
        : undefined
}

/**
 * Normalizes billing markup into the decimal value used by billing-account math.
 *
 * @param value Raw markup value from the billing-account API.
 * @returns A non-negative decimal markup, or `undefined` when unavailable.
 * @remarks Billing-account APIs store markup as the direct multiplier used by
 * finance and billing-account ledger math. Values greater than `1` are valid
 * and must not be converted to percentage form.
 */
function normalizeBillingMarkup(value: unknown): number | undefined {
    const normalizedValue = normalizeOptionalNumber(value)

    if (normalizedValue === undefined || normalizedValue < 0) {
        return undefined
    }

    return normalizedValue
}

/**
 * Resolves the display color state for billing-account remaining budget.
 *
 * @param remaining Remaining billing-account budget.
 * @param total Total billing-account budget.
 * @returns Healthy, warning, or critical status for the remaining percentage.
 * @remarks Used by project billing badges, including the copilot-safe member
 * payments remaining display.
 */
export function getBillingAccountBudgetStatus(
    remaining: number,
    total: number,
): BillingAccountBudgetStatus {
    if (total <= 0) {
        return 'healthy'
    }

    const percentage = (remaining / total) * 100

    if (percentage < 10) {
        return 'critical'
    }

    if (percentage < 30) {
        return 'warning'
    }

    return 'healthy'
}

/**
 * Calculates a copilot-safe member payment amount from a billing-account amount.
 *
 * @param billingAccountAmount Billing-account amount with markup already accounted for.
 * @param markup Hidden billing-account markup multiplier.
 * @returns Member payment amount, or `undefined` when required values are unavailable.
 * @remarks Product requires copilot-safe amounts to be calculated as
 * `billing account amount / (1 + markup)` so copilots can see the underlying
 * payment value without seeing the markup itself. A zero markup means no fee
 * has been added, so the full billing-account amount is available for member
 * payments.
 */
export function calculateMemberPaymentAmount(
    billingAccountAmount: unknown,
    markup: unknown,
): number | undefined {
    const amount = normalizeOptionalNumber(billingAccountAmount)
    const normalizedMarkup = normalizeBillingMarkup(markup)

    if (amount === undefined || normalizedMarkup === undefined) {
        return undefined
    }

    if (normalizedMarkup === 0) {
        return Number(amount.toFixed(2))
    }

    return Number((amount / (1 + normalizedMarkup)).toFixed(2))
}

/**
 * Calculates the copilot-safe member payment capacity for a billing account.
 *
 * @param totalBudgetRemaining Remaining billing-account budget.
 * @param markup Hidden billing-account markup multiplier.
 * @returns Member payments remaining, or `undefined` when required values are unavailable.
 * @remarks Used by project billing displays so copilots can see remaining
 * member payment capacity without seeing markup or total budget values.
 */
export function calculateMemberPaymentsRemaining(
    totalBudgetRemaining: unknown,
    markup: unknown,
): number | undefined {
    return calculateMemberPaymentAmount(totalBudgetRemaining, markup)
}

/**
 * Resolves standard billing-account spent, total, and remaining values.
 *
 * @param billingAccount Billing-account data returned by project or billing APIs.
 * @returns Budget info for manager/admin displays, or `undefined` when budget
 * data is incomplete.
 * @remarks Remaining budget is preferred for the spent value so project-page
 * notices keep their previous display behavior. Locked and consumed totals are
 * used only when remaining budget is unavailable.
 */
export function getBillingAccountBudgetInfo(
    billingAccount: BillingAccountBudgetSource | undefined,
): BillingAccountBudgetInfo | undefined {
    const totalBudget = normalizeOptionalNumber(billingAccount?.budget)

    if (totalBudget === undefined) {
        return undefined
    }

    const lockedBudget = normalizeOptionalNumber(billingAccount?.lockedBudget)
    const consumedBudget = normalizeOptionalNumber(billingAccount?.consumedBudget)
    const totalBudgetRemaining = normalizeOptionalNumber(billingAccount?.totalBudgetRemaining)
    let spent: number | undefined
    let remaining: number | undefined

    if (totalBudgetRemaining !== undefined) {
        spent = totalBudget - totalBudgetRemaining
        remaining = totalBudgetRemaining
    } else if (lockedBudget !== undefined || consumedBudget !== undefined) {
        spent = (lockedBudget || 0) + (consumedBudget || 0)
        remaining = totalBudget - spent
    }

    if (spent === undefined || remaining === undefined) {
        return undefined
    }

    return {
        spent: Math.max(spent, 0),
        status: getBillingAccountBudgetStatus(remaining, totalBudget),
        totalBudget,
        totalBudgetRemaining: remaining,
    }
}

/**
 * Resolves the copilot-safe member payments remaining view for a billing account.
 *
 * @param billingAccount Billing-account data returned by project or billing APIs.
 * @returns Member payment capacity plus budget status, or `undefined` when
 * budget or member-payment data is incomplete.
 * @remarks Used only for copilot displays so manager/admin users continue to
 * see the standard locked/consumed and total budget values.
 */
export function getCopilotMemberPaymentsBudgetInfo(
    billingAccount: BillingAccountBudgetSource | undefined,
): CopilotMemberPaymentsBudgetInfo | undefined {
    const budgetInfo = getBillingAccountBudgetInfo(billingAccount)
    const memberPaymentsRemaining = normalizeOptionalNumber(billingAccount?.memberPaymentsRemaining)
        ?? calculateMemberPaymentsRemaining(
            billingAccount?.totalBudgetRemaining,
            billingAccount?.markup,
        )

    if (!budgetInfo || memberPaymentsRemaining === undefined) {
        return undefined
    }

    return {
        ...budgetInfo,
        memberPaymentsRemaining,
    }
}

/**
 * Resolves the effective billing-account active flag from either the boolean `active`
 * field or the textual `status` field returned by upstream APIs.
 *
 * @param billingAccount Project billing-account payload resolved in the work app.
 * @returns `true`, `false`, or `undefined` when activity cannot be inferred.
 * @remarks The work app uses this helper to keep launch gating aligned with the
 * upstream billing-account lifecycle fields.
 */
function resolveBillingAccountActive(
    billingAccount: ProjectBillingAccount | undefined,
): boolean | undefined {
    if (typeof billingAccount?.active === 'boolean') {
        return billingAccount.active
    }

    const normalizedStatus = normalizeOptionalString(billingAccount?.status)
        ?.toUpperCase()

    if (normalizedStatus === 'ACTIVE') {
        return true
    }

    if (normalizedStatus === 'INACTIVE') {
        return false
    }

    return undefined
}

/**
 * Determines whether a billing account should be treated as expired for challenge actions.
 *
 * @param billingAccount Project billing-account payload resolved in the work app.
 * @returns `true` when the billing account is no longer valid for challenge launch.
 * @remarks The work app mirrors the legacy launch behavior by treating inactive or
 * past-end-date billing accounts as expired for challenge launch purposes.
 */
function isBillingAccountExpired(
    billingAccount: ProjectBillingAccount | undefined,
): boolean {
    const active = resolveBillingAccountActive(billingAccount)
    const normalizedStatus = normalizeOptionalString(billingAccount?.status)
        ?.toUpperCase()

    if (normalizedStatus === 'EXPIRED') {
        return true
    }

    if (active === false) {
        return true
    }

    const endDate = normalizeOptionalString(billingAccount?.endDate)

    if (!endDate) {
        return false
    }

    const endDateTimestamp = Date.parse(endDate)

    if (Number.isNaN(endDateTimestamp)) {
        return false
    }

    return Date.now() >= endDateTimestamp
}

/**
 * Resolves whether a project billing account should block challenge launch actions.
 *
 * @param billingAccount Project billing-account payload resolved in the work app.
 * @param requiresBillingAccount Whether a missing billing account should block the action.
 * @returns The blocking reason, or `undefined` when the billing account can be used.
 * @remarks Used by the challenge editor and project billing notices so the work app
 * matches the legacy launch restriction for inactive, expired, and depleted billing accounts.
 */
export function getProjectBillingAccountChallengeIssue(
    billingAccount: ProjectBillingAccount | undefined,
    requiresBillingAccount: boolean = false,
): ProjectBillingAccountChallengeIssue | undefined {
    if (!billingAccount && requiresBillingAccount) {
        return 'missing'
    }

    const active = resolveBillingAccountActive(billingAccount)

    if (active === false) {
        return 'inactive'
    }

    if (isBillingAccountExpired(billingAccount)) {
        return 'expired'
    }

    const remainingBudget = normalizeOptionalNumber(billingAccount?.totalBudgetRemaining)

    if (remainingBudget !== undefined && remainingBudget <= 0) {
        return 'insufficient-funds'
    }

    return undefined
}

/**
 * Resolves whether a project billing account should block engagement payment creation.
 *
 * @param billingAccount Project billing-account payload resolved in the work app.
 * @returns The lifecycle blocking reason, or `undefined` when engagement payments can proceed.
 * @remarks Engagement payments are blocked only by billing-account lifecycle
 * state here. Missing billing account ids are handled by the payment submission
 * flow because it can fall back to the project payload id.
 */
export function getProjectBillingAccountEngagementPaymentIssue(
    billingAccount: ProjectBillingAccount | undefined,
): ProjectBillingAccountEngagementPaymentIssue | undefined {
    const active = resolveBillingAccountActive(billingAccount)

    if (active === false) {
        return 'inactive'
    }

    if (isBillingAccountExpired(billingAccount)) {
        return 'expired'
    }

    return undefined
}

/**
 * Builds the project-page notice text for an invalid billing account.
 *
 * @param issue The billing-account challenge issue that should be shown to the user.
 * @returns The notice text rendered above project-scoped work-app pages.
 * @remarks Used by the shared project billing-account notice component.
 */
export function getProjectBillingAccountNoticeMessage(
    issue: ProjectBillingAccountChallengeIssue,
): string {
    switch (issue) {
        case 'missing':
            return 'This project does not have a billing account.'
        case 'inactive':
            return 'The billing account for this project is inactive.'
        case 'expired':
            return 'The billing account for this project has expired.'
        case 'insufficient-funds':
            return 'The billing account for this project has insufficient remaining funds.'
        default:
            return 'The billing account for this project is invalid.'
    }
}

/**
 * Builds the launch-time error message for an invalid billing account.
 *
 * @param issue The billing-account challenge issue that should block launch.
 * @returns The message shown when the work app blocks a launch attempt.
 * @remarks Used by the challenge editor so users get a clear launch failure reason
 * before any API call is attempted.
 */
export function getProjectBillingAccountChallengeErrorMessage(
    issue: ProjectBillingAccountChallengeIssue,
): string {
    switch (issue) {
        case 'missing':
            return 'Cannot launch challenges because this project does not have a billing account.'
        case 'inactive':
            return 'Cannot launch challenges because the project billing account is inactive.'
        case 'expired':
            return 'Cannot launch challenges because the project billing account is expired.'
        case 'insufficient-funds':
            return 'Cannot launch challenges because the project billing account has insufficient remaining funds.'
        default:
            return 'Cannot launch challenges because the project billing account is invalid.'
    }
}

/**
 * Builds the payment-time error message for an invalid billing account lifecycle state.
 *
 * @param issue The billing-account lifecycle issue that should block engagement payment creation.
 * @returns The message shown when the work app blocks an engagement payment attempt.
 * @remarks Used by the engagement assignment payment flow so users get a clear
 * failure reason before any finance API call is attempted.
 */
export function getProjectBillingAccountEngagementPaymentErrorMessage(
    issue: ProjectBillingAccountEngagementPaymentIssue,
): string {
    switch (issue) {
        case 'inactive':
            return 'Cannot create engagement payments because the project billing account is inactive.'
        case 'expired':
            return 'Cannot create engagement payments because the project billing account is expired.'
        default:
            return 'Cannot create engagement payments because the project billing account is invalid.'
    }
}

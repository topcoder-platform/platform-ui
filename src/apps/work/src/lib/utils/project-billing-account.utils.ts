import type { ProjectBillingAccount } from '../services'

type ProjectBillingAccountChallengeIssue = 'expired' | 'inactive' | 'insufficient-funds'

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
 * @returns The blocking reason, or `undefined` when the billing account can be used.
 * @remarks Used by the challenge editor and project billing notices so the work app
 * matches the legacy launch restriction for inactive, expired, and depleted billing accounts.
 */
export function getProjectBillingAccountChallengeIssue(
    billingAccount: ProjectBillingAccount | undefined,
): ProjectBillingAccountChallengeIssue | undefined {
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

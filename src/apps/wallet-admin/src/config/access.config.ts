/**
 * Wallet Admin payment roles accepted by the finance admin search APIs.
 *
 * Keep this list aligned with tc-finance-api admin winnings search roles so
 * members without payment access never reach the payments UI.
 */
export const WALLET_ADMIN_PAYMENT_ROLES: ReadonlyArray<string> = [
    'Payment Admin',
    'Payment BA Admin',
    'Payment Approver',
    'Payment Editor',
    'Payment Viewer',
    'Wipro TaaS Admin',
]

/**
 * Role allowed to see the Trolley Logs report.
 *
 * The report lists releases for every member and is not filtered by billing
 * account, so it is limited to platform Admins; Payment Admin and Payment BA
 * Admin do not get it. Keep aligned with tc-finance-api
 * `GET /admin/payment-releases/duplicates`.
 */
export const TROLLEY_LOGS_ROLE = 'administrator'

/**
 * Roles that can open Wallet Admin: the payment roles, plus Admins for the
 * Trolley Logs report.
 */
export const WALLET_ADMIN_ALLOWED_ROLES: ReadonlyArray<string> = [
    ...WALLET_ADMIN_PAYMENT_ROLES,
    TROLLEY_LOGS_ROLE,
]

function hasAnyRole(roles: string[] | undefined, allowedRoles: ReadonlyArray<string>): boolean {
    const normalizedRoles = new Set((roles || []).map(role => role.trim()
        .toLowerCase()))

    return allowedRoles.some(role => normalizedRoles.has(role.toLowerCase()))
}

/**
 * Returns whether the member can open Wallet Admin.
 *
 * @param roles Profile roles from Auth0.
 * @returns True when the member has a payment role or is an Admin.
 */
export function canAccessWalletAdmin(roles: string[] | undefined): boolean {
    return hasAnyRole(roles, WALLET_ADMIN_ALLOWED_ROLES)
}

/**
 * Returns whether the member can see the Payments tab.
 *
 * @param roles Profile roles from Auth0.
 * @returns True when at least one payment role is present.
 */
export function canAccessPayments(roles: string[] | undefined): boolean {
    return hasAnyRole(roles, WALLET_ADMIN_PAYMENT_ROLES)
}

/**
 * Returns whether the member can see the Trolley Logs report.
 *
 * @param roles Profile roles from Auth0.
 * @returns True when the member is an Admin.
 */
export function canAccessTrolleyLogs(roles: string[] | undefined): boolean {
    return hasAnyRole(roles, [TROLLEY_LOGS_ROLE])
}

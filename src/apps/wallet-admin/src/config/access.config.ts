/**
 * Wallet Admin roles accepted by the finance admin search APIs.
 *
 * Keep this list aligned with tc-finance-api admin winnings search roles so
 * members without payment access never reach the filters UI.
 */
export const WALLET_ADMIN_ALLOWED_ROLES: ReadonlyArray<string> = [
    'Payment Admin',
    'Payment BA Admin',
    'Payment Approver',
    'Payment Editor',
    'Payment Viewer',
    'Wipro TaaS Admin',
]

/**
 * Returns whether the member has any Wallet Admin payment role.
 *
 * @param roles Profile roles from Auth0.
 * @returns True when at least one allowed payment role is present.
 */
export function canAccessWalletAdmin(roles: string[] | undefined): boolean {
    const normalizedRoles = new Set((roles || []).map(role => role.trim()
        .toLowerCase()))

    return WALLET_ADMIN_ALLOWED_ROLES.some(role => normalizedRoles.has(role.toLowerCase()))
}

/**
 * Role allowed to see the duplicate payments report.
 *
 * The report lists releases for every member and is not filtered by billing
 * account, so it is limited to the role that already sees all payments.
 * Keep aligned with tc-finance-api `GET /admin/payment-releases/duplicates`.
 */
export const DUPLICATE_PAYMENTS_REPORT_ROLE = 'Payment Admin'

/**
 * Returns whether the member can see the duplicate payments report.
 *
 * @param roles Profile roles from Auth0.
 * @returns True when the member has the Payment Admin role.
 */
export function canAccessDuplicatePaymentsReport(roles: string[] | undefined): boolean {
    return (roles || []).some(role => role.trim()
        .toLowerCase() === DUPLICATE_PAYMENTS_REPORT_ROLE.toLowerCase())
}

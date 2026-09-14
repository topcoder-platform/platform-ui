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

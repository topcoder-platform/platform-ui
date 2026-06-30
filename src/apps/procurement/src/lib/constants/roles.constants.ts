/**
 * Procurement role constants accepted by the procurement app routes.
 */
export const ProcurementRole = {
    admin: 'procurement-admin',
    user: 'procurement-user',
} as const

export const PROCUREMENT_ALLOWED_ROLES: Array<string> = [
    ProcurementRole.admin,
    ProcurementRole.user,
]

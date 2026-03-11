import { UserRole } from '~/libs/core'

export const administratorOnlyRoles: UserRole[] = [
    UserRole.administrator,
]

export const adminReportsAccessRoles: UserRole[] = [
    UserRole.administrator,
    UserRole.productManager,
    UserRole.talentManager,
]

/**
 * Returns true when the current user is an administrator.
 */
export function isAdministrator(roles?: string[]): boolean {
    return !!roles?.includes(UserRole.administrator)
}

/**
 * Returns true when the current user should be able to enter the admin reports module.
 */
export function canAccessAdminReports(roles?: string[]): boolean {
    return !!roles?.some(role => adminReportsAccessRoles.includes(role as UserRole))
}

const talentReportRoles = new Set<string>([
    'administrator',
    'talent manager',
])

/**
 * Checks whether a user role list can access the reports Talent tab.
 * @param roles Roles from the authenticated Topcoder profile or decoded token.
 * @returns Whether the user is an administrator or Talent Manager.
 */
export function canAccessTalentReport(roles?: string[]): boolean {
    return !!roles?.some(role => talentReportRoles.has(role.trim()
        .toLowerCase()))
}

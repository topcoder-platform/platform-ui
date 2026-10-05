import { useMemo } from 'react'

import { UserProfile, UserRole } from '~/libs/core'

/** Roles that can always browse the campus homepage. */
const CAMPUS_HOME_ROLES: ReadonlyArray<string> = [
    UserRole.administrator,
    UserRole.projectManager,
    UserRole.talentManager,
]

/**
 * Whether the user may browse the campus homepage: wipro users, admins, PMs and TMs.
 *
 * @param profile signed in user profile, when available.
 * @returns true when the homepage can be shown.
 */
export const useCanAccessCampusHome = (profile?: UserProfile): boolean => useMemo(() => (
    !!profile && (
        !!profile.email?.toLowerCase()
            .endsWith('@wipro.com')
        || !!profile.roles?.some(role => CAMPUS_HOME_ROLES.includes(role))
    )
), [profile])

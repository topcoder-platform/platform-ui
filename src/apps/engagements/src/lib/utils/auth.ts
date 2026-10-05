import { useProfileContext } from '~/libs/core'
import { checkTalentManager, hasAdminRole } from '~/apps/work/src/lib'

export interface AuthCtx {
    isAdmin: boolean;
    isLoggedIn: boolean;
    isTm: boolean;
    userRoles: string[];
}

export const useAuth = (): AuthCtx => {
    const profileContext = useProfileContext()
    const isLoggedIn = profileContext.isLoggedIn
    const userRoles = profileContext.profile?.roles ?? []

    return {
        isAdmin: hasAdminRole(userRoles),
        isLoggedIn,
        isTm: checkTalentManager(userRoles),
        userRoles,
    }
}

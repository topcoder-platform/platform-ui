import { TabsNavItem } from '~/libs/ui'
import { manageChallengeRouteId, manageUserRouteId } from '~/apps/admin/src/admin-app.routes'

export const SystemAdminTabsConfig: TabsNavItem[] = [
    {
        id: manageChallengeRouteId,
        title: 'Challenge Management',
    },
    {
        id: manageUserRouteId,
        title: 'User Management',
    },
]

export function getTabIdFromPathName(pathname: string): string {
    if (pathname.includes(`/${manageChallengeRouteId}`)) {
        return manageChallengeRouteId
    }

    return manageChallengeRouteId
}

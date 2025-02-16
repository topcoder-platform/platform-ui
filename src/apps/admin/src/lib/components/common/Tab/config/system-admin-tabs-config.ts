import { TabsNavItem } from '~/libs/ui'
import { manageChallengeRouteId } from '~/apps/admin/src/admin-app.routes'

export const SystemAdminTabsConfig: TabsNavItem[] = [
    {
        id: manageChallengeRouteId,
        title: 'Challenge Management',
    },
]

export function getTabIdFromPathName(pathname: string): string {
    if (pathname.includes(`/${manageChallengeRouteId}`)) {
        return manageChallengeRouteId
    }

    return manageChallengeRouteId
}

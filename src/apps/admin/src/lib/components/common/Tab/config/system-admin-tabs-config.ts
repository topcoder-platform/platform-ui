import { TabsNavItem } from '~/libs/ui'
import { manageChallengeRouteId, manageReviewRouteId } from '~/apps/admin/src/admin-app.routes'

export const SystemAdminTabsConfig: TabsNavItem[] = [
    {
        id: manageChallengeRouteId,
        title: 'Challenge Management',
    },
    {
        id: manageReviewRouteId,
        title: 'Review Management',
    },
]

export function getTabIdFromPathName(pathname: string): string {
    if (pathname.includes(`/${manageChallengeRouteId}`)) {
        return manageChallengeRouteId
    }

    if (pathname.includes(`/${manageReviewRouteId}`)) {
        return manageReviewRouteId
    }

    return manageChallengeRouteId
}

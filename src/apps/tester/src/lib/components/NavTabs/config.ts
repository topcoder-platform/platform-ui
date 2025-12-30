import { TabsNavItem } from '~/libs/ui'
import { flowsRouteId } from '~/apps/tester/src/config/routes.config'

export function getTabsConfig(): TabsNavItem[] {
    return [
        {
            id: flowsRouteId,
            title: 'Flows',
        },
    ]
}

export function getTabIdFromPathName(pathname: string): string {
    const matchItem = getTabsConfig()
        .find(item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return ''
}

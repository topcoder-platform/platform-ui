import _ from 'lodash'

import { TabsNavItem } from '~/libs/ui'

export function getTabsConfig(): TabsNavItem[] {
    return []
}

export function getTabIdFromPathName(
    pathname: string,
): string {
    const matchItem = _.find(getTabsConfig(), item => pathname.includes(`/${item.id}`))

    if (matchItem) {
        return matchItem.id
    }

    return ''
}

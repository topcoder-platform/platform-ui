import { TableColumn } from '~/libs/ui'

import { GameBadge } from '../../../game-lib'

import { BadgeActionRenderer } from './badge-action-renderer'
import { BadgeListingNameRenderer } from './badge-name-renderer'

export const badgeListingColumns: (rootPage: string) => ReadonlyArray<TableColumn<GameBadge>> = (rootPage: string) => [
    {
        defaultSortDirection: 'asc',
        isDefaultSort: true,
        label: 'Badge Name',
        propertyName: 'badge_name',
        renderer: (data: GameBadge) => <BadgeListingNameRenderer {...data} />,
        type: 'element',
    },
    {
        renderer: (data: GameBadge) => <BadgeActionRenderer {...data} rootPage={rootPage} />,
        type: 'action',
    },
]

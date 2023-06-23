import { TableColumn } from '~/libs/ui'

import { GameBadge } from '../../../game-lib'

import { BadgeActionRenderer } from './badge-action-renderer'
import { BadgeListingNameRenderer } from './badge-name-renderer'

export const badgeListingColumns: ReadonlyArray<TableColumn<GameBadge>> = [
    {
        defaultSortDirection: 'asc',
        isDefaultSort: true,
        label: 'Badge Name',
        propertyName: 'badge_name',
        renderer: BadgeListingNameRenderer,
        type: 'element',
    },
    {
        renderer: BadgeActionRenderer,
        type: 'action',
    },
]

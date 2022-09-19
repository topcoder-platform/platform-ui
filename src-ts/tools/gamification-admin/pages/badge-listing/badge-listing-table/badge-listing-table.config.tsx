import { TableColumn } from '../../../../../lib'
import { Badge } from '../../../lib/models/badge.model'

import { BadgeActionRenderer } from './badge-action-renderer'
import { BadgeListingNameRenderer } from './badge-name-renderer'

export const badgeListingColumns: ReadonlyArray<TableColumn<Badge>> = [
  {
    defaultSortDirection: 'asc',
    isDefaultSort: true,
    label: 'Badge Name',
    propertyName: 'badge_name',
    renderer: BadgeListingNameRenderer,
    type: 'element',
  },
  {
    centerHeader: true,
    label: 'Actions',
    renderer: BadgeActionRenderer,
    type: 'action',
  },
]

import { TableColumn } from '../../../../../../lib'
import { MemberBadgeAward } from '../../../../game-lib'

import { MemberActionRenderer } from './member-action-renderer'
import { MemberAwaredAtRenderer } from './member-awardedAt-renderer'
import { MemberHandleRenderer } from './member-handle-renderer'

export const awardedMembersColumns: ReadonlyArray<TableColumn<MemberBadgeAward>> = [
    {
        defaultSortDirection: 'asc',
        isDefaultSort: true,
        label: 'Handle',
        propertyName: 'user_handle',
        renderer: MemberHandleRenderer,
        type: 'element',
    },
    {
        defaultSortDirection: 'asc',
        label: 'Awarded at',
        propertyName: 'awarded_at',
        renderer: MemberAwaredAtRenderer,
        type: 'element',
    },
    {
        renderer: MemberActionRenderer,
        type: 'action',
    },
]

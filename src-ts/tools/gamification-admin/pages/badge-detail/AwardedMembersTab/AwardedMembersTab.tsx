import { Dispatch, FC, SetStateAction, useState } from 'react'

import { InfinitePageHandler, Sort, Table, TableColumn, tableGetDefaultSort } from '../../../../../lib'
import { GameBadge, MemberBadgeAward } from '../../../game-lib'

import { awardedMembersColumns } from './awarded-members-table/awarded-members-table.config'
import styles from './AwardedMembersTab.module.scss'

export interface AwardedMembersTabProps {
    badge: GameBadge
}

const AwardedMembersTab: FC<AwardedMembersTabProps> = (props: AwardedMembersTabProps) => {
    const [sort, setSort]: [Sort, Dispatch<SetStateAction<Sort>>] = useState<Sort>(tableGetDefaultSort(awardedMembersColumns))

    const [columns]: [
        ReadonlyArray<TableColumn<MemberBadgeAward>>,
        Dispatch<SetStateAction<ReadonlyArray<TableColumn<MemberBadgeAward>>>>,
    ]
        = useState<ReadonlyArray<TableColumn<MemberBadgeAward>>>([...awardedMembersColumns])

    function onSortClick(newSort: Sort): void {
        setSort({ ...newSort })
    }

    return (
        <div className={styles.tabWrap}>
            {
                props.badge.member_badges?.length ? (
                    <Table
                        columns={columns}
                        data={props.badge.member_badges}
                    // onLoadMoreClick={pageHandler.getAndSetNext}
                    // moreToLoad={pageHandler.hasMore}
                    // onToggleSort={onSortClick}
                    />
                ) : undefined
            }
        </div>
    )
}

export default AwardedMembersTab

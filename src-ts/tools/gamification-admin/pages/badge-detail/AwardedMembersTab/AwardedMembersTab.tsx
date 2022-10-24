import { Dispatch, FC, SetStateAction, useEffect, useState } from 'react'

import { InfinitePageHandler, Sort, Table, TableColumn, tableGetDefaultSort } from '../../../../../lib'
import { GameBadge, MemberBadgeAward } from '../../../game-lib'
import { useGetGameBadgeAssigneesPage } from '../../../game-lib/hooks/use-get-game-badge-assignees-page.hook'

import { awardedMembersColumns } from './awarded-members-table/awarded-members-table.config'
import styles from './AwardedMembersTab.module.scss'

export interface AwardedMembersTabProps {
    badge: GameBadge
    forceRefresh?: boolean
}

const AwardedMembersTab: FC<AwardedMembersTabProps> = (props: AwardedMembersTabProps) => {
    const [sort, setSort]: [Sort, Dispatch<SetStateAction<Sort>>] = useState<Sort>(tableGetDefaultSort(awardedMembersColumns))

    const [columns]: [
        ReadonlyArray<TableColumn<MemberBadgeAward>>,
        Dispatch<SetStateAction<ReadonlyArray<TableColumn<MemberBadgeAward>>>>,
    ]
        = useState<ReadonlyArray<TableColumn<MemberBadgeAward>>>([...awardedMembersColumns])

    const pageHandler: InfinitePageHandler<MemberBadgeAward> = useGetGameBadgeAssigneesPage(props.badge, sort)

    useEffect(() => {
        if (props.forceRefresh && pageHandler && !pageHandler.isValidating) {
            pageHandler.mutate()
        }
    }, [
        props.forceRefresh,
        pageHandler,
    ])

    function onSortClick(newSort: Sort): void {
        setSort({ ...newSort })
    }

    return (
        <div className={styles.tabWrap}>
            {
                pageHandler.data?.length ? (
                    <Table
                        columns={columns}
                        data={pageHandler.data}
                        onLoadMoreClick={pageHandler.getAndSetNext}
                        moreToLoad={pageHandler.hasMore}
                        onToggleSort={onSortClick}
                    />
                ) : undefined
            }
        </div>
    )
}

export default AwardedMembersTab

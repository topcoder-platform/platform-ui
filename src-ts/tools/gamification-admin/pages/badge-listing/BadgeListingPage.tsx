import { Dispatch, FC, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'

import {
    ButtonProps,
    ContentLayout,
    InfinitePageHandler,
    LoadingSpinner,
    Sort,
    Table,
    TableColumn,
    tableGetDefaultSort,
} from '../../../../lib'
import { GameBadge, useGetGameBadgesPage } from '../../game-lib'
import { createBadgeRoute } from '../../gamification-admin.routes'

import { badgeListingColumns } from './badge-listing-table'
import styles from './BadgeListingPage.module.scss'

const BadgeListingPage: FC = () => {

    const [sort, setSort]: [Sort, Dispatch<SetStateAction<Sort>>] = useState<Sort>(tableGetDefaultSort(badgeListingColumns))
    const [columns]: [
        ReadonlyArray<TableColumn<GameBadge>>,
        Dispatch<SetStateAction<ReadonlyArray<TableColumn<GameBadge>>>>,
    ]
        = useState<ReadonlyArray<TableColumn<GameBadge>>>([...badgeListingColumns])

    const pageHandler: InfinitePageHandler<GameBadge> = useGetGameBadgesPage(sort)
    const navigate: NavigateFunction = useNavigate()

    function onSortClick(newSort: Sort): void {
        setSort({ ...newSort })
    }

    // header button config
    const buttonConfig: ButtonProps = {
        label: 'Create New Badge',
        onClick: () => navigate(createBadgeRoute),
    }

    if (!pageHandler.data) {
        return <LoadingSpinner />
    }

    return (
        <ContentLayout
            title='Gamification Admin Portal'
            buttonConfig={buttonConfig}
        >
            <div className={styles.container}>
                <Table
                    columns={columns}
                    data={pageHandler.data || []}
                    onLoadMoreClick={pageHandler.getAndSetNext}
                    moreToLoad={pageHandler.hasMore}
                    onToggleSort={onSortClick}
                />
            </div>
        </ContentLayout>
    )
}

export default BadgeListingPage

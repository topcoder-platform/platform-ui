import { flatten, map } from 'lodash'
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
// tslint:disable-next-line
import useSWRInfinite from 'swr/infinite'

import { ButtonProps, ContentLayout, LoadingSpinner, Sort, Table, TableColumn } from '../../../../lib'
import { GamificationConfig } from '../../config'
import { baseUrl } from '../../gamification-admin.routes'
import getDataSource from '../../lib/hooks/getDataSource'
import { Badge } from '../../lib/models/badge.model'

import { badgeListingColumns } from './badge-listing-table/badge-listing-table.config'
import styles from './BadgeListingPage.module.scss'

const BadgeListingPage: FC = () => {
  const [order, setOrder]: any = useState({ by: 'badge_name', type: 'asc' })
  const navigate: NavigateFunction = useNavigate()
  const dataSource: string = getDataSource()

  // server-side pagination hook
  const getKey: any = (pageIndex: any, previousPageData: any) => {
    if (previousPageData && !previousPageData.rows.length) { return undefined } // reached the end
    return `${dataSource}/badges?organization_id=${GamificationConfig.ORG_ID}&limit=12&offset=${pageIndex * 12}&order_by=${order.by}&order_type=${order.type}`
  }
  const { data: badges, size, setSize }: any = useSWRInfinite(getKey, { revalidateFirstPage: false })

  const tableData: Array<Badge> = flatten(map(badges, page => page.rows)) // flatten version of badges paginated data
  const loadedCnt: any = badges?.reduce((ps: any, a: any) => ps + a.rows.length, 0) // how much data is loaded so far

  // listing table config
  const [columns]: [
    ReadonlyArray<TableColumn<Badge>>,
    Dispatch<SetStateAction<ReadonlyArray<TableColumn<Badge>>>>,
  ]
    = useState<ReadonlyArray<TableColumn<Badge>>>([...badgeListingColumns])

  // on sort toggle callback
  const onOrderClick: any = (sort: Sort) => {
    setOrder({
      by: sort.fieldName,
      type: sort.direction,
    })
  }

  // on load more callback
  const onLoadMoreClick: any = () => setSize(size + 1)
  // header button config
  const buttonConfig: ButtonProps = {
    label: 'Create New Badge',
    onClick: () => navigate(`${baseUrl}/create-badge`),
  }

  if (!badges) { return <LoadingSpinner /> }

  return (
    <ContentLayout
      title='Gamification Admin Protal'
      buttonConfig={buttonConfig}
    >
      <div className={styles.container}>
        <Table
          columns={columns}
          data={tableData}
          onLoadMoreClick={onLoadMoreClick}
          loadMoreBtnStyle='tertiary'
          loadMoreBtnSize='lg'
          loadMoreBtnLabel='Load More'
          moreToLoad={badges[0].count !== loadedCnt}
          onToggleSort={onOrderClick}
        />
      </div>
    </ContentLayout>
  )
}

export default BadgeListingPage

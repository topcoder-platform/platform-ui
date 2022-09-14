import { FC, useState } from 'react'
import { NavigateFunction, useNavigate } from 'react-router-dom'
// tslint:disable-next-line
import useSWRInfinite from 'swr/infinite'

import { Button, ButtonProps, ContentLayout, IconOutline, LoadingSpinner } from '../../../../lib'
import { GamificationConfig } from '../../config'
import { baseUrl } from '../../gamification-admin.routes'
import getDataSource from '../../lib/hooks/getDataSource'

import styles from './BadgeListingPage.module.scss'

const BadgeListingPage: FC = () => {
  const [order, setOrder]: any = useState({ by: 'badge_name', type: 'asc' })
  const navigate: NavigateFunction = useNavigate()
  const dataSource: string = getDataSource()
  const getKey: any = (pageIndex: any, previousPageData: any) => {
    if (previousPageData && !previousPageData.rows.length) { return undefined } // reached the end
    return `${dataSource}/badges?organization_id=${GamificationConfig.ORG_ID}&limit=12&offset=${pageIndex * 12}&order_by=${order.by}&order_type=${order.type}`
  }
  const { data: badges, size, setSize }: any = useSWRInfinite(getKey, { revalidateFirstPage: false })
  const loadedCnt: any = badges?.reduce((ps: any, a: any) => ps + a.rows.length, 0)
  const onOrderClick: any = () => {
    setOrder({
      by: order.by,
      type: order.type === 'asc' ? 'desc' : 'asc',
    })
  }

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
        <div className={styles['badges-table-header']}>
          <div className={styles['col-sort']}>
            BADGE NAME
            {
              order.type === 'asc' ? (
                <Button icon={IconOutline.SortDescendingIcon} onClick={onOrderClick} buttonStyle='icon' />
              ) : (
                <Button icon={IconOutline.SortAscendingIcon} onClick={onOrderClick} buttonStyle='icon' />
              )
            }
          </div>
          <div>ACTIONS</div>
        </div>
        <div className={styles['badges-table']}>
          {
            badges.map((page: any) => page.rows.map((badge: any) => <div className={styles['badge-row']} key={badge.id}>
              <div className={styles.badge}>
                <img src={badge.badge_image_url} alt={badge.badge_name} className={styles[badge.active ? 'badge-image' : 'badge-image-disabled']} />
                <p className={styles['badge-name']}>{badge.badge_name}</p>
              </div>
              <div className={styles.actions}>
                <Button buttonStyle='secondary' className={styles['action-btn']} label='View' size='sm' route={`${baseUrl}/badge-detail/${badge.id}`} />
                <Button buttonStyle='secondary' className={styles['action-btn']} label='Award' size='sm' onClick={() => { }} />
              </div>
            </div>
            ))
          }
        </div>
        {
          badges[0].count !== loadedCnt && <div className={styles['loadbtn-wrap']}>
            <Button buttonStyle='tertiary' label='Load more' size='lg' onClick={() => {
              setSize(size + 1)
            }} />
          </div>
        }
      </div>
    </ContentLayout>
  )
}

export default BadgeListingPage

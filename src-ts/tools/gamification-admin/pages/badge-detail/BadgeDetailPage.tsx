import { FC, useMemo } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../lib'
import { baseUrl } from '../../gamification-admin.routes'
import { toolTitle } from '../../GamificationAdmin'

import styles from './BadgeDetailPage.module.scss'

const BadgeDetailPage: FC = () => {
  // const { id: badgeID } : { badgeID: string } = useParams()
  const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
    { name: toolTitle, url: baseUrl },
    { name: 'badge detail', url: '#' },
  ], [])

  return (
    <ContentLayout
      contentClass={styles['contentLayout']}
      outerClass={styles['contentLayout-outer']}
      innerClass={styles['contentLayout-inner']}
      title='Badge Detail'
    >
      <Breadcrumb items={breadcrumb} />
      <div className={styles.container}>

      </div>
    </ContentLayout>
  )
}

export default BadgeDetailPage

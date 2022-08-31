import { FC, useMemo } from 'react'

import { Breadcrumb, BreadcrumbItemModel, ContentLayout } from '../../../../lib'
import { baseUrl } from '../../gamification-admin.routes'
import { toolTitle } from '../../GamificationAdmin'

import styles from './CreateBadgePage.module.scss'

const CreateBadgePage: FC = () => {
  const breadcrumb: Array<BreadcrumbItemModel> = useMemo(() => [
    { name: toolTitle, url: baseUrl },
    { name: 'create badge', url: '#' },
  ], [])

  return (
    <ContentLayout
      contentClass={styles['contentLayout']}
      outerClass={styles['contentLayout-outer']}
      innerClass={styles['contentLayout-inner']}
      title='Create Badge'
    >
      <Breadcrumb items={breadcrumb} />
      <div className={styles.container}>

      </div>
    </ContentLayout>
  )
}

export default CreateBadgePage

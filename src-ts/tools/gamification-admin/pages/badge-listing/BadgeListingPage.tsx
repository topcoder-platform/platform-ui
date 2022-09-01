import { FC } from 'react'

import { ContentLayout } from '../../../../lib'

import styles from './BadgeListingPage.module.scss'

const BadgeListingPage: FC = () => {

  return (
    <ContentLayout
      contentClass={styles['contentLayout']}
      outerClass={styles['contentLayout-outer']}
      innerClass={styles['contentLayout-inner']}
      title='Gamification Admin Protal'
    >
      <div className={styles.container}>

      </div>
    </ContentLayout>
  )
}

export default BadgeListingPage

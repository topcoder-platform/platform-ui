import { FC } from 'react'

import styles from './WorkTypeBanner.module.scss'

interface WorkTypeBannerProps {
  subTitle: string,
  title: string,
  workType: string
}

export const WorkTypeBanner: FC<WorkTypeBannerProps> = (props: WorkTypeBannerProps) => {

  const styleType: string = props.workType
    .toLowerCase()
    .split(' ')
    .join('-')
    .split('&')
    .join('')

  console.log(styleType, 'styleType')

  return (
    <div className={`${styles.heroContainer} ${styles[styleType]}`}>
      <div
        className={`${styles.heroBackgroundContainer} ${styles[styleType]}`}
      ></div>
      <div className={styles.heroContent}>
        <div className={styles.heroHeader}>
          <div className={styles.heroHeaderContent}>
            <div className={styles.heroHeaderTitle}>{props.title}</div>
            <div className={styles.heroHeaderSubtitle}>{props.subTitle}</div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default WorkTypeBanner

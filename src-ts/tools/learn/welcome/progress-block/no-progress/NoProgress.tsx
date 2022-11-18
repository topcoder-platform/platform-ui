import { FC } from 'react'

import { LearningHat } from '../../../learn-lib'

import styles from './NoProgress.module.scss'

const NoProgress: FC<{}> = () => (
    <div className={styles.wrap}>
        <div className={styles.icon}>
            <LearningHat />
        </div>
        <h2 className='details'>Happy you’re here!</h2>
        <div className={styles['content-text']}>
            To start learning something new, select a course from the list below. Good Luck!
        </div>
    </div>
)

export default NoProgress

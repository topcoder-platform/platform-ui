import { FC } from 'react'

import { LearningHat } from '../../../learn-lib'

import styles from './InitState.module.scss'

interface InitStateProps {
}

const InitState: FC<InitStateProps> = (props: InitStateProps) => {
    return (
        <div className={styles['wrap']}>
            <div className={styles['icon']}>
                <LearningHat />
            </div>
            <div className={styles['content']}>
                <h2 className='details'>Happy you’re here!</h2>
                <div className={styles['content-text']}>
                    To start learning something new, select a course from the list below. Good Luck!
                </div>
            </div>
        </div>
    )
}

export default InitState

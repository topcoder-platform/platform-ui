import React from 'react'

import { InfoCard } from '../../../../../../lib'
import { workBugHuntConfig } from '../../../../work-lib'
import exampleImg from '../../../../work-lib/work-images/bug-hunt-example.png'

import styles from './DeliverablesInfoCard.module.scss'

const DeliverablesInfoCard: React.FC = () => {

    return (
        <InfoCard>
            <div className={styles.row}>
                <div className={styles.column}>
                    <div className={styles.title}>
                        What will I receive?
                    </div>
                    {workBugHuntConfig.deliverablesDescription}
                </div>
                <div className={styles.column}>
                    <a href={exampleImg} target='_blank' rel='noreferrer'>
                        <img className={styles.exampleImg} src={exampleImg} alt='Example' />
                    </a>
                </div>
            </div>
        </InfoCard>
    )
}

export default DeliverablesInfoCard

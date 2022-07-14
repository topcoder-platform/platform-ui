import React, { FC } from 'react'

import { InfoCard } from '../../../../../../lib'
import { workBugHuntConfig } from '../../../../work-lib'
import exampleImg from '../../../../work-lib/work-images/bug-hunt-example.png'

import styles from './DeliverablesInfoCard.module.scss'

interface DeliverablesInfoCardProps {
    isMobile: boolean
}

const DeliverablesInfoCard: FC<DeliverablesInfoCardProps> = ({ isMobile }) => {

    const title: string = 'What will I receive?'

    return (
        <InfoCard
            defaultOpen={!isMobile}
            isCollapsible={isMobile}
            title={isMobile ? title : undefined}
        >
            <div className={styles.row}>
                <div className={styles.column}>
                    {!isMobile && (
                        <div className={styles.title}>
                            {title}
                        </div>
                    )}
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

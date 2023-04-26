import React, { FC } from 'react'

import { InfoCard } from '../../../../../../lib'
import {
    bugHuntExample1Img,
    bugHuntExample1Pdf,
    bugHuntExample2Img,
    bugHuntExample2Pdf,
    bugHuntExample3Img,
    bugHuntExample3Pdf,
    bugHuntExample4Img,
    bugHuntExample4Pdf,
    workBugHuntConfig,
} from '../../../../work-lib'

import styles from './DeliverablesInfoCard.module.scss'

interface DeliverablesInfoCardProps {
    isMobile: boolean
}

const DeliverablesInfoCard: FC<DeliverablesInfoCardProps> = props => {

    const title: string = 'What will I receive?'

    return (
        <InfoCard
            defaultOpen={!props.isMobile}
            isCollapsible={props.isMobile}
            title={props.isMobile ? title : undefined}
        >
            <div className={styles.row}>
                <div className={styles.column}>
                    {!props.isMobile && (
                        <div className={styles.title}>
                            {title}
                        </div>
                    )}
                    {workBugHuntConfig.deliverablesDescription}
                </div>
                <div className={styles.column}>
                    <div className={styles.exampleImgContainer}>
                        <a href={bugHuntExample1Pdf} target='_blank' rel='noreferrer'>
                            <img className={styles.exampleImg} src={bugHuntExample1Img} alt='Example 1' />
                        </a>
                        <a href={bugHuntExample2Pdf} target='_blank' rel='noreferrer'>
                            <img className={styles.exampleImg} src={bugHuntExample2Img} alt='Example 2' />
                        </a>
                        <a href={bugHuntExample3Pdf} target='_blank' rel='noreferrer'>
                            <img className={styles.exampleImg} src={bugHuntExample3Img} alt='Example 3' />
                        </a>
                        <a href={bugHuntExample4Pdf} target='_blank' rel='noreferrer'>
                            <img className={styles.exampleImg} src={bugHuntExample4Img} alt='Example 4' />
                        </a>
                    </div>
                </div>
            </div>
        </InfoCard>
    )
}

export default DeliverablesInfoCard

import { FC } from 'react'

import { Collapsible } from '~/libs/ui'
import { ratingToCSScolor } from '~/libs/core'

import { ModalTriggerButton } from '../ModalTriggerButton'

import styles from './QAActivity.module.scss'

interface DSActivityProps {
    handleShowBugHuntModal: () => void
    handleShowTestScenModal: () => void
    bugHuntWins: number | undefined
    testScenRating: number | undefined
}

const QAActivity: FC<DSActivityProps> = (props: DSActivityProps) => (
    <Collapsible
        header={<h4>QUALITY ASSURANCE</h4>}
        containerClass={styles.activitySection}
    >
        <div className={styles.contentGrid}>
            {
                !!props.bugHuntWins && (
                    <div className={styles.content}>
                        <span>Bug Hunt</span>
                        <div className={styles.progress}>
                            <div className={styles.progressValue}>
                                {props.bugHuntWins}
                                {' '}
                                WINS
                            </div>
                            <ModalTriggerButton onClick={props.handleShowBugHuntModal} />
                        </div>
                    </div>
                )
            }
            {
                !!props.testScenRating && (
                    <div className={styles.content}>
                        <span>Test Scenarios</span>
                        <div className={styles.progress}>
                            <div className={styles.progressValue} style={ratingToCSScolor(props.testScenRating)}>
                                {props.testScenRating || 'NO'}
                                {' '}
                                RATING
                            </div>
                            <ModalTriggerButton onClick={props.handleShowTestScenModal} />
                        </div>
                    </div>
                )
            }
        </div>
    </Collapsible>
)

export default QAActivity

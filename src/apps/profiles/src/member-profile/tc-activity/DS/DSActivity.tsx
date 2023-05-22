import { FC } from 'react'

import { Collapsible } from '~/libs/ui'
import { ratingToCSScolor } from '~/libs/core'

import { ModalTriggerButton } from '../ModalTriggerButton'

import styles from './DSActivity.module.scss'

interface DSActivityProps {
    handleShowSRMModal: () => void
    handleShowDSModal: () => void
    mmRating: number
    srmRating: number
}

const DSActivity: FC<DSActivityProps> = (props: DSActivityProps) => (
    <Collapsible
        header={<h4>DATA SCIENCE</h4>}
        containerClass={styles.activitySection}
    >
        <div className={styles.contentGrid}>
            <div className={styles.content}>
                <span>SRM</span>
                <div className={styles.progress}>
                    <div className={styles.progressValue} style={ratingToCSScolor(props.srmRating)}>
                        {props.srmRating}
                        {' '}
                        RATING
                    </div>
                    <ModalTriggerButton onClick={props.handleShowSRMModal} />
                </div>
            </div>
            <div className={styles.content}>
                <span>Marathon Match</span>
                <div className={styles.progress}>
                    <div className={styles.progressValue} style={ratingToCSScolor(props.mmRating)}>
                        {props.mmRating || 'NO'}
                        {' '}
                        RATING
                    </div>
                    <ModalTriggerButton onClick={props.handleShowDSModal} />
                </div>
            </div>
        </div>
    </Collapsible>
)

export default DSActivity

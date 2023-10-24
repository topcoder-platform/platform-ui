import { FC } from 'react'

import { BaseModal } from '~/libs/ui'
import { UserStats } from '~/libs/core'

import styles from './CopilotDetailsModal.module.scss'

interface CopilotDetailsModalProps {
    onClose: () => void
    copilotDetails: UserStats['COPILOT']
}

const CopilotDetailsModal: FC<CopilotDetailsModalProps> = (props: CopilotDetailsModalProps) => (
    <BaseModal
        onClose={props.onClose}
        open
        size='lg'
        title='COPILOT'
    >
        <div className={styles.container}>
            <div className={styles.contentItem}>
                <span className='member-stat-value'>{props.copilotDetails?.activeContests}</span>
                Active Challenges
            </div>
            <div className={styles.contentItem}>
                <span className='member-stat-value'>{props.copilotDetails?.activeProjects}</span>
                Active Projects
            </div>
            <div className={styles.contentItem}>
                <span className='member-stat-value'>{props.copilotDetails?.contests}</span>
                Total Challenges
            </div>
            <div className={styles.contentItem}>
                <span className='member-stat-value'>{props.copilotDetails?.projects}</span>
                Total Projects
            </div>
            <div className={styles.contentItem}>
                <span className='member-stat-value'>
                    {props.copilotDetails?.fulfillment}
                    %
                </span>
                Fulfillment
            </div>
        </div>
    </BaseModal>
)

export default CopilotDetailsModal

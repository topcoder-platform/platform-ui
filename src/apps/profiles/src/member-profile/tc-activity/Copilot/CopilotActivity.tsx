import { FC } from 'react'

import { Collapsible } from '~/libs/ui'
import { UserStats } from '~/libs/core'

import { ModalTriggerButton } from '../ModalTriggerButton'

import styles from './CopilotActivity.module.scss'

interface CopilotActivityProps {
    handleShowCopilotModal: () => void
    copilotData: UserStats['COPILOT']
}

const CopilotActivity: FC<CopilotActivityProps> = (props: CopilotActivityProps) => (
    <Collapsible header={<h4>SPECIALIZED ROLES</h4>}>
        <div className={styles.content}>
            <span>Copilot</span>
            <div className={styles.progress}>
                <div className={styles.progressValue}>
                    {props.copilotData?.fulfillment}
                    % FULFILLMENT
                </div>
                <ModalTriggerButton onClick={props.handleShowCopilotModal} />
            </div>
        </div>
    </Collapsible>
)

export default CopilotActivity

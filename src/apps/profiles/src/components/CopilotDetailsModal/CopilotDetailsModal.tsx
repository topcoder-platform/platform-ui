import { FC } from "react"
import { BaseModal } from "~/libs/ui"
import { UserStats } from "~/libs/core"

import styles from "./CopilotDetailsModal.module.scss"

interface CopilotDetailsModalProps {
    isCopilotDetailsOpen: boolean
    onClose: () => void
    copilotDetails: UserStats['COPILOT']
}

const CopilotDetailsModal: FC<CopilotDetailsModalProps> = (props: CopilotDetailsModalProps) => {
    const { isCopilotDetailsOpen, onClose, copilotDetails } = props

    return (
        <BaseModal
            onClose={onClose}
            open={isCopilotDetailsOpen}
            size='lg'
            title="COPILOT"
        >
            <div className={styles.container}>
                <div className={styles.contentItem}>
                    <span className="member-stat-value">{copilotDetails?.activeContests}</span>
                    Active Challenges
                </div>
                <div className={styles.contentItem}>
                    <span className="member-stat-value">{copilotDetails?.activeProjects}</span>
                    Active Projects
                </div>
                <div className={styles.contentItem}>
                    <span className="member-stat-value">{copilotDetails?.contests}</span>
                    Total Challenges
                </div>
                <div className={styles.contentItem}>
                    <span className="member-stat-value">{copilotDetails?.projects}</span>
                    Total Projects
                </div>
                <div className={styles.contentItem}>
                    <span className="member-stat-value">{copilotDetails?.fulfillment}%</span>
                    Fulfillment
                </div>
            </div>
        </BaseModal>
    )
}

export default CopilotDetailsModal

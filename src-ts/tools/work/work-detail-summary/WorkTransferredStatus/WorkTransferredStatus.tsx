import { FC } from 'react'

import styles from './WorkTransferredStatus.module.scss'

const WorkTransferredStatus: FC<{}> = () => (
    <div className={styles.wrap}>
        <h3>Transferred</h3>
        <p>
            <div className={styles.line}>
                We have a few outstanding questions that will help us better understand the work and scope before we can launch your work on our platform.
            </div>

            <div className={styles.line}>
                A Topcoder Solutions Expert will reach out to you via email with questions about your work request.
            </div>

            <div className={styles.line}>
                <strong>
                    Please note, the charge to your credit card has been put on hold automatically for you.
                </strong>
            </div>

            <div className={styles.line}>
                Thank you!<br />
                The Topcoder Team
            </div>
        </p>
    </div>
)

export default WorkTransferredStatus

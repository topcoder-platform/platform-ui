import { WorkStatus } from '../../lib/work-provider'

import styles from './WorkStatusItem.module.scss'

export interface WorkStatusItemProps {
    workStatus?: WorkStatus
}

const WorkStatusItem: (props: WorkStatusItemProps) => JSX.Element
    = (props: WorkStatusItemProps): JSX.Element => {

        if (!props.workStatus) {
            return <></>
        }

        const statusKey: (keyof typeof WorkStatus) | undefined = Object.entries(WorkStatus)
            .find(([, value]) => value === props.workStatus)
            ?.[0] as keyof typeof WorkStatus

        return (
            <div className={styles['status-container']}>
                <div className={styles[statusKey]} />
                <div className={styles['small-tab']}>
                    {props.workStatus}
                </div>
            </div>
        )
    }

export default WorkStatusItem

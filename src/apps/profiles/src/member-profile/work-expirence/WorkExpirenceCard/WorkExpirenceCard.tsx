import { FC } from 'react'
import moment from 'moment'

import { UserTrait } from '~/libs/core'

import styles from './WorkExpirenceCard.module.scss'

interface WorkExpirenceCardProps {
    work: UserTrait
}

const WorkExpirenceCard: FC<WorkExpirenceCardProps> = (props: WorkExpirenceCardProps) => (
    <div className={styles.workExpirenceCard}>
        <div className={styles.workExpirenceCardHeader}>
            <div className={styles.workExpirenceCardHeaderLeft}>
                <p className='body-main-bold'>
                    {props.work.position}
                    ,
                    {' '}
                    {props.work.industry}
                </p>
                <p>
                    {props.work.company}
                    ,
                    {' '}
                    {props.work.cityTown}
                </p>
            </div>
            {
                props.work.timePeriodFrom || props.work.timePeriodTo || props.work.working ? (
                    <div className={styles.workExpirenceCardHeaderRight}>
                        <p>
                            {props.work.timePeriodFrom ? moment(props.work.timePeriodFrom)
                                .format('MM/YYYY') : ''}
                            {props.work.timePeriodFrom && (props.work.timePeriodTo || props.work.working) ? ' - ' : ''}
                            {props.work.timePeriodTo ? moment(props.work.timePeriodTo)
                                .format('MM/YYYY') : (props.work.working ? 'Present' : '')}
                        </p>
                    </div>
                ) : undefined
            }
        </div>
    </div>
)

export default WorkExpirenceCard

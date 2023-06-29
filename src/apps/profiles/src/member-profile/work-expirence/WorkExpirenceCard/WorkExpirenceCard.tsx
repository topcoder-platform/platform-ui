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
            <div className={styles.workExpirenceCardHeaderRight}>
                <p>
                    {moment(props.work.timePeriodFrom)
                        .format('YYYY')}
                    {' '}
                    -
                    {' '}
                    {props.work.timePeriodTo ? moment(props.work.timePeriodTo)
                        .format('YYYY') : 'Present'}
                </p>
            </div>
        </div>
        {/* <div className={styles.workExpirenceCardBody}>
                                <p>{props.work.properties?.description}</p>
                            </div> */}
    </div>
)

export default WorkExpirenceCard

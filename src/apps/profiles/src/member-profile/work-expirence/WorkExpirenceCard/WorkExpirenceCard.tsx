import { FC } from 'react'
import classNames from 'classnames'
import moment from 'moment'

import { UserTrait } from '~/libs/core'
import { getIndustryOptionLabel } from '~/libs/shared'

import styles from './WorkExpirenceCard.module.scss'

interface WorkExpirenceCardProps {
    work: UserTrait
    isModalView?: boolean
}

const WorkExpirenceCard: FC<WorkExpirenceCardProps> = (props: WorkExpirenceCardProps) => (
    <div className={classNames(styles.workExpirenceCard, props.isModalView ? styles.workExpirenceCardModalView : '')}>
        <div className={styles.workExpirenceCardHeader}>
            <div className={styles.workExpirenceCardHeaderLeft}>
                <p className='body-main-bold'>
                    {props.work.position}
                    {props.work.industry ? `, ${getIndustryOptionLabel(props.work.industry)}` : undefined}
                </p>
                <p>
                    {props.work.company}
                    {props.work.cityTown ? `, ${props.work.cityTown}` : undefined}
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

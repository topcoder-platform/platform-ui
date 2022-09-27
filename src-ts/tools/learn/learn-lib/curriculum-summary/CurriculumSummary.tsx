import { FC } from 'react'

import { IconOutline } from '../../../../lib'
import { LearnCourse } from '../courses-provider'

import styles from './CurriculumSummary.module.scss'

interface CurriculumSummaryProps {
    completionHours?: LearnCourse['estimatedCompletionTime']
    moduleCount?: number
}

const CurriculumSummary: FC<CurriculumSummaryProps> = (props: CurriculumSummaryProps) => {
    const hasTimeEstimate: boolean = props.completionHours?.value !== 0

    return (
        <div className={styles['summary']}>
            <div className={styles['stat-item']}>
                <div className={styles['icon']}>
                    <IconOutline.DocumentTextIcon />
                </div>
                <div className='sub'>
                    <h3 className={styles['count']}>
                        {props.moduleCount ?? 0}
                    </h3>
                    <div className={styles['count-label']}>
                        Modules
                    </div>
                </div>
            </div>
            <div className={styles['stat-item']}>
                <div className={styles['icon']}>
                    <IconOutline.ClockIcon />
                </div>
                <div className='sub'>
                    <h3 className={styles['count']}>
                        {hasTimeEstimate ? props.completionHours?.value : (<>&nbsp;</>)}
                    </h3>
                    <div className={styles['count-label']}>
                        {hasTimeEstimate ? (props.completionHours?.units ?? 'Hours') : 'Various'}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CurriculumSummary

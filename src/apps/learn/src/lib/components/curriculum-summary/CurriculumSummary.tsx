import { FC } from 'react'

import { IconOutline } from '~/libs/ui'

import { LearnCourse } from '../../data-providers'

import styles from './CurriculumSummary.module.scss'

interface CurriculumSummaryProps {
    completionTimeValue?: LearnCourse['estimatedCompletionTimeValue']
    completionTimeUnits?: LearnCourse['estimatedCompletionTimeUnits']
    moduleCount?: number
}

const CurriculumSummary: FC<CurriculumSummaryProps> = (props: CurriculumSummaryProps) => {
    const hasTimeEstimate: boolean = props.completionTimeValue !== 0

    return (
        <div className={styles.summary}>
            <div className={styles['stat-item']}>
                <div className={styles.icon}>
                    <IconOutline.DocumentTextIcon />
                </div>
                <div className='sub'>
                    <h3 className={styles.count}>
                        {props.moduleCount ?? 0}
                    </h3>
                    <div className={styles['count-label']}>
                        Modules
                    </div>
                </div>
            </div>
            <div className={styles['stat-item']}>
                <div className={styles.icon}>
                    <IconOutline.ClockIcon />
                </div>
                <div className='sub'>
                    <h3 className={styles.count}>
                        {hasTimeEstimate ? props.completionTimeValue : (<>&nbsp;</>)}
                    </h3>
                    <div className={styles['count-label']}>
                        {hasTimeEstimate ? props.completionTimeUnits : 'Times vary'}
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CurriculumSummary

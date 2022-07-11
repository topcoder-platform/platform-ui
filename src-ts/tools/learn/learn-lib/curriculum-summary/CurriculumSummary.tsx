import { FC } from 'react'

import { IconOutline } from '../../../../lib'
import { LearnCourse } from '../courses-provider'

import styles from './CurriculumSummary.module.scss'

interface CurriculumSummaryProps {
    completionHours?: number
    moduleCount?: number
}

const CurriculumSummary: FC<CurriculumSummaryProps> = (props: CurriculumSummaryProps) => {
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
                        {props.completionHours ?? 0}
                    </h3>
                    <div className={styles['count-label']}>
                        Hours
                    </div>
                </div>
            </div>
        </div>
    )
}

export default CurriculumSummary

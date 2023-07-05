import { FC } from 'react'
import moment from 'moment'

import { UserTrait } from '~/libs/core'

import styles from './EducationCard.module.scss'

interface EducationCardProps {
    education: UserTrait
}

const EducationCard: FC<EducationCardProps> = (props: EducationCardProps) => (
    <div className={styles.educationCard}>
        <div className={styles.educationCardHeader}>
            <div className={styles.educationCardHeaderLeft}>
                <p className='body-main-bold'>
                    {props.education.major}
                </p>
                <p>
                    {props.education.schoolCollegeName}
                </p>
            </div>
            {
                props.education.timePeriodFrom || props.education.timePeriodTo ? (
                    <div className={styles.educationCardHeaderRight}>
                        <p>
                            {props.education.timePeriodFrom ? moment(props.education.timePeriodFrom)
                                .format('MM/YYYY') : ''}
                            {' '}
                            -
                            {' '}
                            {props.education.timePeriodTo ? moment(props.education.timePeriodTo)
                                .format('MM/YYYY') : (props.education.graduated ? 'Graduated' : '')}
                        </p>
                    </div>
                ) : undefined
            }
        </div>
    </div>
)

export default EducationCard

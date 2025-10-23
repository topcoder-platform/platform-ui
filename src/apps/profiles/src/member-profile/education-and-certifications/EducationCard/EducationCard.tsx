import { FC } from 'react'
import classNames from 'classnames'

import { UserTrait } from '~/libs/core'

import styles from './EducationCard.module.scss'

interface EducationCardProps {
    education: UserTrait
    isModalView?: boolean
}

const EducationCard: FC<EducationCardProps> = (props: EducationCardProps) => (
    <div className={classNames(styles.educationCard, props.isModalView ? styles.educationCardModalView : '')}>
        <div className={styles.educationCardHeader}>
            <div className={styles.educationCardHeaderLeft}>
                <p className='body-main-bold'>
                    {props.education.degree}
                </p>
                <p>
                    {props.education.collegeName}
                </p>
            </div>
            {
                props.education.endYear ? (
                    <div className={styles.educationCardHeaderRight}>
                        <p>
                            {props.education.endYear}
                        </p>
                    </div>
                ) : undefined
            }
        </div>
    </div>
)

export default EducationCard

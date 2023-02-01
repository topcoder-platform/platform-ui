import { FC } from 'react'
import classNames from 'classnames'

import { TCACertificateType } from '../../../../learn-lib'
import CurriculumCard from '../CurriculumCard'

import styles from './AssessmentCard.module.scss'

interface AssessmentCardProps {
    trackType: TCACertificateType
    title: string
}

const AssessmentCard: FC<AssessmentCardProps> = (props: AssessmentCardProps) => (
    <CurriculumCard
        className={styles.card}
        badgeTrackType={props.trackType}
        title={props.title}
        cta={(
            <h4 className={classNames('details', styles.cta)}>Coming Soon</h4>
        )}
        content={(
            <>
                <div className={styles.content}>
                    <div className={styles.tag}>
                        <span className='label'>Assessment</span>
                    </div>
                    <div className='quote-small'>
                        Exclusive access to Assessments to further demonstrate your skills
                    </div>
                </div>
            </>
        )}
    />
)

export default AssessmentCard

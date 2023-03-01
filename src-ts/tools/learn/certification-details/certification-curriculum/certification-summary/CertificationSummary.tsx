import { FC } from 'react'

import { IconSolid } from '../../../../../lib'
import { CertificateBadgeIcon, TCACertification } from '../../../learn-lib'

import styles from './CertificationSummary.module.scss'

interface CertificationSummaryProps {
    certification: TCACertification
    isCompleted?: boolean
}

const CertificationSummary: FC<CertificationSummaryProps> = (props: CertificationSummaryProps) => (
    <div className={styles.wrap}>
        <CertificateBadgeIcon
            type={props.certification.certificationCategory.track}
            level={props.certification.learnerLevel}
        />
        <div className='body-large-bold'>
            <h4 className='details'>Certification</h4>
            <span>
                {props.certification.title}
            </span>
        </div>
        {props.isCompleted && (
            <div className={styles.completedIcon}>
                <IconSolid.CheckCircleIcon />
            </div>
        )}
    </div>
)

export default CertificationSummary

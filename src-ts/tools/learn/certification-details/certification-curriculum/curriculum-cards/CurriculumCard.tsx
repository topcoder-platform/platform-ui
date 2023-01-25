import { FC, ReactNode } from 'react'

import { CourseBadge, LearnCertificateTrackType } from '../../../learn-lib'

import styles from './CurriculumCard.module.scss'

interface CurriculumCardProps {
    bradgeTrackType: LearnCertificateTrackType
    title: ReactNode
    cta: ReactNode
    content: ReactNode
}

const CurriculumCard: FC<CurriculumCardProps> = (props: CurriculumCardProps) => (
    <div className={styles.wrap}>
        <CourseBadge
            className={styles.badge}
            type={props.bradgeTrackType ?? 'DEV'}
        />

        <div className={styles.contentWrap}>
            <div className={styles.headline}>
                <div className='body-main-bold'>
                    {props.title ?? 'Responsive Web Design Certification'}
                </div>
                <div className={styles.cta}>
                    {props.cta}
                </div>
            </div>
            <div className={styles.content}>
                {props.content}
            </div>
        </div>
    </div>
)

export default CurriculumCard

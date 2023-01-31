import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { CourseBadge, TcaCertificateType } from '../../../learn-lib'

import styles from './CurriculumCard.module.scss'

interface CurriculumCardProps {
    bradgeTrackType: TcaCertificateType
    className?: string
    content: ReactNode
    cta: ReactNode
    title: ReactNode
}

const CurriculumCard: FC<CurriculumCardProps> = (props: CurriculumCardProps) => (
    <div className={classNames(styles.wrap, props.className)}>
        <div className={classNames(styles.inner, props.className)}>
            <CourseBadge
                className={classNames(styles.badge, 'badge')}
                type={props.bradgeTrackType ?? 'DEV'}
            />

            <div className={styles.contentWrap}>
                <div className={styles.headline}>
                    <div className='body-main-bold'>
                        {props.title ?? 'Responsive Web Design Certification'}
                    </div>
                    <div className={classNames(styles.cta, 'mobile-hide')}>
                        {props.cta}
                    </div>
                </div>
                <div className={styles.content}>
                    {props.content}
                </div>
            </div>
        </div>
        <div className={classNames(styles.bottomCta, 'desktop-hide')}>
            {props.cta}
        </div>
    </div>
)

export default CurriculumCard

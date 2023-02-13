import { FC, ReactNode } from 'react'
import classNames from 'classnames'

import { CourseBadge, TCACertificateType, UserCertificationProgressStatus } from '../../../learn-lib'
import { IconOutline } from '../../../../../lib'

import { ReactComponent as IconProgressSvg } from './progress-icon.svg'
import styles from './CurriculumCard.module.scss'

interface CurriculumCardProps {
    badgeTrackType: TCACertificateType
    className?: string
    content: ReactNode
    cta: ReactNode
    status?: UserCertificationProgressStatus
    title: ReactNode
}

const CurriculumCard: FC<CurriculumCardProps> = (props: CurriculumCardProps) => {
    function renderStatusCol(): ReactNode {
        switch (props.status) {
            case UserCertificationProgressStatus.completed:
                return (
                    <div className={classNames(styles.statusIcon, styles.completed)}>
                        <IconOutline.CheckCircleIcon />
                    </div>
                )
            case UserCertificationProgressStatus.inProgress:
                return (
                    <div className={classNames(styles.statusIcon, styles.inProgress)}>
                        <IconOutline.ClockIcon />
                    </div>
                )
            default:
                return (
                    <div className={styles.statusIcon}>
                        <IconProgressSvg />
                    </div>
                )
        }
    }

    return (
        <div className={classNames(styles.wrap, props.className)}>
            {props.status && (
                <div className={styles.statusCol}>
                    {renderStatusCol()}
                </div>
            )}
            <div className={classNames(styles.inner, props.className)}>
                <CourseBadge
                    className={classNames(styles.badge, 'badge')}
                    type={props.badgeTrackType ?? 'DEV'}
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
            <div className={styles.bottomActions}>
                <div className={styles.bottomCta}>
                    {props.cta}
                </div>
                {props.status && (
                    <div className={styles.statusBox}>
                        {renderStatusCol()}
                    </div>
                )}
            </div>
        </div>
    )
}

export default CurriculumCard

import { FC } from 'react'

import { LearnCertificateTrackType } from '../all-certifications-provider'

import { getBadge } from './badges.functions'
import styles from './CourseBadge.module.scss'

interface CourseBadgeProps {
    type: LearnCertificateTrackType
}

const CourseBadge: FC<CourseBadgeProps> = (props: CourseBadgeProps) => {
    const Badge: ReturnType<typeof getBadge> = getBadge(props.type)

    return (
        <div className={styles['wrap']}>
            <Badge />
        </div>
    )
}

export default CourseBadge

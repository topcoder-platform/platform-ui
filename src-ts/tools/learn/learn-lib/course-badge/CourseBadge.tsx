import { FC, SVGProps } from 'react'

import { LearnCertificateTrackType } from '../all-certifications-provider'

import { getBadge, getBadgeImg } from './badges.functions'
import styles from './CourseBadge.module.scss'

interface CourseBadgeProps {
    asImg?: boolean
    type: LearnCertificateTrackType
}

const CourseBadge: FC<CourseBadgeProps> = (props: CourseBadgeProps) => {
    if (props.asImg) {
        const badgeImg: string = getBadgeImg(props.type)
        return (
            <img src={badgeImg} alt={props.type} />
        )
    }
    const Badge: FC<SVGProps<SVGSVGElement>> = getBadge(props.type)

    return (
        <div className={styles['wrap']}>
            <Badge />
        </div>
    )
}

export default CourseBadge

import classNames from 'classnames'
import { FC } from 'react'

import { CertificateTrackType } from '../certificate-track-type.enum'

import { ReactComponent as CourseBadgeSvg } from './course-badge.svg'
import styles from './CourseBadge.module.scss'

interface CourseBadgeProps {
    type: CertificateTrackType
}

const CourseBadge: FC<CourseBadgeProps> = (props: CourseBadgeProps) => {

    return (
        <div className={classNames(styles['wrap'], `theme-${props.type.toLowerCase()}`)}>
            <CourseBadgeSvg />
        </div>
    )
}

export default CourseBadge

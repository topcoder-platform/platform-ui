import { FC, SVGProps } from 'react'
import classNames from 'classnames'

import { TCACertificateType } from '../data-providers'

import { getBadge, getBadgeImg } from './badges.functions'
import styles from './CourseBadge.module.scss'

interface CourseBadgeProps {
    asImg?: boolean
    className?: string
    type: TCACertificateType
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
        <div className={classNames(props.className, styles.wrap)}>
            <Badge />
        </div>
    )
}

export default CourseBadge

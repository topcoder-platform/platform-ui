import { FC, SVGProps } from 'react'
import classNames from 'classnames'

import { TcaCertificateType, TCACertificationLearnLevel } from '../../data-providers'

import { getCertBadgeIcon } from './badges'
import styles from './CertBadgeIcon.module.scss'

interface CertBadgeIconProps {
    type: TcaCertificateType
    level: TCACertificationLearnLevel
}

const CertificateBadgeIcon: FC<CertBadgeIconProps> = (props: CertBadgeIconProps) => {
    const Icon: FC<SVGProps<SVGSVGElement>> = getCertBadgeIcon(props.type)

    return (
        <Icon className={classNames(styles.iconse, (props.level ?? '').toLowerCase())} />
    )
}

export default CertificateBadgeIcon

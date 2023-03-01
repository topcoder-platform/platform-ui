import { FC } from 'react'
import classNames from 'classnames'

import { TCACertificateType } from '../../../data-providers'

import { ReactComponent as BackgroundSvg } from './certificate-bg.svg'
import styles from './CertificateBackground.module.scss'

interface CertificateBackgroundProps {
    className?: string
    certType: TCACertificateType
}

const CertificateBackground: FC<CertificateBackgroundProps> = (props: CertificateBackgroundProps) => (
    <BackgroundSvg
        className={classNames(props.className, styles.bg, (props.certType ?? '').toLowerCase())}
    />
)

export default CertificateBackground

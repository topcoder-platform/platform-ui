import { FC } from 'react'
import classNames from 'classnames'

import { LearnCertificateTrackType } from '../../../../lib'

import styles from './CertificateBgPattern.module.scss'

interface CertificateBgPatternProps {
    type: LearnCertificateTrackType
}

const CertificateBgPattern: FC<CertificateBgPatternProps> = (props: CertificateBgPatternProps) => (
    <div className={classNames(styles.wrap, `theme-${props.type.toLowerCase()}`)}>
        <div className='pattern-bg' />
        <div className='wave-bg' />
    </div>
)

export default CertificateBgPattern

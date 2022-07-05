import classNames from 'classnames'
import { FC } from 'react'

import styles from './CertificateBgPattern.module.scss'

interface CertificateBgPatternProps {
    type: 'QA'|'DEV'|'DATASCIENCE'|'DESIGN'
}

const CertificateBgPattern: FC<CertificateBgPatternProps> = (props: CertificateBgPatternProps) => {

    return (
        <div className={classNames(styles['wrap'], `theme-${props.type.toLowerCase()}`)} />
    )
}

export default CertificateBgPattern

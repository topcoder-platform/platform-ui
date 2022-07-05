import classNames from 'classnames'
import { FC } from 'react'

import styles from './CertificateBgPattern.module.scss'

interface CertificateBgPatternProps {
    type: 'QA'|'DEV'|'DATASCIENCE'|'DESIGN'
}

const CertificateBgPattern: FC<CertificateBgPatternProps> = (props: CertificateBgPatternProps) => {

    return (
        <div className={classNames(styles['wrap'], `theme-${props.type.toLowerCase()}`)}>
            <div className="pattern-bg"></div>
            <div className="wave-bg"></div>
        </div>
    )
}

export default CertificateBgPattern

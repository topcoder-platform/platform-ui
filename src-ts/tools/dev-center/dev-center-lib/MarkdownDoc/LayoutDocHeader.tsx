import * as React from 'react'

import styles from './LayoutDocHeader.module.scss'

interface LayoutDocHeaderProps {
    subtitle?: string
    title?: string
}

const LayoutDocHeader: React.FC<LayoutDocHeaderProps> = props => (
    <header>
        <h1 className={styles.title}>{props.title}</h1>
        <hr className={styles.divider} />
        <h2 className={styles.subtitle}>{props.subtitle}</h2>
    </header>
)

export default LayoutDocHeader

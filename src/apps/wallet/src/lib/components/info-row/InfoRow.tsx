import React from 'react'

import styles from './InfoRow.module.scss'

interface InfoRowProps {
    title: string
    value: React.ReactNode
    action?: React.ReactNode
}

const InfoRow: React.FC<InfoRowProps> = (props: InfoRowProps) => (
    <div className={styles['info-row']}>
        <div className={styles.title}>{props.title}</div>
        <div className={styles['value-action-container']}>
            <div className={styles.value}>{props.value}</div>
            {props.action && <div className={styles.action}>{props.action}</div>}
        </div>
    </div>
)

export default InfoRow

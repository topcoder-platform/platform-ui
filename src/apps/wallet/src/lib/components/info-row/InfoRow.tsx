import React from 'react'

import styles from './InfoRow.module.scss'

interface InfoRowProps {
    title: string
    value: React.ReactNode
    action?: React.ReactNode
}

const InfoRow: React.FC<InfoRowProps> = ({ title, value, action }) => {
    return (
        <div className={styles['info-row']}>
            <div className={styles.title}>{title}</div>
            <div className={styles['value-action-container']}>
                <div className={styles.value}>{value}</div>
                {action && <div className={styles.action}>{action}</div>}
            </div>
        </div>
    )
}

export default InfoRow

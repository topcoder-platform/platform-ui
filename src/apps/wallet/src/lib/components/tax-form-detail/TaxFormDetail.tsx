import React from 'react'

import { DownloadIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/solid'

import { IconCheckCircle } from '../../assets/tax-forms'

import styles from './TaxFormDetail.module.scss'

interface TaxFormDetailProps {
    title: string
    description: string
    status: string
    // onDownloadClick: () => void
    // onDeleteClick: () => void
}

const TaxFormDetail: React.FC<TaxFormDetailProps> = (props: TaxFormDetailProps) => (
    <div className={styles.card}>
        <div className={styles.iconContainer}>
            {props.status === 'ACTIVE' && <IconCheckCircle />}
            {props.status !== 'ACTIVE' && <ExclamationCircleIcon className={styles.icon} />}
        </div>

        <div className={styles.content}>
            <div className='large-subtitle-bold'>{props.title}</div>
            <div className='body-main'>{props.description}</div>
        </div>

        <div className={styles.actionItems}>
            <DownloadIcon className={styles.actionButton} />
            <TrashIcon className={styles.actionButton} />
        </div>
    </div>
)

export default TaxFormDetail

import React from 'react'

import { DownloadIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/solid'
import { IconOutline, LinkButton } from '~/libs/ui'

import { IconCheckCircle } from '../../assets/tax-forms'

import styles from './TaxFormDetail.module.scss'

interface TaxFormDetailProps {
    title: string
    description: string
    status: string
    onResendOtpClick?: () => void
    onDownloadClick?: () => void
    onDeleteClick?: () => void
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

        {props.status === 'OTP_PENDING' && (
            <div className={styles.actionItemsStacked}>
                <LinkButton
                    className={styles.warningLabel}
                    label='PENDING OTP VERIFICATION'
                    iconToRight
                    icon={IconOutline.ExclamationCircleIcon}
                    size='md'
                    variant='danger'
                    light={false}
                    link
                    disabled
                />
                <LinkButton
                    className={styles.actionButton}
                    label='RESEND OTP'
                    iconToRight
                    icon={IconOutline.MailIcon}
                    size='md'
                    variant='linkblue'
                    light={false}
                    onClick={props.onResendOtpClick}
                    link
                />
            </div>
        )}

        {props.status === 'ACTIVE' && (
            <div className={styles.actionItems}>
                <DownloadIcon className={styles.actionButton} onClick={props.onDownloadClick} />
                <TrashIcon className={styles.actionButton} onClick={props.onDeleteClick} />
            </div>
        )}
    </div>
)

export default TaxFormDetail

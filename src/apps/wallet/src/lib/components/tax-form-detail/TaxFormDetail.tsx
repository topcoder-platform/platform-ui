import React, { useMemo } from 'react'

import { DownloadIcon, ExclamationCircleIcon, TrashIcon } from '@heroicons/react/solid'
import { ConfirmModal, IconSolid } from '~/libs/ui'

import { IconCheckCircle } from '../../assets/tax-forms'
import { ActionBarItem } from '../action-bar-item'

import styles from './TaxFormDetail.module.scss'

interface ConfirmFlowData {
    title: string;
    action: string;
    content: React.ReactNode | (() => React.ReactNode)
    callback?: () => void;
}

interface TaxFormDetailProps {
    title: string
    description: string
    status: string
    onGetRecipientURL?: () => void
    onResendOtpClick?: () => void
    onDownloadClick?: () => void
    onDeleteClick?: () => void
}

const TaxFormDetail: React.FC<TaxFormDetailProps> = (props: TaxFormDetailProps) => {
    const [confirmFlow, setConfirmFlow] = React.useState<ConfirmFlowData | undefined>(undefined)

    const renderConfirmModalContent = useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    const renderOtpPending = (): JSX.Element => (
        <ActionBarItem
            containerClassName={styles.actionItemsStacked}
            info={{
                className: styles.warningLabel,
                icon: IconSolid.ExclamationCircleIcon,
                text: 'PENDING OTP VERIFICATION',
            }}
            action={{
                className: styles.actionButton,
                icon: IconSolid.MailIcon,
                text: 'Resend OTP',
            }}
            onConfirm={function onOtpPendingConfirm() {
                setConfirmFlow({
                    action: 'Yes',
                    callback: props.onResendOtpClick,
                    content: 'You will receive a new OTP via email.',
                    title: 'Are you sure?',
                })
            }}
        />
    )

    const renderOtpVerified = (): JSX.Element => (
        <ActionBarItem
            containerClassName={styles.actionItemsStacked}
            info={{
                className: styles.warningLabel,
                icon: IconSolid.ExclamationCircleIcon,
                text: 'PENDING SIGNATURE',
            }}
            action={{
                className: styles.actionButton,
                icon: IconSolid.MailIcon,
                text: 'Go to DocuSign page',
            }}
            onConfirm={function onGetRecipientURL() {
                setConfirmFlow({
                    action: 'Yes',
                    callback: props.onGetRecipientURL,
                    content: 'You will be redirected to DocuSign.',
                    title: 'Are you sure?',
                })
            }}
        />
    )

    const renderActive = (): JSX.Element => (
        <div className={styles.actionItems}>
            <DownloadIcon className={`${styles.actionButton} ${styles.downloadIcon}`} onClick={props.onDownloadClick} />
            <TrashIcon
                color='#8C384C'
                className={`${styles.actionButton} ${styles.deleteIcon}`}
                onClick={function confirm() {
                    setConfirmFlow({
                        action: 'Yes',
                        callback: props.onDeleteClick,
                        content: 'Are you sure you want to delete this tax form?',
                        title: 'Delete tax form',
                    })
                }}
            />
        </div>
    )

    return (
        <>
            <div className={styles.card}>
                <div className={styles.iconContainer}>
                    {props.status === 'ACTIVE' && <IconCheckCircle />}
                    {props.status !== 'ACTIVE' && <ExclamationCircleIcon className={styles.icon} />}
                </div>

                <div className={styles.content}>
                    <div className='large-subtitle-bold'>{props.title}</div>
                    <div className='body-main'>{props.description}</div>
                </div>

                {props.status === 'OTP_PENDING' && renderOtpPending()}
                {props.status === 'OTP_VERIFIED' && renderOtpVerified()}
                {props.status === 'ACTIVE' && renderActive()}
            </div>
            {confirmFlow && (
                <ConfirmModal
                    title={confirmFlow.title}
                    action={confirmFlow.action}
                    onClose={function onClose() {
                        setConfirmFlow(undefined)
                    }}
                    onConfirm={function onConfirm() {
                        confirmFlow.callback?.()
                        setConfirmFlow(undefined)
                    }}
                    open={confirmFlow !== undefined}
                >
                    <div>{renderConfirmModalContent}</div>
                </ConfirmModal>
            )}
        </>
    )
}

export default TaxFormDetail

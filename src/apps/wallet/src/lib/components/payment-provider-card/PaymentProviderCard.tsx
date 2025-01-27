import { useMemo, useState } from 'react'

import { CheckCircleIcon } from '@heroicons/react/solid'
import { Button, ConfirmModal, IconOutline, IconSolid, PageDivider } from '~/libs/ui'

import { ActionBarItem } from '../action-bar-item'
import { PaymentProvider } from '../../models/PaymentProvider'
import { ConfirmFlowData } from '../../models/ConfirmFlowData'

import styles from './PaymentProviderCard.module.scss'

interface Detail {
    icon: React.ReactNode
    label: string
    value: string
}

interface PaymentProviderProps {
    provider: PaymentProvider
    logo: React.ReactNode
    details: Detail[]
    onConnectClick?: () => void
    onResendOtpClick?: () => void
    onGoToRegistrationClick?: () => void
    onRemoveProvider?: () => void
}

const PaymentProviderCard: React.FC<PaymentProviderProps> = (props: PaymentProviderProps) => {
    const [confirmFlow, setConfirmFlow] = useState<ConfirmFlowData | undefined>(undefined)

    const renderConfirmModalContent = useMemo(() => {
        if (confirmFlow?.content === undefined) {
            return undefined
        }

        if (typeof confirmFlow?.content === 'function') {
            return confirmFlow?.content()
        }

        return confirmFlow?.content
    }, [confirmFlow])

    const canConnect = props.provider.status === 'NOT_CONNECTED'
    const canCancel = ['OTP_PENDING', 'OTP_VERIFIED', 'VERIFIED', 'CONNECTED'].includes(props.provider.status)

    const renderOtpPending = (): JSX.Element => (
        <ActionBarItem
            containerClassName={styles.actionItemsContainer}
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
            containerClassName={styles.actionItemsContainer}
            info={{
                className: styles.warningLabel,
                icon: IconSolid.ExclamationCircleIcon,
                text: 'PENDING VERIFICATION',
            }}
            action={{
                className: styles.actionButton,
                icon: IconSolid.ExternalLinkIcon,
                text: 'Go to Registration page',
            }}
            onConfirm={function getRegistrationLink() {
                setConfirmFlow({
                    action: 'Yes',
                    callback: props.onGoToRegistrationClick,
                    content: 'You will be redirected to the providers registration page.',
                    title: 'Are you sure?',
                })
            }}
        />
    )

    return (
        <>
            <div className={styles.card}>
                <div className={styles.content}>
                    <div className={styles.header}>
                        <div>{props.logo}</div>
                    </div>

                    {canConnect && <PageDivider />}

                    <div className={`
                        ${styles.detailContainer}
                        ${canConnect ? styles.stackedRows : styles.singleRow}`}
                    >
                        {props.details.map((detail: Detail) => (
                            <div key={detail.label} className={styles.detail}>
                                <div className={styles.iconLabelContainer}>
                                    {detail.icon}
                                    <span className={`${styles.label}`}>{detail.label}</span>
                                </div>
                                <p className={`${styles.value} 'body-main'`}>{detail.value}</p>
                            </div>
                        ))}
                    </div>

                    {canConnect && (
                        <div className={styles.footer}>
                            <Button secondary size='lg' label='Connect' onClick={props.onConnectClick} />
                        </div>
                    )}
                    {canCancel && (
                        <div className={styles.footer}>
                            <Button
                                secondary
                                variant='danger'
                                size='lg'
                                label={`${props.provider.status === 'CONNECTED'
                                    ? 'Delete Connection' : 'Cancel Connection'}`}
                                iconToRight
                                icon={IconOutline.TrashIcon}
                                onClick={function onCancelConnectonClick() {
                                    setConfirmFlow({
                                        action: 'Yes',
                                        callback: props.onRemoveProvider,
                                        content: 'Your payment provider will be disconnected.',
                                        title: 'Are you sure?',
                                    })
                                }}
                            />
                        </div>
                    )}
                </div>
                <div className={styles.actionItems}>
                    {props.provider.status === 'CONNECTED'
                    && <Button label='Connected' disabled iconToRight icon={CheckCircleIcon} />}
                    {props.provider.status === 'OTP_PENDING' && renderOtpPending()}
                    {props.provider.status === 'OTP_VERIFIED' && renderOtpVerified()}
                </div>
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

export default PaymentProviderCard

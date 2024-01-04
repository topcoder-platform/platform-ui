import { Button, PageDivider } from '~/libs/ui'
import { CheckCircleIcon, ExclamationCircleIcon } from '@heroicons/react/solid'

import { PaymentProvider } from '../../models/PaymentProvider'

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
}

const PaymentProviderCard: React.FC<PaymentProviderProps> = (props: PaymentProviderProps) => {
    const canConnect = props.provider.status === 'NOT_CONNECTED'
    const isVerified = props.provider.status === 'VERIFIED'
    const isPending = ['PENDING', 'OTP_VERIFIED'].includes(props.provider.status)

    const PENDING_TO_LABEL_MAP: {
        [key: string]: string
    } = {
        OTP_VERIFIED: 'Verifying',
        PENDING: 'Pending OTP Verification',
    }

    const detailContainerStyle = {
        marginTop: canConnect ? '0px' : '32px',
    }

    return (
        <div className={styles.card}>
            <div className={styles.header}>
                <div>{props.logo}</div>
                {(isVerified || isPending) && (
                    <div className={styles.status}>
                        {isVerified && <Button label='Connected' iconToRight icon={CheckCircleIcon} />}
                        {isPending && (
                            <Button
                                className={styles.verifying}
                                variant='warning'
                                label={PENDING_TO_LABEL_MAP[props.provider.status] ?? 'Verifying'}
                                iconToRight
                                icon={ExclamationCircleIcon}
                            />
                        )}
                    </div>
                )}
            </div>

            {canConnect && <PageDivider />}

            <div
                className={`${styles.detailContainer} ${isVerified ? styles.singleRow : styles.stackedRows}`}
                style={detailContainerStyle}
            >
                {props.details.map((detail: Detail) => (
                    <div key={detail.label} className={styles.detail}>
                        <div className={styles.iconLabelContainer}>
                            {detail.icon}
                            <span className={`${styles.label}`}>{detail.label}</span>
                        </div>
                        <p className={styles.value}>{detail.value}</p>
                    </div>
                ))}
            </div>

            {canConnect && (
                <div className={styles.footer}>
                    <Button secondary size='lg' label='Connect' onClick={props.onConnectClick} />
                </div>
            )}
        </div>
    )
}

export default PaymentProviderCard

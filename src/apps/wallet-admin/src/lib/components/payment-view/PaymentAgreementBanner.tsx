import { FC } from 'react'
import classNames from 'classnames'

import { IconOutline } from '~/libs/ui'

import { PaymentAgreementSummary } from '../../models/WinningDetail'

import {
    formatAgreementBreakdown,
    formatAgreementDifferenceLabel,
    formatAgreementExpectedAmount,
    formatCurrencyAmount,
} from './payment-view.utils'
import styles from './PaymentView.module.scss'

interface PaymentAgreementBannerProps {
    readonly summary: PaymentAgreementSummary
}

const PaymentAgreementBanner: FC<PaymentAgreementBannerProps> = (
    props: PaymentAgreementBannerProps,
) => {
    const breakdown = formatAgreementBreakdown(props.summary)
    const differenceLabel = formatAgreementDifferenceLabel(props.summary)

    return (
        <div
            className={classNames(styles.agreementBanner, {
                [styles.agreementBannerMatch]: props.summary.status === 'match',
                [styles.agreementBannerUnder]: props.summary.status === 'under',
                [styles.agreementBannerOver]: props.summary.status === 'over',
            })}
        >
            <div className={styles.agreementBannerIconColumn}>
                {props.summary.status === 'match' && (
                    <IconOutline.CheckCircleIcon className={styles.agreementBannerIcon} />
                )}
                {props.summary.status === 'under' && (
                    <IconOutline.ExclamationCircleIcon className={styles.agreementBannerIcon} />
                )}
                {props.summary.status === 'over' && (
                    <IconOutline.XCircleIcon className={styles.agreementBannerIcon} />
                )}
            </div>
            <div className={styles.agreementBannerContent}>
                <span className={styles.agreementBannerTitle}>
                    {props.summary.status === 'match'
                        ? 'PAYMENT MATCHES AGREEMENT'
                        : 'PAYMENT DOESN\'T MATCH AGREEMENT'}
                </span>
                <p className={styles.agreementBannerLine}>
                    <strong>Expected:</strong>
                    {' '}
                    {formatAgreementExpectedAmount(props.summary)}
                    {' '}
                    (
                    {breakdown}
                    )
                </p>
                <p className={styles.agreementBannerLine}>
                    <strong>Actual:</strong>
                    {' '}
                    {formatCurrencyAmount(props.summary.actualAmount)}
                    {props.summary.status !== 'match' && (
                        <>
                            {' '}
                            (
                            {differenceLabel}
                            )
                        </>
                    )}
                </p>
            </div>
        </div>
    )
}

export default PaymentAgreementBanner

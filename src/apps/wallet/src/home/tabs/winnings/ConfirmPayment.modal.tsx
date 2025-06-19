/* eslint-disable max-len */
/* eslint-disable react/jsx-no-bind */
import { AxiosError } from 'axios'
import { Link } from 'react-router-dom'
import { toast } from 'react-toastify'
import { FC, useMemo, useState } from 'react'

import { ConfirmModal } from '~/libs/ui'

import { processWinningsPayments } from '../../../lib/services/wallet'
import { WalletDetails } from '../../../lib/models/WalletDetails'
import { Winning } from '../../../lib/models/WinningDetail'
import { nullToZero } from '../../../lib/util'
import { useOtpModal } from '../../../lib/components/otp-modal'

import styles from './Winnings.module.scss'

interface ConfirmPaymentModalProps {
    userEmail: string;
    payments: Winning[]
    walletDetails: WalletDetails
    onClose: (done?: boolean) => void
}

const ConfirmPaymentModal: FC<ConfirmPaymentModalProps> = props => {
    const [otpModal, collectOtp] = useOtpModal(props.userEmail)
    const [isProcessing, setIsProcessing] = useState(false)

    const winningIds = useMemo(() => props.payments.map(p => p.id), [props.payments])
    const totalAmount = useMemo(() => props.payments.reduce((acc, payment) => acc + parseFloat(payment.grossPayment.replace(/[^0-9.-]+/g, '')), 0), [props.payments])
    const taxWithholdAmount = (parseFloat(nullToZero(props.walletDetails.taxWithholdingPercentage ?? '0')) * totalAmount) / 100
    const feesAmount = parseFloat(nullToZero(props.walletDetails.estimatedFees ?? '0'))
    const netAmount = totalAmount - taxWithholdAmount - feesAmount

    const processPayouts = async (otpCode?: string): Promise<void> => {
        setIsProcessing(true)
        if (!otpCode) {
            toast.info('Processing payments...', {
                position: toast.POSITION.BOTTOM_RIGHT,
            })
        }

        try {
            await processWinningsPayments(winningIds, otpCode)
            toast.success('Payments processed successfully!', {
                position: toast.POSITION.BOTTOM_RIGHT,
            })
            props.onClose(true)
        } catch (error) {
            if ((error as any)?.code?.startsWith('otp_')) {
                toast.info((error as any).message)
                const code = await collectOtp((error as any)?.message)
                if (code) {
                    processPayouts(code as string)
                } else {
                    setIsProcessing(false)
                }

                return
            }

            let message = 'Failed to process payments. Please try again later.'

            if (error instanceof AxiosError) {
                message = error.response?.data?.error?.message ?? error.response?.data?.message ?? error.message ?? ''

                message = message.charAt(0)
                    .toUpperCase() + message.slice(1)
            }

            toast.error(message, {
                position: toast.POSITION.BOTTOM_RIGHT,
            })
        }

        setIsProcessing(false)
    }

    return (
        <>
            <ConfirmModal
                size='lg'
                maxWidth='610px'
                title='Payment Confirmation'
                action='Confirm Payment'
                onClose={() => props.onClose()}
                onConfirm={processPayouts}
                isProcessing={isProcessing}
                open
            >
                <div className={`${styles.processing} body-medium-normal`}>
                    Processing Payment: $
                    {totalAmount.toFixed(2)}
                    {' '}
                </div>
                {props.walletDetails && (
                    <>
                        <div className={styles.breakdown}>
                            <h4>Payment Breakdown:</h4>
                            <ul className={`${styles.breakdownList} body-main`}>
                                <li>
                                    <span>Base amount:</span>
                                    <span>
                                        $
                                        {totalAmount.toFixed(2)}
                                    </span>
                                </li>
                                <li>
                                    <span>
                                        Tax Witholding (
                                        {nullToZero(props.walletDetails.taxWithholdingPercentage)}
                                        %):
                                    </span>
                                    <span>
                                        $
                                        {taxWithholdAmount.toFixed(2)}
                                    </span>
                                </li>
                                <li>
                                    <span>Processing fee:</span>
                                    <span>
                                        $
                                        {feesAmount.toFixed(2)}
                                    </span>
                                </li>
                            </ul>
                            <hr />
                            <div className={`${styles.summary} body-main-bold`}>
                                <span>Net amount after fees:</span>
                                <span>
                                    $
                                    {netAmount.toFixed(2)}
                                </span>
                            </div>
                            {props.walletDetails?.primaryCurrency && props.walletDetails.primaryCurrency !== 'USD' && (
                                <div className={`${styles.alert} body-main-medium`}>
                                    Net amount will be converted to
                                    {' '}
                                    {props.walletDetails.primaryCurrency}
                                    {' '}
                                    with a 2% conversion fee applied.
                                </div>
                            )}
                        </div>
                        <div className={`${styles.taxesFooterRow} body-main`}>
                            You can adjust your payout settings to customize your estimated payment fee
                            and tax withholding percentage in the
                            {' '}
                            <Link to='#payout'>Payout</Link>
                            {' '}
                            section.
                        </div>
                    </>
                )}
            </ConfirmModal>
            {otpModal}
        </>
    )
}

export default ConfirmPaymentModal

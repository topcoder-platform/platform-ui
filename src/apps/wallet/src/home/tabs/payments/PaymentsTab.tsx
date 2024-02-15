/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useState } from 'react'
import { toast } from 'react-toastify'

import { Button, Collapsible, LoadingCircles } from '~/libs/ui'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/solid'

import { Chip, IconDollar, IconSpeed, IconWorld, PayoneerLogo, PayPalLogo } from '../../../lib'
import { PaymentProvider } from '../../../lib/models/PaymentProvider'
import { PaymentProviderCard } from '../../../lib/components/payment-provider-card'
import { OtpModal } from '../../../lib/components/otp-modal'
import { TransactionResponse } from '../../../lib/models/TransactionId'
import {
    confirmPaymentProvider,
    getPaymentProviderRegistrationLink,
    getUserPaymentProviders, removePaymentProvider, resendOtp, setPaymentProvider,
} from '../../../lib/services/wallet'

import { PaymentInfoModal } from './payment-info-modal'
import styles from './PaymentsTab.module.scss'

const PAYMENT_PROVIDER_DETAILS = {
    Payoneer: {
        details: [
            {
                icon: <IconDollar />,
                label: 'FEES',
                value: '$0-$3 + Currency Conversion Rates May Apply',
            },
            {
                icon: <IconWorld />,
                label: 'COUNTRIES',
                value: 'Available in 150+ countries',
            },
            {
                icon: <IconSpeed />,
                label: 'SPEED',
                value: 'Up to 1 Business Day',
            },
        ],
        logo: <PayoneerLogo />,
    },
    Paypal: {
        details: [
            {
                icon: <IconDollar />,
                label: 'FEES',
                value: '3.49% + an international fee (non US) + a fixed fee depending upon currency',
            },
            {
                icon: <IconWorld />,
                label: 'COUNTRIES',
                value: 'Available in 200+ countries',
            },
            {
                icon: <IconSpeed />,
                label: 'SPEED',
                value: 'Up to 1 Business Day',
            },
        ],
        logo: <PayPalLogo />,
    },
}

const PaymentsTab: FC = () => {
    const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<PaymentProvider | undefined>(undefined)
    const [setupRequired, setSetupRequired] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [showAlternateProvider, setShowAlternateProvider] = useState(false)

    const [paymentInfoModalFlow, setPaymentInfoModalFlow] = useState<string | undefined>(undefined)
    const [otpFlow, setOtpFlow] = useState<TransactionResponse | undefined>(undefined)

    const fetchPaymentProviders = async (refresh: boolean = true) => {
        setIsLoading(refresh)

        try {
            const providers = await getUserPaymentProviders()
            if (providers.length === 0) {
                setSetupRequired(true)
            } else {
                setSetupRequired(false)
                setSelectedPaymentProvider(providers[0])
            }

        } catch (apiError) {
            setSelectedPaymentProvider(undefined)
        }

        setIsLoading(false)
    }

    useEffect(() => {
        fetchPaymentProviders()
    }, [])

    useEffect(() => {
        if (selectedPaymentProvider?.status === 'OTP_VERIFIED') {
            const queryParams = new URLSearchParams(window.location.search)
            const code = queryParams.get('code')

            if (code) {
                if (selectedPaymentProvider.type === 'Paypal' && selectedPaymentProvider.transactionId) {
                    confirmPaymentProvider('Paypal', code, selectedPaymentProvider.transactionId)
                        .then((response: any) => {
                            fetchPaymentProviders()
                            toast.success(
                                response.message ?? 'Payment provider added successfully.',
                                { position: toast.POSITION.BOTTOM_RIGHT },
                            )
                        })
                        .catch((err: any) => {
                            toast.error(
                                err.message ?? 'Something went wrong. Please try again.',
                                { position: toast.POSITION.BOTTOM_RIGHT },
                            )
                        })
                }
            }
        }
    }, [selectedPaymentProvider?.status, selectedPaymentProvider?.type, selectedPaymentProvider?.transactionId])

    function renderProviders(): JSX.Element {
        return (
            <div className={styles.providersStacked}>
                <PaymentProviderCard
                    provider={{ description: 'Payoneer', name: 'Payoneer', status: 'NOT_CONNECTED', type: 'Payoneer' }}
                    logo={PAYMENT_PROVIDER_DETAILS.Payoneer.logo}
                    details={PAYMENT_PROVIDER_DETAILS.Payoneer.details}
                    onConnectClick={function onConnectClick() { setPaymentInfoModalFlow('Payoneer') }}
                />
                <PaymentProviderCard
                    provider={{ description: 'PayPal', name: 'Paypal', status: 'NOT_CONNECTED', type: 'Paypal' }}
                    logo={PAYMENT_PROVIDER_DETAILS.Paypal.logo}
                    details={PAYMENT_PROVIDER_DETAILS.Paypal.details}
                    onConnectClick={function onConnectClick() { setPaymentInfoModalFlow('Paypal') }}
                />
            </div>
        )
    }

    function renderConnectedProvider(): JSX.Element | undefined {
        if (selectedPaymentProvider === undefined) return undefined

        return (
            <div className={styles.providerContainer}>
                <h4>Chosen Payment Provider</h4>
                <div className={styles.providersSingleRow}>
                    <PaymentProviderCard
                        provider={selectedPaymentProvider}
                        logo={PAYMENT_PROVIDER_DETAILS[selectedPaymentProvider.type].logo}
                        details={PAYMENT_PROVIDER_DETAILS[selectedPaymentProvider.type].details}
                        onGoToRegistrationClick={async function onGoToRegistrationClick() {
                            const type = selectedPaymentProvider.type
                            if (type === undefined) {
                                toast.error(
                                    'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                                return
                            }

                            try {
                                const response: TransactionResponse = await getPaymentProviderRegistrationLink(type)
                                setOtpFlow({
                                    ...response,
                                    type: 'SETUP_PAYMENT_PROVIDER',
                                })
                            } catch (err: unknown) {
                                toast.error(
                                    (err as Error).message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            }
                        }}
                        onResendOtpClick={async function onResendOtpClick() {
                            const transactionId = selectedPaymentProvider.transactionId
                            if (transactionId === undefined) {
                                toast.error(
                                    'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                                return
                            }

                            try {
                                const response: TransactionResponse = await resendOtp(transactionId)
                                setOtpFlow({
                                    ...response,
                                    type: 'SETUP_PAYMENT_PROVIDER',
                                })
                            } catch (err: unknown) {
                                toast.error(
                                    (err as Error).message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            }
                        }}
                        onRemoveProvider={async function onRemoveProvider() {
                            try {
                                // eslint-disable-next-line max-len
                                const response: TransactionResponse = await removePaymentProvider(selectedPaymentProvider.type)
                                setOtpFlow({
                                    ...response,
                                    type: 'REMOVE_PAYMENT_PROVIDER',
                                })
                                fetchPaymentProviders(false)
                            } catch (err: unknown) {
                                toast.error(
                                    (err as Error).message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            }
                        }}
                    />
                </div>
                <Button
                    className={styles.alternateProviderButton}
                    label={showAlternateProvider ? 'Hide Alternate Provider' : 'Show Alternate Provider'}
                    iconToRight
                    icon={showAlternateProvider ? ArrowUpIcon : ArrowDownIcon}
                    onClick={() => setShowAlternateProvider(!showAlternateProvider)}
                />
                {showAlternateProvider && (
                    <div className={styles.providersSingleRow}>
                        {selectedPaymentProvider.type === 'Payoneer' ? (
                            <PaymentProviderCard
                                provider={{
                                    description: 'PayPal',
                                    name: 'Paypal',
                                    status: 'ALTERNATE',
                                    type: 'Paypal',
                                }}
                                logo={PAYMENT_PROVIDER_DETAILS.Paypal.logo}
                                details={PAYMENT_PROVIDER_DETAILS.Paypal.details}
                            />
                        ) : (
                            <PaymentProviderCard
                                provider={{
                                    description: 'Payoneer',
                                    name: 'Payoneer',
                                    status: 'ALTERNATE',
                                    type: 'Payoneer',
                                }}
                                logo={PAYMENT_PROVIDER_DETAILS.Payoneer.logo}
                                details={PAYMENT_PROVIDER_DETAILS.Payoneer.details}
                            />
                        )}
                    </div>
                )}
            </div>
        )
    }

    return (
        <div className={styles.container}>
            <div className={styles.paymentsHeader}>
                <h3>WITHDRAWAL METHODS</h3>
                {!isLoading && setupRequired && <Chip text='Setup Required' />}
            </div>

            <div className={styles.content}>
                <Collapsible header={<h3>PAYMENT PROVIDER</h3>}>
                    <p>
                        Topcoder is partnered with several payment providers to send payments to our community members.
                        Once a provider is set up, payments will be routed to your selected payment provider at the
                        completion of work. Currently, members can be paid through one of the following providers:
                        Payoneer® or PayPal®.
                    </p>

                    {isLoading && <LoadingCircles />}

                    {!isLoading && selectedPaymentProvider === undefined && renderProviders()}
                    {!isLoading && selectedPaymentProvider !== undefined && renderConnectedProvider()}

                    <p className='body-small'>
                        Provider details are based on the latest information from their official sites; we advise
                        confirming the current terms directly before finalizing your payment option.
                    </p>
                </Collapsible>
            </div>

            {paymentInfoModalFlow && (
                <PaymentInfoModal
                    selectedPaymentProvider={paymentInfoModalFlow}
                    handleModalClose={function closePaymentInfoModal() { setPaymentInfoModalFlow(undefined) }}
                    handlePaymentSelection={async function confirmPaymentProviderSelection(provider: string) {
                        setPaymentInfoModalFlow(undefined)
                        setPaymentProvider(provider)
                            .then((response: TransactionResponse) => {
                                setOtpFlow({
                                    ...response,
                                    type: 'SETUP_PAYMENT_PROVIDER',
                                })
                                fetchPaymentProviders(false)
                            })
                            .catch((err: Error) => {
                                toast.error(
                                    err.message ?? 'Something went wrong. Please try again.',
                                    { position: toast.POSITION.BOTTOM_RIGHT },
                                )
                            })
                    }}
                />
            )}
            {otpFlow && (
                <OtpModal
                    transactionId={otpFlow.transactionId}
                    key={otpFlow.transactionId}
                    userEmail={otpFlow.email}
                    isOpen={otpFlow !== undefined}
                    onClose={function onOtpModalClose() { setOtpFlow(undefined) }}
                    onOtpVerified={function onOtpVerified(data: unknown) {
                        setOtpFlow(undefined)

                        if (otpFlow.type === 'SETUP_PAYMENT_PROVIDER') {
                            const registrationLink = (data as any).registrationLink
                            window.open(registrationLink, '_blank')
                        }

                        if (otpFlow.type === 'REMOVE_PAYMENT_PROVIDER') {
                            setSelectedPaymentProvider(undefined)
                            toast.success(
                                'Payment provider removed successfully.',
                                { position: toast.POSITION.BOTTOM_RIGHT },
                            )
                        }

                        fetchPaymentProviders()
                    }}
                />
            )}
        </div>
    )
}

export default PaymentsTab

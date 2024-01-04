/* eslint-disable @typescript-eslint/explicit-function-return-type */
/* eslint-disable react/jsx-no-bind */
import { FC, useEffect, useState } from 'react'

import { Button, Collapsible, LoadingCircles } from '~/libs/ui'
import { UserProfile } from '~/libs/core'
import { ArrowDownIcon, ArrowUpIcon } from '@heroicons/react/solid'

import { Chip, IconDollar, IconSpeed, IconWorld, PayoneerLogo, PayPalLogo } from '../../../lib'
import { confirmPaymentProvider, getUserPaymentProviders, setPaymentProvider } from '../../../lib/services/wallet'
import { PaymentProvider, SetPaymentProviderResponse } from '../../../lib/models/PaymentProvider'
import { PaymentProviderCard } from '../../../lib/components/payment-provider-card'
import { OtpModal } from '../../../lib/components/otp-modal'

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

interface PaymentsTabProps {
    profile: UserProfile
}

const PaymentsTab: FC<PaymentsTabProps> = (props: PaymentsTabProps) => {
    const [userPaymentProvider, setUserPaymentProvider] = useState<PaymentProvider | undefined>(undefined)
    const [setupRequired, setSetupRequired] = useState(false)
    const [isLoading, setIsLoading] = useState(false)
    const [error, setError] = useState<string | undefined>(undefined)
    const [selectedPaymentProvider, setSelectedPaymentProvider] = useState<string | undefined>(undefined)
    const [providerToSet, setProviderToSet] = useState<string | undefined>(undefined)
    const [transactionId, setTransactionId] = useState<string | undefined>(undefined)
    const [registrationLink, setRegistrationLink] = useState<string | undefined>(undefined)
    const [providerStatus, setProviderStatus] = useState<string | undefined>(undefined)
    const [showAlternateProvider, setShowAlternateProvider] = useState(false)

    const fetchPaymentProviders = async () => {
        setIsLoading(true)
        setError(undefined)

        try {
            const providers = await getUserPaymentProviders()

            const status = providers && providers.length > 0 ? providers[0].status : undefined

            setSetupRequired(providers.length === 0)
            setUserPaymentProvider(status !== undefined ? providers[0] : undefined)
            setProviderStatus(status)
        } catch (apiError) {
            setError('Error fetching payment providers')
            setUserPaymentProvider(undefined)
        }

        setIsLoading(false)
    }

    useEffect(() => {
        fetchPaymentProviders()
    }, [])

    useEffect(() => {
        if (providerStatus === 'OTP_VERIFIED') {
            const queryParams = new URLSearchParams(window.location.search)
            const code = queryParams.get('code')

            if (code) {
                const storedTransactionId = localStorage.getItem('transactionId')
                if (storedTransactionId) {
                    confirmPaymentProvider('Paypal', code, storedTransactionId)
                        .then((response: any) => {
                            console.log(response)
                            fetchPaymentProviders()
                        })
                        .catch((err: any) => {
                            console.log(err)
                        })
                        .finally(() => {
                            localStorage.removeItem('transactionId')
                        })
                }
            }
        }
    }, [providerStatus])

    function onProviderSelected(provider: string): void {
        setSelectedPaymentProvider(provider)
    }

    function renderProviders(): JSX.Element {
        return (
            <div className={styles.providersStacked}>
                <PaymentProviderCard
                    provider={{ description: 'Payoneer', name: 'Payoneer', status: 'NOT_CONNECTED', type: 'Payoneer' }}
                    logo={PAYMENT_PROVIDER_DETAILS.Payoneer.logo}
                    details={PAYMENT_PROVIDER_DETAILS.Payoneer.details}
                    onConnectClick={() => onProviderSelected('Payoneer')}
                />
                <PaymentProviderCard
                    provider={{ description: 'PayPal', name: 'Paypal', status: 'NOT_CONNECTED', type: 'Paypal' }}
                    logo={PAYMENT_PROVIDER_DETAILS.Paypal.logo}
                    details={PAYMENT_PROVIDER_DETAILS.Paypal.details}
                    onConnectClick={() => onProviderSelected('Paypal')}
                />
            </div>
        )
    }

    function renderConnectedProvider(): JSX.Element | undefined {
        if (userPaymentProvider) {
            return (
                <div className={styles.providerContainer}>
                    <h4>Chosen Payment Provider</h4>
                    <div className={styles.providersSingleRow}>
                        <PaymentProviderCard
                            provider={userPaymentProvider}
                            logo={PAYMENT_PROVIDER_DETAILS[userPaymentProvider.type].logo}
                            details={PAYMENT_PROVIDER_DETAILS[userPaymentProvider.type].details}
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
                            {userPaymentProvider.type === 'Payoneer' ? (
                                <PaymentProviderCard
                                    provider={{
                                        description: 'PayPal',
                                        name: 'Paypal',
                                        status: 'NOT_CONNECTED',
                                        type: 'Paypal',
                                    }}
                                    logo={PAYMENT_PROVIDER_DETAILS.Paypal.logo}
                                    details={PAYMENT_PROVIDER_DETAILS.Paypal.details}
                                    onConnectClick={() => onProviderSelected('Paypal')}
                                />
                            ) : (
                                <PaymentProviderCard
                                    provider={{
                                        description: 'Payoneer',
                                        name: 'Payoneer',
                                        status: 'NOT_CONNECTED',
                                        type: 'Payoneer',
                                    }}
                                    logo={PAYMENT_PROVIDER_DETAILS.Payoneer.logo}
                                    details={PAYMENT_PROVIDER_DETAILS.Payoneer.details}
                                    onConnectClick={() => onProviderSelected('Payoneer')}
                                />
                            )}
                        </div>
                    )}
                </div>
            )
        }

        return undefined
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

                    {!isLoading && setupRequired && renderProviders()}
                    {!isLoading && !setupRequired && renderConnectedProvider()}

                    <p className='body-small'>
                        Provider details are based on the latest information from their official sites; we advise
                        confirming the current terms directly before finalizing your payment option.
                    </p>
                </Collapsible>
            </div>

            {selectedPaymentProvider && (
                <PaymentInfoModal
                    selectedPaymentProvider={selectedPaymentProvider}
                    handleModalClose={() => {
                        setSelectedPaymentProvider(undefined)
                    }}
                    handlePaymentSelection={(provider: string) => {
                        setSelectedPaymentProvider(undefined)
                        const details: any = {}

                        if (provider === 'Payoneer') {
                            details.payeeId = `${props.profile.userId}`
                        }

                        setPaymentProvider(details, provider, true)
                            .then((response: SetPaymentProviderResponse) => {
                                localStorage.setItem('transactionId', response.transactionId)
                                setTransactionId(response.transactionId)
                                setRegistrationLink(response.registrationLink)
                                setProviderToSet(provider)
                            })
                            .catch((err: any) => {
                                console.log(err)
                            })
                    }}
                />
            )}
            {providerToSet && transactionId && (
                <OtpModal
                    transactionId={transactionId}
                    isOpen={providerToSet !== undefined}
                    key={providerToSet}
                    onClose={() => {
                        setProviderToSet(undefined)
                    }}
                    onResendClick={() => {}}
                    onOtpVerified={() => {
                        window.open(registrationLink, '_blank')

                        setProviderToSet(undefined)
                        setRegistrationLink(undefined)

                        fetchPaymentProviders()
                    }}
                />
            )}
        </div>
    )
}

export default PaymentsTab

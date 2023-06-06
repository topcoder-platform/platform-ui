/* eslint-disable max-len */
import { Dispatch, FC, SetStateAction, useState } from 'react'
import { bind } from 'lodash'

import { EnvironmentConfig } from '~/config'
import { Button, Collapsible, IconOutline, PageDivider } from '~/libs/ui'
import { UserProfile } from '~/libs/core'

import {
    IconDollar,
    IconSpeed,
    IconWorld,
    PayoneerLogo,
    PayPalLogo,
    SettingSection,
    WesternUnionLogo,
} from '../../../lib'

import { PaymentInfoModal } from './payment-info-modal'
import styles from './PaymentsTab.module.scss'

type PaymentProvider = 'Payoneer' | 'PayPal' | 'Western Union'

const PAYMENT_PROVIDER_KEY: string = 'paymentService'

interface PaymentsTabProps {
    profile: UserProfile
}

const PaymentsTab: FC<PaymentsTabProps> = (props: PaymentsTabProps) => {
    const [selectedPaymentProvider, setSelectedPaymentProvider]: [
        PaymentProvider | undefined, Dispatch<SetStateAction<PaymentProvider | undefined>>
    ] = useState<PaymentProvider | undefined>()

    const [hasEmailedSupport, setHasEmailedSupport]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [wantsToChangePreviousSelection, setWantsToChangePreviousSelection]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [paymentService, setPaymentService]: [string | undefined, Dispatch<SetStateAction<string | undefined>>] = useState(
        localStorage.getItem(`${props.profile.handle}_${PAYMENT_PROVIDER_KEY}`) || undefined,
    )

    function handleSelectPaymentProviderClick(provider: PaymentProvider): void {
        setSelectedPaymentProvider(provider)
    }

    function handleModalClose(): void {
        setSelectedPaymentProvider(undefined)
        setHasEmailedSupport(false)
    }

    function handlePaymentSelection(): void {
        localStorage.setItem(`${props.profile.handle}_${PAYMENT_PROVIDER_KEY}`, selectedPaymentProvider || '')
        setPaymentService(selectedPaymentProvider || '')
        handleModalClose()
    }

    function handleCheckboxChange(): void {
        setHasEmailedSupport(!hasEmailedSupport)
    }

    function handleVisitProviderClick(): Window | null | undefined {
        switch (selectedPaymentProvider) {
            case 'Payoneer': return window.open('https://www.payoneer.com/', '_blank')
            case 'PayPal': return window.open('https://www.paypal.com/cgi-bin/webscr?cmd=_registration-run', '_blank')
            // eslint-disable-next-line max-len
            case 'Western Union': return window.open('https://payee.globalpay.westernunion.com/PayeeManager/BeneficiaryEnrollment/SpecifyPayeeID.aspx?id=9E63C90B520F830246DA2FD728CDAEBF', '_blank')
            default: return undefined
        }
    }

    function handleSelectedProviderChange(): void {
        setWantsToChangePreviousSelection(true)
    }

    function handleSelectionReset(): void {
        setWantsToChangePreviousSelection(false)
        localStorage.removeItem(`${props.profile.handle}_${PAYMENT_PROVIDER_KEY}`)
        setPaymentService(undefined)
    }

    return (
        <div className={styles.container}>
            <div className={styles.paymentsHeader}>
                <h3>PAYMENT SETTINGS</h3>
                <a
                    className={styles.managePaymentsLink}
                    target='_blank'
                    rel='noopener noreferrer'
                    href={`https://community.${EnvironmentConfig.TC_DOMAIN}/PactsMemberServlet?module=PaymentHistory&full_list=false`}
                >
                    MANAGE YOUR PAYMENTS
                    <svg width='14' height='12' viewBox='0 0 14 12' fill='none' xmlns='http://www.w3.org/2000/svg'>
                        <path
                            fillRule='evenodd'
                            clipRule='evenodd'
                            // eslint-disable-next-line max-len
                            d='M7.234.634a.8.8 0 0 1 1.132 0l4.8 4.8a.8.8 0 0 1 0 1.132l-4.8 4.8a.8.8 0 0 1-1.132-1.132L10.67 6.8H1.4a.8.8 0 1 1 0-1.6h9.269L7.234 1.766a.8.8 0 0 1 0-1.132z'
                            fill='#137D60'
                        />
                    </svg>
                </a>
            </div>

            <div className={styles.content}>
                <Collapsible
                    header={<h3>PAYMENT PROVIDER</h3>}
                >
                    <p>
                        Topcoder is partnered with several payment providers to send payments to our community members.
                        Once a provider is set up, payments will be routed to your selected payment provider
                        at the completion of work. Currently, members can be paid through one of the following
                        providers: Payoneer®, PayPal®, or Western Union.
                    </p>

                    {
                        paymentService && !wantsToChangePreviousSelection ? (
                            <SettingSection
                                leftElement={(
                                    <div className={styles.providerSubmittedIcon}>
                                        <IconOutline.CheckCircleIcon />
                                    </div>
                                )}
                                containerClassName={styles.providerSubmitted}
                                title='Payment Provider Detail Submitted'
                                infoText={`You have submitted account details to use ${paymentService} as your payment service provider. Processing may take up to 48 hours.`}
                                actionElement={(
                                    <Button
                                        secondary
                                        size='lg'
                                        label='Change Provider'
                                        onClick={handleSelectedProviderChange}
                                    />
                                )}
                            />
                        ) : undefined
                    }

                    {
                        paymentService && wantsToChangePreviousSelection ? (
                            <div className={styles.confirmSelectionReset}>
                                <p>
                                    <strong className='body-main-bold'>
                                        Your currently selected payment provider is:
                                        {' '}
                                        {paymentService}
                                    </strong>
                                    <br />
                                    <strong className='body-main-bold'>Note: </strong>
                                    You have chosen to change your selected payment provider. This change may take up to 48 hours to be reflected in your account.
                                </p>
                                <Button
                                    secondary
                                    label='Cancel Change'
                                    onClick={handleSelectionReset}
                                />
                            </div>
                        ) : undefined
                    }

                    {
                        !paymentService || wantsToChangePreviousSelection ? (
                            <>
                                <div className={styles.providers}>
                                    <div className={styles.providerCard}>
                                        <PayoneerLogo />
                                        <PageDivider />
                                        <div className={styles.benefitTitle}>
                                            <IconDollar />
                                            <span className='ultra-small-bold'>FEES</span>
                                        </div>
                                        <p>$0–$3 + Currency Conversion Rates May Apply</p>
                                        <div className={styles.benefitTitle}>
                                            <IconWorld />
                                            <span className='ultra-small-bold'>COUNTRIES</span>
                                        </div>
                                        <p>Available in 150+ countries</p>
                                        <div className={styles.benefitTitle}>
                                            <IconSpeed />
                                            <span className='ultra-small-bold'>SPEED</span>
                                        </div>
                                        <p>Up to 1 Business Day</p>
                                        <Button
                                            secondary
                                            size='lg'
                                            label='Select Payoneer'
                                            onClick={bind(handleSelectPaymentProviderClick, this, 'Payoneer')}
                                        />
                                    </div>

                                    <div className={styles.providerCard}>
                                        <PayPalLogo />
                                        <PageDivider />
                                        <div className={styles.benefitTitle}>
                                            <IconDollar />
                                            <span className='ultra-small-bold'>FEES</span>
                                        </div>
                                        <p>3.49% + an international fee (non US) + a fixed fee depending upon currency</p>
                                        <div className={styles.benefitTitle}>
                                            <IconWorld />
                                            <span className='ultra-small-bold'>COUNTRIES</span>
                                        </div>
                                        <p>Available in 200+ countries</p>
                                        <div className={styles.benefitTitle}>
                                            <IconSpeed />
                                            <span className='ultra-small-bold'>SPEED</span>
                                        </div>
                                        <p>Up to 1 Business Day</p>
                                        <Button
                                            secondary
                                            size='lg'
                                            label='Select Paypal'
                                            onClick={bind(handleSelectPaymentProviderClick, this, 'PayPal')}
                                        />
                                    </div>

                                    <div className={styles.providerCard}>
                                        <WesternUnionLogo />
                                        <PageDivider />
                                        <div className={styles.benefitTitle}>
                                            <IconDollar />
                                            <span className='ultra-small-bold'>FEES</span>
                                        </div>
                                        <p>$8 per transaction (your bank may charge additional fees)</p>
                                        <div className={styles.benefitTitle}>
                                            <IconWorld />
                                            <span className='ultra-small-bold'>COUNTRIES</span>
                                        </div>
                                        <p>Available in 200+ countries</p>
                                        <div className={styles.benefitTitle}>
                                            <IconSpeed />
                                            <span className='ultra-small-bold'>SPEED</span>
                                        </div>
                                        <p>Up to 3 Business Day</p>
                                        <Button
                                            secondary
                                            size='lg'
                                            label='Select Western Union'
                                            onClick={bind(handleSelectPaymentProviderClick, this, 'Western Union')}
                                        />
                                    </div>
                                </div>
                                <p className='body-small'>
                                    The information above is gathered from each payment provider&apos;s respective website.
                                    We encourage you to do any additional information gathering you see fit
                                    prior to making a payment provider decision.
                                </p>
                            </>
                        ) : undefined
                    }
                </Collapsible>
            </div>

            {selectedPaymentProvider && (
                <PaymentInfoModal
                    selectedPaymentProvider={selectedPaymentProvider}
                    handleVisitProviderClick={handleVisitProviderClick}
                    handleModalClose={handleModalClose}
                    handleCheckboxChange={handleCheckboxChange}
                    hasEmailedSupport={hasEmailedSupport}
                    handlePaymentSelection={handlePaymentSelection}
                />
            )}
        </div>
    )
}

export default PaymentsTab

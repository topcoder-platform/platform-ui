import { Dispatch, FC, SetStateAction, useState } from 'react'
import { trim } from 'lodash'

import { PaymentIntentResult, Stripe, StripeCardNumberElement, StripeElements } from '@stripe/stripe-js'
import { loadStripe } from '@stripe/stripe-js/pure'
import { CardNumberElement, Elements, useElements, useStripe } from '@stripe/react-stripe-js'

import { Button, IconOutline } from '../../../../../lib'
import { StickySidebar } from '../../../learn-lib'
import { EnvironmentConfig } from '../../../../../config'
import { EnrollPaymentForm } from '../enroll-payment-form'
import {
    createMemberEnrollPaymentAsync,
    MemberEnrollPaymentSheet,
    StripeProduct,
} from '../../../learn-lib/data-providers/payments'

import styles from './EnrollmentSidebar.module.scss'

let stripePromise: Promise<Stripe | null | undefined> | undefined

interface EnrollmentSidebarProps {
    onEnroll: () => Promise<void>
    product: StripeProduct | undefined
}

const EnrollmentSidebar: FC<EnrollmentSidebarProps> = (props: EnrollmentSidebarProps) => {
    const price: string
        = Number((props.product?.default_price.unit_amount || 0) / 100)
            .toFixed(2)

    const [formFieldValues, setFormValues]: [any, Dispatch<SetStateAction<any>>] = useState<any>({
        cardComplete: false,
        cardName: undefined,
        cvvComplete: false,
        expiryComplete: false,
        price: `$${price}`,
        subsContract: false,
    })

    const stripe: Stripe | null = useStripe()
    const elements: StripeElements | null = useElements()

    const [paymentError, setPaymentError]: [string, Dispatch<SetStateAction<string>>] = useState<string>('')
    const [paymentSuccess, setPaymentSuccess]: [boolean, Dispatch<SetStateAction<boolean>>]
        = useState<boolean>(false)

    const [payProcessing, setPayProcessing]: [boolean, Dispatch<SetStateAction<boolean>>] = useState<boolean>(false)

    const tcaMonetizationEnabled: boolean = EnvironmentConfig.REACT_APP_ENABLE_TCA_CERT_MONETIZATION || false

    function onUpdateField(fieldName: string, value: string | boolean): void {
        setFormValues({
            ...formFieldValues,
            [fieldName]: value,
        })
    }

    function isFormValid(): boolean {
        return formFieldValues.cardComplete
            && formFieldValues.cvvComplete
            && formFieldValues.expiryComplete
            && formFieldValues.subsContract
            && trim(formFieldValues.cardName)
    }

    /**
     * Pay for enrollment
     */
    async function onPay(): Promise<void> {
        if (!isFormValid()) {
            return
        }

        setPayProcessing(true)

        try {
            // create the payment
            const paymentSheet: MemberEnrollPaymentSheet = await createMemberEnrollPaymentAsync({
                priceIDs: [props.product?.default_price.id as string],
            })
            // try to confirm to confirm the payment
            // by using the provided card info
            const paymentResult: PaymentIntentResult | undefined
                = await stripe?.confirmCardPayment(paymentSheet.clientSecret, {
                    payment_method: {
                        billing_details: {
                            name: formFieldValues.cardName,
                        },
                        card: elements?.getElement(CardNumberElement) as StripeCardNumberElement,
                    },
                })
            if (!paymentResult?.error) {
                // payment success!
                setPaymentSuccess(true)
                setTimeout(() => {
                    props.onEnroll()
                    setPayProcessing(false)
                }, 1000)
            } else {
                // payment error!
                // eslint-disable-next-line no-console
                console.error('Enroll payment error', paymentResult.error)
                setPaymentError(paymentResult.error.message as string)
                setPayProcessing(false)
            }
        } catch (error: any) {
            // eslint-disable-next-line no-console
            console.error('Enroll payment error', error)
            setPaymentError(error.message || error)
            setPayProcessing(false)
        }
    }

    return (
        <StickySidebar className={tcaMonetizationEnabled ? styles.wrapPayment : styles.wrap}>
            {
                tcaMonetizationEnabled ? (
                    <>
                        <div className={styles.headerPayment}>
                            <div className={styles.priceLabel}>
                                $
                                {price}
                            </div>
                            <span className='strike'>
                                $
                                {props.product?.metadata?.estimatedRetailPrice || ' n/a'}
                            </span>
                            <span className='body-small-bold'>TOTAL PAYMENT</span>
                        </div>
                        <div className={styles.form}>
                            {
                                paymentSuccess ? (
                                    <div className={styles.paymentSuccess}>
                                        <div className={styles.paymentSuccessInner}>
                                            <IconOutline.CheckCircleIcon className={styles.successIcon} />
                                            <span className='body-medium-bold'>Your payment was successful</span>
                                            <p>
                                                You will be redirected to the certification details page
                                                where you can begin your journey!
                                            </p>
                                        </div>
                                    </div>
                                ) : (
                                    <EnrollPaymentForm
                                        formData={formFieldValues}
                                        onUpdateField={onUpdateField}
                                        onPay={onPay}
                                        isFormValid={isFormValid()}
                                        error={paymentError}
                                        isPayProcessing={payProcessing}
                                        price={price}
                                    />
                                )
                            }
                        </div>
                    </>
                ) : (
                    <>
                        <div className={styles.header}>
                            <div className={styles.freeLabel}>FREE</div>
                            <span className='strike'>$20</span>
                        </div>
                        <hr />
                        <div className={styles.form}>
                            <div className={styles.noPaymentBanner}>
                                <h3 className='details'>No payment required</h3>
                                <div className='body-medium'>
                                    Free for a limited time.
                                </div>
                            </div>
                            <Button
                                buttonStyle='primary'
                                onClick={props.onEnroll}
                                label='Complete Enrollment'
                                size='lg'
                            />
                        </div>
                    </>
                )
            }
        </StickySidebar>
    )
}

const PaymentDetailsStripeWrapper: FC<EnrollmentSidebarProps> = (props: EnrollmentSidebarProps) => {

    if (!stripePromise) {
        stripePromise = loadStripe(EnvironmentConfig.STRIPE.API_KEY, {
            apiVersion: EnvironmentConfig.STRIPE.API_VERSION,
        })
    }

    return (
        <Elements stripe={stripePromise as Promise<Stripe>}>
            <EnrollmentSidebar {...props} />
        </Elements>
    )
}

export default PaymentDetailsStripeWrapper

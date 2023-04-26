import { get } from 'lodash'
import React, {
    Dispatch,
    SetStateAction,
    useCallback,
    useContext,
    useState,
} from 'react'
import cn from 'classnames'

import {
    CardCvcElement,
    CardExpiryElement,
    CardNumberElement,
} from '@stripe/react-stripe-js'
import {
    StripeCardCvcElementChangeEvent,
    StripeCardExpiryElementChangeEvent,
    StripeCardNumberElementChangeEvent,
} from '@stripe/stripe-js'

import { Button, OrderContractModal, profileContext, ProfileContextData } from '..'
import { InputText } from '../form/form-groups/form-input'
import { InputWrapper } from '../form/form-groups/form-input/input-wrapper'
import ReactSelect from '../react-select/ReactSelect'

import { COUNTRIES_OPTIONS } from './constants'
import styles from './PaymentForm.module.scss'

interface PaymentFormData {
    country: string
    email: string
    name: string
    orderContract: boolean
    price: string
    zipCode: string
}

interface FieldDirtyState {
    cardCvv: boolean
    cardExpiry: boolean
    cardNumber: boolean
}

interface PaymentFormProps {
    error: boolean
    formData: PaymentFormData
    isFormValid: boolean
    onPay: () => void
    onUpdateField: (fieldName: string, value: string | boolean) => void
}

type CardChangeEvent
    = StripeCardExpiryElementChangeEvent
    | StripeCardNumberElementChangeEvent
    | StripeCardCvcElementChangeEvent

/**
 * This is the payment form component.
 * TODO: Replace the rendering logic of this form
 * to support Form.tsx(instead of rendering the fields individually).
 * This requires ReactSelect to be rendered as part of Form.tsx
 * @param props
 * @returns
 */
const PaymentForm: React.FC<PaymentFormProps> = (props: PaymentFormProps) => {
    const [cardNumberError, setCardNumberError]: [string, Dispatch<string>] = useState<string>('')
    const [cardExpiryError, setCardExpiryError]: [string, Dispatch<string>] = useState<string>('')
    const [cardCVVError, setCardCVVError]: [string, Dispatch<string>] = useState<string>('')
    const { profile }: ProfileContextData = useContext<ProfileContextData>(profileContext)

    const [formState, setFormState]: [FieldDirtyState, Dispatch<SetStateAction<FieldDirtyState>>]
        = useState<FieldDirtyState>({
            cardCvv: false,
            cardExpiry: false,
            cardNumber: false,
        })

    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<boolean>]
        = useState<boolean>(false)

    const getError: (data: any) => string = data => data?.error?.message || ''

    const onOpenOrderContract: (event: React.SyntheticEvent) => void = useCallback(event => {
        event.preventDefault()
        event.stopPropagation()
        setIsOrderContractModalOpen(true)
    }, [])

    const renderCheckboxLabel: () => JSX.Element = () => (
        <div className={styles['checkbox-label']}>
            Yes, I understand and agree to Topcoder’s
            <span className={styles.link} onClick={onOpenOrderContract}>Order Contract</span>
        </div>
    )

    const cardElementOnChange: (fieldName: string, stateUpdater: Dispatch<string>) => (data: CardChangeEvent) => void
        = (fieldName, stateUpdater) => (data: CardChangeEvent) => {
            const error: string = getError(data)
            stateUpdater(error)
            props.onUpdateField(fieldName, data.complete)
            setFormState({
                ...formState,
                [fieldName]: true,
            })
        }

    function hideOrderContractModal(): void {
        setIsOrderContractModalOpen(false)
    }

    function handleFieldUpdate(fieldName: string, dataPath?: string): (event: unknown) => void {
        return (event: unknown) => props.onUpdateField(fieldName, dataPath ? get(event, dataPath) : event)
    }

    return (
        <div className={styles['payment-form']}>
            <OrderContractModal
                isOpen={isOrderContractModalOpen}
                onClose={hideOrderContractModal}
            />
            <div className={styles.label}>Contact Information</div>
            <InputText
                label='Email'
                placeholder='email'
                name='email'
                tabIndex={1}
                type='text'
                onChange={handleFieldUpdate('email', 'target.value')}
                value={profile?.email}
            />

            <div className={styles.label}>Card Information</div>

            <InputWrapper
                className={cn(styles['input-wrapper'], !!cardNumberError && styles.error)}
                label='Card Number'
                tabIndex={2}
                type='text'
                disabled={false}
                error={cardNumberError}
                hideInlineErrors={false}
                dirty={formState.cardNumber}
            >
                <CardNumberElement
                    options={{
                        classes: {
                            base: styles.cardElement,
                        },
                    }}
                    onChange={cardElementOnChange('cardComplete', setCardNumberError)}
                />
            </InputWrapper>

            <div className={styles['date-cvv-wrapper']}>
                <InputWrapper
                    className={cn(styles['input-wrapper'], !!cardExpiryError && styles.error)}
                    label='Date'
                    tabIndex={3}
                    type='text'
                    disabled={false}
                    error={cardExpiryError}
                    dirty={formState.cardExpiry}
                >
                    <CardExpiryElement
                        options={{
                            classes: {
                                base: styles.cardElement,
                            },
                            placeholder: 'MM/YY',
                        }}
                        onChange={cardElementOnChange('expiryComplete', setCardExpiryError)}
                    />
                </InputWrapper>
                <InputWrapper
                    className={cn(styles['input-wrapper'], !!cardCVVError && styles.error)}
                    label='CVC'
                    tabIndex={3}
                    type='text'
                    disabled={false}
                    error={cardCVVError}
                    dirty={formState.cardCvv}
                >
                    <CardCvcElement
                        options={{
                            classes: {
                                base: styles.cardElement,
                            },
                            placeholder: 'CCV',
                        }}
                        onChange={cardElementOnChange('cvvComplete', setCardCVVError)}
                    />
                </InputWrapper>
            </div>

            <InputText
                className={styles['input-wrapper']}
                label='Name On Card'
                placeholder='Enter name on card'
                name='name'
                tabIndex={1}
                type='text'
                onChange={handleFieldUpdate('name', 'target.value')}
                value={`${profile?.firstName} ${profile?.lastName}`}
            />

            <InputWrapper
                className={styles['input-wrapper']}
                label='Country or Region'
                tabIndex={3}
                type='text'
                disabled={false}
            >
                <ReactSelect
                    value={props.formData.country}
                    onChange={handleFieldUpdate('country')}
                    options={COUNTRIES_OPTIONS}
                    style2
                />
            </InputWrapper>

            <InputText
                className={styles['input-wrapper']}
                label='Zip Code'
                placeholder='12345'
                name='zipCode'
                tabIndex={1}
                type='text'
                onChange={handleFieldUpdate('zipCode', 'target.value')}
            />

            <InputText
                label={renderCheckboxLabel()}
                name='order-contract'
                tabIndex={1}
                type='checkbox'
                checked={props.formData.orderContract}
                onChange={handleFieldUpdate('orderContract', 'target.checked')}
            />

            <div className={styles['info-box']}>
                A hold will be placed on your card for the full amount of the project.&nbsp;
                Once your work is live on the Topcoder platform, you will be charged.
            </div>

            {
                props.error && (
                    <div className={styles.error}>
                        Your card was declined. Please try a different card.
                    </div>
                )
            }

            <Button
                className={styles['pay-button']}
                size='lg'
                type='button'
                buttonStyle='primary'
                name='pay-button'
                label={`Pay ${props.formData.price}`}
                disable={!props.isFormValid}
                onClick={props.onPay}
            />
        </div>
    )
}

export default PaymentForm

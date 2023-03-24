import { Dispatch, SetStateAction, useState } from 'react'
import { trim } from 'lodash'
import classNames from 'classnames'

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

import { Button, IconOutline, InputText, LoadingSpinner, OrderContractModal } from '../../../../../lib'
import { InputWrapper } from '../../../../../lib/form/form-groups/form-input/input-wrapper'

import styles from './EnrollPaymentForm.module.scss'

interface PermiumSubFormData {
    subsContract: boolean
    price: string
}

interface FieldDirtyState {
    cardComplete: boolean
    expiryComplete: boolean
    cvvComplete: boolean
    cardName: boolean
}

interface EnrollPaymentFormProps {
    error: string
    formData: PermiumSubFormData
    isFormValid: boolean
    onPay: () => void
    onUpdateField: (fieldName: string, value: string | boolean) => void
    isPayProcessing: boolean
    price: string
}

type CardChangeEvent
    = StripeCardExpiryElementChangeEvent | StripeCardNumberElementChangeEvent | StripeCardCvcElementChangeEvent

const EnrollPaymentForm: React.FC<EnrollPaymentFormProps> = (props: EnrollPaymentFormProps) => {
    const [cardNumberError, setCardNumberError]: [string, Dispatch<string>] = useState<string>('')
    const [cardExpiryError, setCardExpiryError]: [string, Dispatch<string>] = useState<string>('')
    const [cardCVVError, setCardCVVError]: [string, Dispatch<string>] = useState<string>('')
    const [cardNameError, setCardNameError]: [string, Dispatch<string>] = useState<string>('yesyt')

    const [formDirtyState, setFormDirtyState]: [FieldDirtyState, Dispatch<SetStateAction<FieldDirtyState>>]
        = useState<FieldDirtyState>({
            cardComplete: false,
            cardName: false,
            cvvComplete: false,
            expiryComplete: false,
        })

    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<boolean>]
        = useState<boolean>(false)

    const getError: (data: any) => string = data => data?.error?.message || ''

    const onOpenOrderContract: (event: React.SyntheticEvent) => void = event => {
        event.preventDefault()
        event.stopPropagation()
        setIsOrderContractModalOpen(true)
    }

    const renderCheckboxLabel: () => JSX.Element = () => (
        <div className={styles['checkbox-label']}>
            Yes, I understand and agree to Topcoder Academy’s
            <span className={styles.link} onClick={onOpenOrderContract}>Terms & Conditions</span>
        </div>
    )

    function cardElementOnChange(fieldName: string, data: CardChangeEvent, stateUpdater: Dispatch<string>): void {
        const error: string = getError(data)
        stateUpdater(error)
        props.onUpdateField(fieldName, data.complete)
        setFormDirtyState({
            ...formDirtyState,
            [fieldName]: true,
        })
    }

    function onNameOnCardUpdate(event: React.FocusEvent<HTMLInputElement, Element>): void {
        const name: string = event.target.value

        if (!formDirtyState.cardName) {
            setFormDirtyState({
                ...formDirtyState,
                cardName: true,
            })
        }

        if (!trim(name)) {
            setCardNameError('Name On Card is required field.')
        } else {
            props.onUpdateField('cardName', name)
            setCardNameError('')
        }
    }

    return (
        <div className={classNames(styles['payment-form'], props.isPayProcessing ? 'pointer-events-none' : '')}>
            <OrderContractModal
                isOpen={isOrderContractModalOpen}
                onClose={() => setIsOrderContractModalOpen(false)}
            />

            <h3>Enter your payment information</h3>

            {
                props.error && (
                    <div className={styles.error}>
                        <IconOutline.ExclamationCircleIcon className={styles.errorIcon} />
                        <div className={styles.errorMsg}>
                            <strong>Your payment has been declined</strong>
                            <span>{props.error}</span>
                        </div>
                    </div>
                )
            }

            <div className={styles['input-wrap-wrapper']}>
                <InputWrapper
                    label='Card Number'
                    tabIndex={2}
                    type='text'
                    disabled={false}
                    error={cardNumberError}
                    hideInlineErrors={false}
                    dirty={formDirtyState.cardComplete}
                >
                    <CardNumberElement
                        options={{
                            classes: {
                                base: styles.cardElement,
                            },
                        }}
                        onChange={(event: StripeCardNumberElementChangeEvent) => cardElementOnChange('cardComplete', event, setCardNumberError)}
                    />
                </InputWrapper>
            </div>

            <div className={styles['input-wrap-wrapper']}>
                <InputWrapper
                    className={styles.cardDate}
                    label='Date'
                    tabIndex={3}
                    type='text'
                    disabled={false}
                    error={cardExpiryError}
                    dirty={formDirtyState.expiryComplete}
                >
                    <CardExpiryElement
                        options={{
                            classes: {
                                base: styles.cardElement,
                            },
                            placeholder: 'MM/YY',
                        }}
                        onChange={(event: StripeCardExpiryElementChangeEvent) => cardElementOnChange('expiryComplete', event, setCardExpiryError)}
                    />
                </InputWrapper>
                <InputWrapper
                    label='CVC'
                    tabIndex={3}
                    type='text'
                    disabled={false}
                    error={cardCVVError}
                    dirty={formDirtyState.cvvComplete}
                >
                    <CardCvcElement
                        options={{
                            classes: {
                                base: styles.cardElement,
                            },
                            placeholder: 'Enter CVC',
                        }}
                        onChange={(event: StripeCardCvcElementChangeEvent) => cardElementOnChange('cvvComplete', event, setCardCVVError)}
                    />
                </InputWrapper>
            </div>

            <div className={styles['input-wrap-wrapper']}>
                <InputText
                    label='Name On Card'
                    name='card-name'
                    tabIndex={4}
                    type='text'
                    disabled={false}
                    error={cardNameError}
                    hideInlineErrors={false}
                    dirty={formDirtyState.cardName}
                    onChange={onNameOnCardUpdate}
                />
            </div>

            <InputText
                label={renderCheckboxLabel()}
                name='order-contract'
                tabIndex={1}
                type='checkbox'
                checked={props.formData.subsContract}
                onChange={event => props.onUpdateField('subsContract', event.target.checked)}
            />

            {
                props.isPayProcessing && (
                    <LoadingSpinner type='Overlay' />
                )
            }

            <Button
                className={styles['pay-button']}
                size='lg'
                type='button'
                buttonStyle='primary'
                name='pay-button'
                label={`Pay $${props.price} and enroll`}
                disable={!props.isFormValid || props.isPayProcessing}
                onClick={props.onPay}
            />
        </div>
    )
}

export default EnrollPaymentForm

import { Dispatch, FC, FocusEvent, SetStateAction, SyntheticEvent, useState } from 'react'
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

import { Button, InputText, LoadingSpinner, OrderContractModal } from '../../../../../lib'
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
}

interface EnrollPaymentFormProps {
    error: boolean
    formData: PermiumSubFormData
    isFormValid: boolean
    onPay: () => void
    onUpdateField: (fieldName: string, value: string | boolean) => void
    isPayProcessing: boolean
}

type CardChangeEvent
    = StripeCardExpiryElementChangeEvent | StripeCardNumberElementChangeEvent | StripeCardCvcElementChangeEvent

const EnrollPaymentForm: FC<EnrollPaymentFormProps> = (props: EnrollPaymentFormProps) => {
    const [cardNumberError, setCardNumberError]: [string, Dispatch<string>] = useState<string>('')
    const [cardExpiryError, setCardExpiryError]: [string, Dispatch<string>] = useState<string>('')
    const [cardCVVError, setCardCVVError]: [string, Dispatch<string>] = useState<string>('')

    const [formDirtyState, setFormDirtyState]: [FieldDirtyState, Dispatch<SetStateAction<FieldDirtyState>>]
        = useState<FieldDirtyState>({
            cardComplete: false,
            cvvComplete: false,
            expiryComplete: false,
        })

    const [isOrderContractModalOpen, setIsOrderContractModalOpen]: [boolean, Dispatch<boolean>]
        = useState<boolean>(false)

    const getError: (data: any) => string = data => data?.error?.message || ''

    function hideOrderContractModal(): void {
        setIsOrderContractModalOpen(false)
    }

    function onOpenOrderContract(event: SyntheticEvent): void {
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

    function cardElementOnChange(fieldName: string, stateUpdater: Dispatch<string>): (data: CardChangeEvent) => void {
        return (data: CardChangeEvent) => {
            const error: string = getError(data)
            stateUpdater(error)
            props.onUpdateField(fieldName, data.complete)
            setFormDirtyState({
                ...formDirtyState,
                [fieldName]: true,
            })
        }
    }

    function handleTosCheckboxChange(event: FocusEvent<HTMLInputElement, Element>): void {
        props.onUpdateField('subsContract', event.target.checked)
    }

    return (
        <div className={classNames(styles['payment-form'], props.isPayProcessing ? 'pointer-events-none' : '')}>
            <OrderContractModal
                isOpen={isOrderContractModalOpen}
                onClose={hideOrderContractModal}
            />

            <div className={styles.label}>Card Information</div>

            <div className={styles['input-wrap-wrapper']}>
                <InputWrapper
                    label='Card Number'
                    // eslint-disable-next-line jsx-a11y/tabindex-no-positive
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
                        onChange={cardElementOnChange('cardComplete', setCardNumberError)}
                    />
                </InputWrapper>
            </div>

            <div className={styles['input-wrap-wrapper']}>
                <InputWrapper
                    className={styles.cardDate}
                    label='Date'
                    // eslint-disable-next-line jsx-a11y/tabindex-no-positive
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
                        onChange={cardElementOnChange('expiryComplete', setCardExpiryError)}
                    />
                </InputWrapper>
                <InputWrapper
                    label='CVC'
                    // eslint-disable-next-line jsx-a11y/tabindex-no-positive
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
                            placeholder: 'CCV',
                        }}
                        onChange={cardElementOnChange('cvvComplete', setCardCVVError)}
                    />
                </InputWrapper>
            </div>

            <InputText
                label={renderCheckboxLabel()}
                name='order-contract'
                // eslint-disable-next-line jsx-a11y/tabindex-no-positive
                tabIndex={1}
                type='checkbox'
                checked={props.formData.subsContract}
                onChange={handleTosCheckboxChange}
            />

            {
                props.error && (
                    <div className={styles.error}>
                        Your card was declined. Please try a different card.
                    </div>
                )
            }

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
                label={`Pay ${props.formData.price} and enroll`}
                disable={!props.isFormValid || props.isPayProcessing}
                onClick={props.onPay}
            />
        </div>
    )
}

export default EnrollPaymentForm

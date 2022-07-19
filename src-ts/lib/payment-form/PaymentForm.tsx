import {
    CardCvcElement,
    CardExpiryElement,
    CardNumberElement,
  } from '@stripe/react-stripe-js'
import React from 'react'

import { InputText } from '../form/form-groups/form-input'
import { InputWrapper } from '../form/form-groups/form-input/input-wrapper'

import styles from './PaymentForm.module.scss'

const PaymentForm: React.FC = () => {
    const onUpdateField: () => void = () => {}
    return (
        <div className={styles['payment-form']}>
            <div className={styles['label']}>Contact Information</div>
            <InputText label='Email' placeholder='email' name='email' tabIndex={1} type='text' onChange={onUpdateField} onBlur={() => {}} />

            <div className={styles['label']}>Card Information</div>

            <InputWrapper label='Card Number' tabIndex={2} type='text' disabled={false}>
                <CardNumberElement
                    options={{
                        classes: {
                            base: styles['cardElement'],
                        },
                    }}
                />
            </InputWrapper>
        </div>
    )
}

export default PaymentForm

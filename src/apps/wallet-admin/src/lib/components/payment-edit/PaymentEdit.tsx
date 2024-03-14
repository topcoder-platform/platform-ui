/* eslint-disable react/jsx-no-bind */
import React, { useEffect, useState } from 'react'

import { Winning } from '../../models/WinningDetail'

interface PaymentEditFormProps {
    payment: Winning;
    onErrorStateChanged: (error: boolean) => void;
}

const PaymentEditForm: React.FC<PaymentEditFormProps> = (props: PaymentEditFormProps) => {
    const [formData, setFormData] = useState({
        description: props.payment.description || '',
    })
    const [errors, setErrors] = useState<any>({})

    useEffect(() => {
        const validateForm = (): boolean => {
            let formIsValid = true
            const validationErrors: { [key: string]: string } = {}

            if (!formData.description) {
                formIsValid = false
                validationErrors.description = 'Description is required.'
            }

            setErrors(validationErrors)
            props.onErrorStateChanged(!formIsValid)

            return formIsValid
        }

        setFormData({
            description: props.payment.description || '',
        })

        validateForm()
    }, [props.payment, formData, props.onErrorStateChanged, props])

    const handleChange = (e: React.ChangeEvent<HTMLInputElement>): void => {
        const { name, value } : {
            name: string;
            value: string;
        } = e.target

        setFormData(prevState => ({
            ...prevState,
            [name]: value,
        }))
    }

    return (
        <form>
            <div>
                <label>Description</label>
                <input name='description' value={formData.description} onChange={handleChange} />
                {errors.description && <p>{errors.description}</p>}
            </div>
        </form>
    )

}

export default PaymentEditForm

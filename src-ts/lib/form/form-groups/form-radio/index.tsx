import React, { ChangeEvent } from 'react'

import { FormRadioButtonModel, FormRadioButtonOption } from '../..'

import styles from './FormRadio.module.scss'

export interface FormRadioProps extends FormRadioButtonModel {
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormRadio: React.FC<FormRadioProps> = ({type, name, options}: FormRadioProps) => {
    return (
        <div className={styles['form-radio']}>
            {
                options.map(({children: Option, id}: FormRadioButtonOption)  => (
                    <label className={styles['option']} htmlFor={id}>
                        <input checked type={type} name={name} id={id} />
                        {Option}
                    </label>
                ))
            }
        </div>
    )
}

export default FormRadio

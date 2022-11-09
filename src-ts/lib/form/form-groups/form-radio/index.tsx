import React, { FocusEvent } from 'react'

import { FormInputModel, FormRadioButtonOption } from '../../form-input.model'

import styles from './FormRadio.module.scss'

interface FormRadioProps extends FormInputModel {
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
}

const FormRadio: React.FC<FormRadioProps> = ({ type, name, options, onChange, value }: FormRadioProps) => {

    const renderOption: (Option: JSX.Element, selected: boolean) => React.FunctionComponentElement<any> = (Option: JSX.Element, selected: boolean) => React.cloneElement(Option, {
        selected,
    })

    return (
        <div className={styles['form-radio']}>
            {
                options?.map(({ children: Option, id }: FormRadioButtonOption) => (
                    <label key={id} className={styles.option} htmlFor={id}>
                        <input checked={value === id} type={type} name={name} id={id} value={id} onChange={onChange} />
                        {renderOption(Option, value === id)}
                    </label>
                ))
            }
        </div>
    )
}

export default FormRadio

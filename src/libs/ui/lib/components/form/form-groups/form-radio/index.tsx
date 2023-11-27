import React, { FocusEvent } from 'react'

import { FormInputModel, FormRadioButtonOption } from '../../form-input.model'

import styles from './FormRadio.module.scss'

interface FormRadioProps extends FormInputModel {
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
    options?: ReadonlyArray<FormRadioButtonOption>
}

const FormRadio: React.FC<FormRadioProps> = (props: FormRadioProps) => {

    const renderOption: (Option: JSX.Element, selected: boolean) => React.FunctionComponentElement<any>
        = (Option: JSX.Element, selected: boolean) => React.cloneElement(Option, {
            selected,
        })

    return (
        <div className={styles['form-radio']}>
            {
                props.options?.map(({ children: Option, id }: FormRadioButtonOption) => (
                    <label key={id} className={styles.option} htmlFor={id}>
                        <input
                            checked={props.value === id}
                            type={props.type}
                            name={props.name}
                            id={id}
                            value={id}
                            onChange={props.onChange}
                        />
                        {renderOption(Option, props.value === id)}
                    </label>
                ))
            }
        </div>
    )
}

export default FormRadio

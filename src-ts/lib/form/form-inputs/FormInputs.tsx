import { FocusEvent } from 'react'

import { FormDefinition } from '../form-definition.model'
import { formGetInputModel } from '../form-functions'

import { InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import styles from './FormInputs.module.scss'

interface FormInputsProps {
    formDef: FormDefinition
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onFocus: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormInputs: (props: FormInputsProps) => JSX.Element = (props: FormInputsProps) => {

    const { formDef, onBlur, onFocus }: FormInputsProps = props

    const formInputs: Array<JSX.Element> = formDef.inputs
        .map(input => formGetInputModel(formDef.inputs, input.name))
        .map((inputModel, index) => {

            const tabIndex: number = inputModel.notTabbable ? -1 : index + 1 + (formDef.tabIndexStart || 0)

            let inputElement: JSX.Element
            switch (inputModel.type) {

                case 'textarea':
                    inputElement = (
                        <InputTextarea
                            {...inputModel}
                            onBlur={onBlur}
                            onFocus={onFocus}
                            tabIndex={tabIndex}
                            value={inputModel.value}
                        />
                    )
                    break

                default:
                    inputElement = (
                        <InputText
                            {...inputModel}
                            onBlur={onBlur}
                            onFocus={onFocus}
                            tabIndex={tabIndex}
                            type={inputModel.type || 'text'}
                            value={inputModel.value}
                        />
                    )
                    break
            }

            return (
                <FormInputRow
                    key={inputModel.name}
                    index={index}
                    input={inputModel}
                >
                    {inputElement}
                </FormInputRow>
            )
        })

    return (
        <div className={styles['form-inputs']}>
            {formInputs}
        </div>
    )
}

export default FormInputs

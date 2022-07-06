import { ChangeEvent, FocusEvent } from 'react'

import { FormDefinition } from '../form-definition.model'
import { FormFieldModel, NonStaticField } from '../form-field.model'
import { formGetInputModel } from '../form-functions'
import { FormInputModel } from '../form-input.model'
import { FormSectionModel } from '../form-section.model'

import { InputRating, InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import styles from './FormInputs.module.scss'

interface FormInputsProps {
    formDef: FormDefinition
    inputs: Array<NonStaticField>
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormInputs: (props: FormInputsProps) => JSX.Element = (props: FormInputsProps) => {

    const { formDef, onBlur, onChange }: FormInputsProps = props

    const formInputElements: Array<JSX.Element | undefined> = formDef.elements?.map((element: FormSectionModel | FormFieldModel) => {
        if (element.type === 'field') {
            return formGetInputModel(element.field.name, props.inputs)
        }
    })
    .map((inputModel, index) => {

        if (!inputModel) {
            return
        }

        const input: FormInputModel = inputModel as FormInputModel
        const tabIndex: number = inputModel.notTabbable ? -1 : index + 1 + (formDef.tabIndexStart || 0)

        let inputElement: JSX.Element
        switch (input.type) {

            case 'rating':
                inputElement = (
                    <InputRating
                        {...input}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        value={input.value}
                    />
                )
                break

            case 'textarea':
                inputElement = (
                    <InputTextarea
                        {...input}
                        onBlur={onBlur}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        value={input.value}
                    />
                )
                break

            default:
                inputElement = (
                    <InputText
                        {...input}
                        onBlur={onBlur}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        type={input.type || 'text'}
                        value={input.value}
                    />
                )
                break
        }

        return (
            <FormInputRow
                key={inputModel.name}
                index={index}
                input={input}
            >
                {inputElement}
            </FormInputRow>
        )
    }) || []

    return (
        <div className={styles['form-inputs']}>
            {formInputElements}
        </div>
    )
}

export default FormInputs

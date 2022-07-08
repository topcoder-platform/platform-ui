import { ChangeEvent, FocusEvent } from 'react'

import { FormDefinition } from '../form-definition.model'
import { FormFieldModel, NonStaticField } from '../form-field.model'
import { formGetInputModel } from '../form-functions'
import { FormInputModel, FormInputTypes } from '../form-input.model'
import { FormSectionModel } from '../form-section.model'

import { InputRating, InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import { InputTextTypes } from './form-input/input-text/InputText'
import FromSection from './form-section'
import styles from './FormElements.module.scss'

interface FormElementsProps {
    formDef: FormDefinition
    inputs: Array<NonStaticField>
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormElements: (props: FormElementsProps) => JSX.Element = (props: FormElementsProps) => {

    const { formDef, onBlur, onChange }: FormElementsProps = props

    const formInputElements: Array<FormFieldModel> = formDef
        .elements?.filter(element => element.type === 'field') as Array<FormFieldModel>

    const formInputSections: Array<FormSectionModel> = formDef
        .elements?.filter(element => element.type === 'section') as Array<FormSectionModel>

    const renderInputField: (inputModel: NonStaticField, index: number) => JSX.Element | undefined = (inputModel, index) => {

        if (!inputModel) {
            return
        }

        const input: FormInputModel = inputModel as FormInputModel
        const tabIndex: number = inputModel.notTabbable ? -1 : index + 1 + (formDef.tabIndexStart || 0)

        let inputElement: JSX.Element
        switch (input.type) {

            case FormInputTypes.rating:
                inputElement = (
                    <InputRating
                        {...input}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        value={input.value}
                    />
                )
                break

            case FormInputTypes.textarea:
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
                        type={input.type as InputTextTypes || 'text'}
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
    }

    const formSections: Array<JSX.Element | undefined> = formInputSections.map((element: FormSectionModel) => {
        return <FromSection section={element} renderFormInput={renderInputField} />
    })

    const formInputs: Array<JSX.Element | undefined> = formInputElements.map((element: FormFieldModel) => {
            return formGetInputModel(element.field.name, props.inputs)
        })
        .map(renderInputField) || []

    return (
        <div className={styles['form-inputs']}>
            {formInputs}
            {formSections}
        </div>
    )
}

export default FormElements

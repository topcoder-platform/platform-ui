import { ChangeEvent, FocusEvent } from 'react'

import { Field, FormDefinition, FormGroup,  FormInputModel, FormInputTypes, FormRadioButtonTypes } from '..'

import FormGroupItem from './form-group-item'
import { InputRating, InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import { InputTextTypes } from './form-input/input-text/InputText'
import FormRadio from './form-radio'
import styles from './FormGroups.module.scss'

interface FormGroupsProps {
    formDef: FormDefinition
    inputs: Array<Field>
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormGroups: (props: FormGroupsProps) => JSX.Element = (props: FormGroupsProps) => {

    const { formDef, onBlur, onChange }: FormGroupsProps = props

    const render: (inputModel: Field, index: number) => JSX.Element | undefined = (inputModel, index) => {
        const input: Field = inputModel
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
            case FormRadioButtonTypes.checkbox:
            case FormRadioButtonTypes.radio:
                inputElement = (
                    <FormRadio
                        {...input}
                        onChange={onChange}
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

    const renderInputField: (inputModel: Field, index: number) => JSX.Element | undefined = (inputModel, index) => {

        if (!inputModel) {
            return
        }

        return render(inputModel, index)
    }

    const formGroups: Array<JSX.Element | undefined> = formDef?.groups?.map((element: FormGroup) => {
        return <FormGroupItem group={element} renderFormInput={renderInputField} />
    }) || []

    return (
        <div className={styles['form-groups']}>
            {formGroups}
        </div>
    )
}

export default FormGroups

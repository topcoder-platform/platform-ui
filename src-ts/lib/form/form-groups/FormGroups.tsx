import { ChangeEvent, FocusEvent } from 'react'

import { FormDefinition } from '../form-definition.model'
import { FormGroup } from '../form-group.model'
import { FormInputModel } from '../form-input.model'

import FormGroupItem from './form-group-item/FormGroupItem'
import { InputRating, InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import { InputTextTypes } from './form-input/input-text/InputText'
import styles from './FormGroups.module.scss'

interface FormGroupsProps {
    formDef: FormDefinition
    inputs: Array<FormInputModel>
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormGroups: (props: FormGroupsProps) => JSX.Element = (props: FormGroupsProps) => {

    const { formDef, onBlur, onChange }: FormGroupsProps = props

    const renderInputField: (inputModel: FormInputModel, index: number) => JSX.Element | undefined = (inputModel, index) => {

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

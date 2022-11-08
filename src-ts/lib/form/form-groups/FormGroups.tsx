import { ChangeEvent, FocusEvent } from 'react'

import { PageDivider } from '../../page-divider'
import { FormDefinition } from '../form-definition.model'
import { FormGroup } from '../form-group.model'
import { FormInputModel } from '../form-input.model'

import { FormCardSet } from './form-card-set'
import { InputImagePicker, InputRating, InputText, InputTextarea } from './form-input'
import { FormInputRow } from './form-input-row'
import { InputTextTypes } from './form-input/input-text/InputText'
import FormGroupItem from './form-group-item/FormGroupItem'
import FormRadio from './form-radio'
import styles from './FormGroups.module.scss'

interface FormGroupsProps {
    formDef: FormDefinition
    inputs: Array<FormInputModel>
    onBlur: (event: FocusEvent<HTMLInputElement | HTMLTextAreaElement>) => void
    onChange: (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => void
}

const FormGroups: (props: FormGroupsProps) => JSX.Element = (props: FormGroupsProps) => {

    const { formDef, onBlur, onChange }: FormGroupsProps = props

    function getTabIndex(input: FormInputModel, index: number): number {
        const tabIndex: number = input.notTabbable ? -1 : index + 1 + (formDef.tabIndexStart || 0)
        return tabIndex
    }

    function renderInputField(input: FormInputModel, index: number): JSX.Element | undefined {

        const tabIndex: number = getTabIndex(input, index)

        let inputElement: JSX.Element

        switch (input.type) {

            case 'rating':
                inputElement = (
                    <InputRating
                        {...input}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        value={input.value as number | undefined}
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
                        value={input.value as string | undefined}
                    />
                )
                break
            case 'checkbox':
                inputElement = (
                    <InputText
                        {...input}
                        checked={!!input.value}
                        onBlur={onBlur}
                        onChange={onChange}
                        tabIndex={tabIndex}
                        type='checkbox'
                    />
                )
                break
            case 'radio':
                inputElement = (
                    <FormRadio
                        {...input}
                        onChange={onChange}
                        value={input.value}
                    />
                )
                break
            case 'card-set':
                inputElement = (
                    <FormCardSet
                        {...input}
                        onChange={onChange}
                        value={input.value}
                    />
                )
                break
            case 'image-picker':
                inputElement = (
                    <InputImagePicker
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
                        value={input.value as string | undefined}
                    />
                )
                break
        }

        return (
            <FormInputRow
                key={input.name}
                index={index}
                input={input}
            >
                {inputElement}
            </FormInputRow>
        )
    }

    const formGroups: Array<JSX.Element | undefined> = formDef?.groups
        ?.map((element: FormGroup, index: number) => (
            <FormGroupItem
                key={`element-${index}`}
                group={element}
                renderFormInput={renderInputField}
                totalGroupCount={formDef.groups?.length || 0}
                renderDividers={props.formDef.groupsOptions?.renderGroupDividers}
            />
        ))
        || []

    return (
        <>
            <div className={styles['form-groups']} style={props.formDef.groupsOptions?.groupWrapStyles}>
                {formGroups}
            </div>
            {
                props.formDef.groupsOptions?.renderGroupDividers === false && <PageDivider />
            }
        </>
    )
}

export default FormGroups

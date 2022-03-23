import { Dispatch, FormEvent, SetStateAction } from 'react'
import { toast } from 'react-toastify'

import { TextInput } from '../text-input'

import { FormDefinition } from './form-definition.model'
import { FormInputModel } from './form-input.model'

export function getInput(formElements: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function getValue(formElements: HTMLFormControlsCollection, fieldName: string): string {
    return getInput(formElements, fieldName).value
}

export function initializeValues(formDef: FormDefinition, formValues: any): void {
    getInputArray(formDef)
        .filter(input => !input.dirty)
        .forEach(input => input.value = formValues[input.name])
}

export function renderTextInput(
    formDef: FormDefinition,
    fieldName: string,
): JSX.Element {

    const formField: FormInputModel = formDef[fieldName]

    return (
        <TextInput
            {...formField}
            tabIndex={formField.tabIndex || 0}
            type={formField.type || 'text'}
            value={formField.value}
        />
    )
}

export function reset(formDef: FormDefinition, formValue?: any): void {
    getInputArray(formDef)
        .forEach(inputDef => {
            inputDef.dirty = false
            inputDef.error = undefined
            inputDef.value = formValue?.[inputDef.name]
        })
}

export async function submit<T, R>(
    event: FormEvent<HTMLFormElement>,
    formDef: FormDefinition,
    formName: string,
    formValue: T,
    save: (value: T) => Promise<R>,
    setDisableButton: Dispatch<SetStateAction<boolean>>,
): Promise<void> {

    event.preventDefault()
    setDisableButton(true)

    const formFieldDefs: Array<FormInputModel> = getInputArray(formDef)

    // if there are no dirty fields, display a message and stop submitting
    const dirty: FormInputModel | undefined = formFieldDefs.find(fieldDef => !!fieldDef.dirty)
    if (!dirty) {
        toast.info('No changes detected.')
        return
    }

    // get the form values so we can validate them
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

    // if there are any validation errors, display a message and stop submitting
    const isValid: boolean = validate(formDef, formValues, true)
    if (!isValid) {
        toast.error('Changes could not be saved. Please resolve errors.')
        return
    }

    // set the values for the updated value
    formFieldDefs.forEach(field => (formValue as any)[field.name] = field.value)

    return save(formValue)
        .then(() => {
            toast.success(`Your ${formName} has been saved.`)
            reset(formDef, formValue)
        })
        .catch(error => {
            toast.error(error.response?.data?.result?.content || error.message || error)
        })
}

export function validateAndUpdate(
    event: FormEvent<HTMLFormElement>,
    formDef: FormDefinition,
): boolean {

    const input: HTMLInputElement = (event.target as HTMLInputElement)
    // set the input def info
    const inputDef: FormInputModel = formDef[input.name]
    inputDef.dirty = true
    inputDef.value = input.value

    // validate the form
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements
    const isValid: boolean = validate(formDef, formElements)

    formDef[input.name] = inputDef
    return isValid
}

function getInputArray(formDef: FormDefinition): Array<FormInputModel> {
    return Object.keys(formDef)
        .map(key => formDef[key])
}

function validate(formDef: FormDefinition, formElements: HTMLFormControlsCollection, formDirty?: boolean): boolean {
    const errors: Array<FormInputModel> = getInputArray(formDef)
        .filter(formInputDef => {
            formInputDef.error = undefined
            formInputDef.dirty = formInputDef.dirty || !!formDirty
            formInputDef.validators
                .forEach(validator => {
                    if (!formInputDef.error) {
                        formInputDef.error = validator(formInputDef.value, formElements, formInputDef.dependentField)
                    }
                })
            return !!formInputDef.error
        })
    return !errors.length
}

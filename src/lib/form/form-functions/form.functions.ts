import { Dispatch, FormEvent, SetStateAction } from 'react'
import { toast } from 'react-toastify'

import { FormInputModel } from '../form-input.model'

export enum ErrorMessage {
    save = 'Error on save',
    submit = 'Error on submit',
}

export function getInputElement(formElements: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function getInputModel(inputs: ReadonlyArray<FormInputModel>, fieldName: string): FormInputModel {

    const formField: FormInputModel | undefined = inputs.find(input => input.name === fieldName)

    // if we can't find the input we have a problem
    if (!formField) {
        throw new Error(`There is no input definition for the ${fieldName} field`)
    }

    return formField
}

export function initializeValues<T>(inputs: ReadonlyArray<FormInputModel>, formValues?: T): void {
    inputs
        .filter(input => !input.dirty)
        .forEach(input => {
            input.value = !!(formValues as any)?.hasOwnProperty(input.name)
                ? (formValues as any)[input.name]
                : undefined
        })
}

export function reset(inputs: ReadonlyArray<FormInputModel>, formValue?: any): void {
    inputs
        .forEach(inputDef => {
            inputDef.dirty = false
            inputDef.error = undefined
            inputDef.value = formValue?.[inputDef.name]
        })
}

export async function submitAsync<T, R>(
    event: FormEvent<HTMLFormElement>,
    inputs: ReadonlyArray<FormInputModel>,
    formName: string,
    formValue: T,
    save: (value: T) => Promise<R>,
    setDisableButton: Dispatch<SetStateAction<boolean>>,
): Promise<void> {

    event.preventDefault()
    setDisableButton(true)

    // if there are no dirty fields, display a message and stop submitting
    const dirty: FormInputModel | undefined = inputs.find(fieldDef => !!fieldDef.dirty)
    if (!dirty) {
        toast.info('No changes detected.')
        return
    }

    // get the form values so we can validate them
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

    // if there are any validation errors, display a message and stop submitting
    const isValid: boolean = validate(inputs, formValues, true)
    if (!isValid) {
        toast.error('Changes could not be saved. Please resolve errors.')
        return Promise.reject(ErrorMessage.submit)
    }

    // set the values for the updated value
    inputs.forEach(field => (formValue as any)[field.name] = field.value)

    return save(formValue)
        .then(() => {
            toast.success(`Your ${formName} has been saved.`)
        })
        .catch(error => {
            toast.error(error.response?.data?.result?.content || error.message || error)
            return Promise.reject(ErrorMessage.save)
        })
}

export function validateAndUpdate(event: FormEvent<HTMLFormElement>, inputs: ReadonlyArray<FormInputModel>): boolean {

    const input: HTMLInputElement = (event.target as HTMLInputElement)
    // set the input def info
    const inputDef: FormInputModel = getInputModel(inputs, input.name)
    inputDef.dirty = true
    inputDef.value = input.value

    // validate the form
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements
    const isValid: boolean = validate(inputs, formElements)

    return isValid
}

function validate(inputs: ReadonlyArray<FormInputModel>, formElements: HTMLFormControlsCollection, formDirty?: boolean): boolean {
    const errors: ReadonlyArray<FormInputModel> = inputs
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

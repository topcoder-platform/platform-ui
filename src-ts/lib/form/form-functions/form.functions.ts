import { ChangeEvent, FormEvent } from 'react'
import { toast } from 'react-toastify'

import { FormDefinition } from '../form-definition.model'
import { FormInputModel } from '../form-input.model'

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
        .filter(input => !input.dirty && !input.touched)
        .forEach(input => {
            input.value = !!(formValues as any)?.hasOwnProperty(input.name)
                ? (formValues as any)[input.name]
                : undefined
        })
}

export function onBlur<T>(event: FormEvent<HTMLInputElement | HTMLTextAreaElement>, inputs: ReadonlyArray<FormInputModel>, formValues?: T): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'blur', formValues)
}

export function onChange<T>(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, inputs: ReadonlyArray<FormInputModel>, formValues?: T): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'change', formValues)
}

export function onReset(inputs: ReadonlyArray<FormInputModel>, formValue?: any): void {
    inputs
        .forEach(inputDef => {
            inputDef.dirty = false
            inputDef.touched = false
            inputDef.error = undefined
            inputDef.value = formValue?.[inputDef.name]
        })
}

export async function onSubmitAsync<T>(
    event: FormEvent<HTMLFormElement>,
    formDef: FormDefinition,
    formValue: T,
    save: (value: T) => Promise<void>,
    onSuccess?: () => void,
): Promise<void> {

    event.preventDefault()

    const { inputs, shortName, successMessage }: FormDefinition = formDef

    // get the dirty fields before we validate b/c validation marks them dirty on submit
    const dirty: FormInputModel | undefined = inputs.find(fieldDef => !!fieldDef.dirty)

    // if there are any validation errors, display a message and stop submitting
    // NOTE: need to check this before we check if the form is dirty bc you
    // could have a form that's not dirty but has errors and you wouldn't
    // want to have it look like the submit succeeded
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements
    const isValid: boolean = validateForm(inputs, formValues, 'submit')
    if (!isValid) {
        return Promise.reject()
    }

    // set the properties for the updated T value
    inputs.forEach(field => (formValue as any)[field.name] = field.value)

    // if there are no dirty fields, don't actually perform the save
    const savePromise: Promise<void> = !dirty ? Promise.resolve() : save(formValue)

    return savePromise
        .then(() => {
            const safeSuccessMessage: string = !!successMessage
                ? successMessage as string
                : `Your ${shortName || 'data'} has been saved.`
            toast.success(safeSuccessMessage)
            onSuccess?.()
        })
        .catch(error => {
            return Promise.reject(error.response?.data?.result?.content || error.message || error)
        })
}

function handleFieldEvent<T>(input: HTMLInputElement | HTMLTextAreaElement, inputs: ReadonlyArray<FormInputModel>, event: 'blur' | 'change', formValues?: T): void {

    // set the dirty and touched flags on the field
    const originalValue: string | undefined = (formValues as any)?.[input.name]

    const inputDef: FormInputModel = getInputModel(inputs, input.name)
    if (event === 'change') {
        inputDef.dirty = input.value !== originalValue
    }
    inputDef.touched = true

    // set the def value
    inputDef.value = input.value

    // now let's validate the field
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements
    validateField(inputDef, formElements, event)

    // if the input doesn't have any dependent fields, we're done
    if (!inputDef.dependentFields?.length) {
        return
    }

    inputDef.dependentFields
        .forEach(dependentField => {
            const dependentFieldDef: FormInputModel = getInputModel(inputs, dependentField)
            validateField(dependentFieldDef, formElements, event)
        })
}

function validateField(formInputDef: FormInputModel, formElements: HTMLFormControlsCollection, event: 'blur' | 'change' | 'submit'): void {

    // this is the error the field had before the event took place
    const previousError: string | undefined = formInputDef.error

    formInputDef.validators
        ?.forEach(validatorFunction => {

            // if the next error is the same as the previous error, then no need to do anything
            const nextError: string | undefined = validatorFunction.validator(formInputDef.value, formElements, validatorFunction.dependentField)

            if (previousError === nextError) {
                return
            }

            // we only remove errors on change
            if (event === 'change') {
                if (!nextError) {
                    formInputDef.error = undefined
                }
                return
            }

            // this is an on blur or submit event,
            // so if there is no current error for this field,
            // set it to the next error
            if (!formInputDef.error) {
                formInputDef.error = nextError
            }
        })
}

function validateForm(inputs: ReadonlyArray<FormInputModel>, formElements: HTMLFormControlsCollection, event: 'blur' | 'change' | 'submit'): boolean {
    const errors: ReadonlyArray<FormInputModel> = inputs
        .filter(formInputDef => {
            formInputDef.dirty = formInputDef.dirty || event === 'submit'
            validateField(formInputDef, formElements, event)
            return !!formInputDef.error
        })
    return !errors.length
}

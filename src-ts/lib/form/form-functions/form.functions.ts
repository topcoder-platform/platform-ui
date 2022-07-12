import { ChangeEvent, FormEvent } from 'react'
import { toast } from 'react-toastify'

import { FormDefinition, FormGroup, FormInputModel } from '..'

export function getInputElement(formElements: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function isInputField({type}: FormInputModel): boolean {
    return type === 'text' || type === 'password' || type === 'rating' || type === 'textarea'
}

export function getFormInputFields(groups: ReadonlyArray<FormGroup>): Array<FormInputModel> {
    const formFields: Array<FormInputModel> = groups.reduce((current: Array<FormInputModel>, previous: FormGroup) => {
        const formGroupFields: Array<FormInputModel> = previous.fields || []
        return [...current, ...formGroupFields]
    }, []) as Array<FormInputModel>
    return formFields
}

export function getInputModel(fields: ReadonlyArray<FormInputModel>, fieldName: string): FormInputModel {

    const formField: FormInputModel | undefined = fields.find(input => input.name === fieldName)

    // if we can't find the input we have a problem
    if (!formField) {
        throw new Error(`There is no input definition for the ${fieldName} field`)
    }

    return formField
}

export function initializeValues<T>(fields: Array<FormInputModel>, formValues?: T): void {
    fields
        .filter(input =>  isInputField(input) && !input.dirty && !input.touched)
        .forEach(input => {
            if (isInputField(input)) {
                const typeCastedInput: FormInputModel = input as FormInputModel
                typeCastedInput.value = !!(formValues as any)?.hasOwnProperty(typeCastedInput.name)
                ? (formValues as any)[typeCastedInput.name]
                : undefined
            }
        })
}

export function onBlur<T>(event: FormEvent<HTMLInputElement | HTMLTextAreaElement>, inputs: ReadonlyArray<FormInputModel>, formValues?: T): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'blur', formValues)
}

export function onChange<T>(event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>, inputs: ReadonlyArray<FormInputModel>, formValues?: T): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'change', formValues)
}

export function onReset(inputs: ReadonlyArray<FormInputModel>, formValue?: any): void {
    inputs?.forEach(inputDef => {
            if (isInputField(inputDef)) {
                const typeCastedInput: FormInputModel = inputDef as FormInputModel
                typeCastedInput.dirty = false
                typeCastedInput.touched = false
                typeCastedInput.error = undefined
                typeCastedInput.value = formValue?.[inputDef.name]
            }
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

    const { groups, shortName, successMessage }: FormDefinition = formDef
    const inputs: Array<FormInputModel> = getFormInputFields(groups || [])

    // get the dirty fields before we validate b/c validation marks them dirty on submit
    const dirty: FormInputModel | undefined = inputs?.find(fieldDef => !!fieldDef.dirty)

    // if there are any validation errors, display a message and stop submitting
    // NOTE: need to check this before we check if the form is dirty bc you
    // could have a form that's not dirty but has errors and you wouldn't
    // want to have it look like the submit succeeded
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements
    const isValid: boolean = validateForm(formValues, 'submit', inputs)
    if (!isValid) {
        return Promise.reject()
    }

    // set the properties for the updated T value
    inputs
        .filter(field => isInputField(field)).forEach((field) => {
            (formValue as any)[field.name] = field.value
        })

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

function handleFieldEvent<T>(input: HTMLInputElement | HTMLTextAreaElement, fields: ReadonlyArray<FormInputModel>, event: 'blur' | 'change', formValues?: T): void {

    // set the dirty and touched flags on the field
    const originalValue: string | undefined = (formValues as any)?.[input.name]

    const inputDef: FormInputModel = getInputModel(fields, input.name)

    if (event === 'change') {
        inputDef.dirty = input.value !== originalValue
    }
    inputDef.touched = true

    // set the def value
    inputDef.value = input.value

    console.log(inputDef, input.value, input.name)

    // now let's validate the field
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements
    validateField(inputDef, formElements, event)

    // if the input doesn't have any dependent fields, we're done
    if (!inputDef.dependentFields?.length) {
        return
    }

    inputDef.dependentFields
        .forEach(dependentField => {
            const dependentFieldDef: FormInputModel = getInputModel(fields, dependentField)
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

function validateForm(formElements: HTMLFormControlsCollection, event: 'blur' | 'change' | 'submit', inputs: ReadonlyArray<FormInputModel>): boolean {
    const errors: ReadonlyArray<FormInputModel> = inputs?.filter(formInputDef => {
            formInputDef.dirty = formInputDef.dirty || event === 'submit'
            validateField(formInputDef, formElements, event)
            return !!formInputDef.error
        })
    return !errors.length
}

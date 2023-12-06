import { ChangeEvent, FormEvent } from 'react'
import { toast } from 'react-toastify'

import { FormAction, FormDefinition } from '../form-definition.model'
import { FormGroup } from '../form-group.model'
import { FormInputModel, InputValue } from '../form-input.model'

import { FormValue } from './form-value.model'

export type ValidationEvent = 'blur' | 'change' | 'submit' | 'initial'

export function getInputElement(
    formElements: HTMLFormControlsCollection,
    fieldName: string,
): HTMLInputElement | undefined {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function getFormInputFields(groups: ReadonlyArray<FormGroup>): Array<FormInputModel> {
    const formInputs: Array<FormInputModel> = groups.reduce((current: Array<FormInputModel>, previous: FormGroup) => {
        const formGroupInputs: ReadonlyArray<FormInputModel> = previous.inputs || []
        return [...current, ...formGroupInputs]
    }, []) as Array<FormInputModel>
    return formInputs
}

export function getInputModel(inputs: ReadonlyArray<FormInputModel>, fieldName: string): FormInputModel {

    const formField: FormInputModel | undefined = inputs.find(input => input.name === fieldName)

    // if we can't find the input we have a problem
    if (!formField) {
        throw new Error(`There is no input definition for the ${fieldName} field`)
    }

    return formField
}

export function initializeValues<T extends FormValue>(
    inputs: Array<FormInputModel>,
    formValues?: T,
): void {

    const filteredInputs: ReadonlyArray<FormInputModel> = inputs
        .filter(input => !input.dirty && !input.touched)

    for (const input of filteredInputs) {
        if (input.type === 'checkbox') {
            input.value = input.checked || false
        } else {
            input.value
                = !!formValues && Object.prototype.hasOwnProperty.call(formValues, input.name)
                    ? (formValues as { [id: string]: InputValue })[input.name]
                    : undefined
        }
    }
}

export function onBlur<T extends FormValue>(
    event: FormEvent<HTMLInputElement | HTMLTextAreaElement>,
    inputs: ReadonlyArray<FormInputModel>,
    formValues?: T,
): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'blur', formValues)
}

export function onChange<T extends FormValue>(
    event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    inputs: ReadonlyArray<FormInputModel>,
    formValues?: T,
): void {
    handleFieldEvent<T>(event.target as HTMLInputElement | HTMLTextAreaElement, inputs, 'change', formValues)
}

export function onReset<T extends FormValue>(inputs: ReadonlyArray<FormInputModel>, formValue?: T): void {
    inputs?.forEach(inputDef => {
        const typeCastedInput: FormInputModel = inputDef as FormInputModel
        typeCastedInput.dirty = false
        typeCastedInput.touched = false
        typeCastedInput.error = undefined
        typeCastedInput.value = formValue?.[inputDef.name]
    })
}

type CustomFormValidator = (
    formElements: HTMLFormControlsCollection,
    event: ValidationEvent,
    inputs: ReadonlyArray<FormInputModel>,
) => boolean

export async function onSubmitAsync<T extends FormValue>(
    action: FormAction,
    event: FormEvent<HTMLFormElement>,
    formDef: FormDefinition,
    formValue: T,
    save: (value: T) => Promise<void>,
    onSuccess?: () => void,
    customValidateForm?: CustomFormValidator,
): Promise<void> {

    event.preventDefault()
    event.stopPropagation()

    const { groups, shortName, successMessage }: FormDefinition = formDef
    const inputs: Array<FormInputModel> = getFormInputFields(groups || [])

    // get the dirty fields before we validate b/c validation marks them dirty on submit
    const dirty: FormInputModel | undefined = inputs?.find(fieldDef => !!fieldDef.dirty)

    // if there are any validation errors, display a message and stop submitting
    // NOTE: need to check this before we check if the form is dirty bc you
    // could have a form that's not dirty but has errors and you wouldn't
    // want to have it look like the submit succeeded
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements
    if (action === 'submit') {
        const isValid: boolean = (customValidateForm || validateForm)(formValues, action, inputs)
        if (!isValid) {
            return Promise.reject()
        }
    }

    // set the properties for the updated T value
    const updatedValue: FormValue = { ...formValue }
    inputs
        .forEach(field => {
            updatedValue[field.name] = field.value
        })

    // if there are no dirty fields, don't actually perform the save
    const savePromise: Promise<void> = !dirty ? Promise.resolve() : save(updatedValue as T)

    return savePromise
        .then(() => {
            if (successMessage !== false) {
                const safeSuccessMessage: string = !!successMessage
                    ? successMessage as string
                    : `Your ${shortName || 'data'} has been saved.`
                toast.success(safeSuccessMessage)
            }

            onSuccess?.()
        })
        .catch(error => Promise.reject(error.response?.data?.result?.content ?? error.message ?? error))
}

function handleFieldEvent<T extends FormValue>(
    input: HTMLInputElement | HTMLTextAreaElement,
    inputs: ReadonlyArray<FormInputModel>,
    event: 'blur' | 'change',
    formValues?: T,
): void {

    // set the dirty and touched flags on the field
    const originalValue: InputValue = formValues?.[input.name]

    const inputDef: FormInputModel = getInputModel(inputs, input.name)

    const inputEl: HTMLInputElement = input as HTMLInputElement

    if (event === 'change') {
        inputDef.dirty = input.value !== originalValue
    }

    inputDef.touched = true

    // set the def value
    if (input.type === 'checkbox') {
        inputDef.value = inputEl.checked
        inputDef.checked = inputEl.checked
    } else if (input.type === 'file') {
        inputDef.value = inputEl.files || undefined
    } else {
        inputDef.value = input.value
    }

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

function validateField(
    formInputDef: FormInputModel,
    formElements: HTMLFormControlsCollection,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    event: 'blur' | 'change' | 'submit' | 'initial',
): void {

    // this is the error the field had before the event took place
    const previousError: string | undefined = formInputDef.error

    // run through all validators and determine the nextError message
    const nextError = formInputDef.validators
        ?.reduce<string | undefined>((hasError, validatorFunction) => (
            hasError
            || validatorFunction.validator(
                formInputDef.value,
                formElements,
                validatorFunction.dependentField,
            )
        ), undefined)

    // if the next error is the same as the previous error, then no need to do anything
    if (previousError === nextError) {
        return
    }

    formInputDef.error = nextError
}

export function validateForm(
    formElements: HTMLFormControlsCollection,
    event: ValidationEvent,
    inputs: ReadonlyArray<FormInputModel>,
): boolean {

    let hasError: boolean = false

    for (const formInputDef of inputs) {
        formInputDef.dirty = formInputDef.dirty || event === 'submit'
        validateField(formInputDef, formElements, event)
        hasError = hasError || !!formInputDef.error
    }

    return !hasError
}

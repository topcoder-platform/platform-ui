import { Dispatch, FormEvent, SetStateAction } from 'react'
import { toast } from 'react-toastify'

import { TextInput } from '../text-input'

import { FormDefinition } from './form-definition.model'
import { TextInputModel } from './text-input.model'

export function getInput(formElements: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function getValue(formElements: HTMLFormControlsCollection, fieldName: string): string {
    return getInput(formElements, fieldName).value
}

export function submit<T, R>(
    event: FormEvent<HTMLFormElement>,
    formDef: FormDefinition,
    formName: string,
    formValue: T,
    save: (value: T) => Promise<R>,
    setDisableButton: Dispatch<SetStateAction<boolean>>,
    setForm: Dispatch<SetStateAction<FormDefinition>>
): void {

    event.preventDefault()
    setDisableButton(true)

    // make a map of the form field defs so we don't have to keep converting
    // the dictionary to an array
    const formFieldDefs: Array<TextInputModel> = Object.keys(formDef)
        .map(key => formDef[key])

    // if there are no dirty fields, display a message and stop submitting
    const dirty: TextInputModel | undefined = formFieldDefs.find(fieldDef => !!fieldDef.dirty)
    if (!dirty) {
        toast.info('No changes detected.')
        return
    }

    // get the form values so we can validate them
    const formValues: HTMLFormControlsCollection = (event.target as HTMLFormElement).elements

    // if there are any validation errors, display a message and stop submitting
    const isInvalid: boolean = !!formFieldDefs
        .map(formField => getInput(formValues, formField.name))
        .filter(inputField => !validateAndUpdateInput(inputField, formDef, setForm, true))
        .length
    if (isInvalid) {
        toast.error('Changes could not be saved. Please resolve errors.')
        return
    }

    // set the values for the updated value
    formFieldDefs.forEach(field => (formValue as any)[field.name] = field.value)

    save(formValue)
        .then(() => toast.success(`Your ${formName} has been saved.`))
        .catch(error => toast.error(error.response?.data?.result?.content || error.message || error))
}

export function renderTextInput(
    formDef: FormDefinition,
    fieldName: string,
    formValue: any,
): JSX.Element {

    const formField: TextInputModel = formDef[fieldName]

    return (
        <TextInput
            {...formField}
            tabIndex={formField.tabIndex || 0}
            type={formField.type || 'text'}
            value={formValue[formField.name]}
        />
    )
}

export function validateAndUpdate(
    event: FormEvent<HTMLFormElement>,
    form: FormDefinition,
    callback: Dispatch<SetStateAction<FormDefinition>>,
): boolean {
    const input: HTMLInputElement = (event.target as HTMLInputElement)
    return validateAndUpdateInput(input, form, callback)
}

export function validateAndUpdateInput(
    input: HTMLInputElement,
    form: FormDefinition,
    callback: Dispatch<SetStateAction<FormDefinition>>,
    notDirty?: boolean,
): boolean {

    const inputDef: TextInputModel = form[input.name]
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements

    inputDef.dirty = inputDef.dirty || !notDirty
    inputDef.error = undefined
    inputDef.validators
        .forEach(validator => {
            if (!inputDef.error) {
                inputDef.error = validator(input.value, formElements, inputDef.requiredIfField)
            }
        })
    inputDef.value = input.value

    // validate the input's dependent fields as well
    // NOTE: must be VERY careful that this doesn't
    // get stuck in an infinite loop
    inputDef.dependentFields
        ?.forEach(dep => {
            const otherinput: HTMLInputElement = getInput(formElements, dep)
            validateAndUpdateInput(otherinput, form, callback)
        })

    callback({ ...form })
    const formIsNotValid: boolean = Object.keys(form)
        .map(key => form[key])
        .some(i => !!i.error)
    return !formIsNotValid
}

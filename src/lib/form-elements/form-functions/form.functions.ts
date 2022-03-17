import { Dispatch, FormEvent, SetStateAction } from 'react'

import { FormDefinition } from './form-definition.model'
import { TextInputModel } from './text-input.model'

export function getInput(formElements: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formElements.namedItem(fieldName) as HTMLInputElement
}

export function getValue(formElements: HTMLFormControlsCollection, fieldName: string): string {
    return getInput(formElements, fieldName).value
}

export function validateAndUpdate(
    event: FormEvent<HTMLFormElement>,
    form: FormDefinition,
    callback: Dispatch<SetStateAction<FormDefinition>>,
): boolean {
    const input: HTMLInputElement = (event.target as HTMLInputElement)
    return validateAndUpdateInput(input, form, callback)
}

function validateAndUpdateInput(
    input: HTMLInputElement,
    form: FormDefinition,
    callback: Dispatch<SetStateAction<FormDefinition>>,
): boolean {

    const inputDef: TextInputModel = form[input.name]
    const formElements: HTMLFormControlsCollection = (input.form as HTMLFormElement).elements

    inputDef.dirty = true
    inputDef.error = undefined
    inputDef.validators
        .forEach(validator => {
            if (!inputDef.error) {
                inputDef.error = validator(input.value, formElements, inputDef.requiredIfField)
            }
        })

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

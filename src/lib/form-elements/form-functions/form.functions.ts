import { Dispatch, FormEvent, SetStateAction } from 'react'

import { FormDefinition } from './form-definition.model'
import { TextInputModel } from './text-input.model'

export function getInput(formValues: HTMLFormControlsCollection, fieldName: string): HTMLInputElement {
    return formValues.namedItem(fieldName) as HTMLInputElement
}

export function getValue(formValues: HTMLFormControlsCollection, fieldName: string): string {
    return getInput(formValues, fieldName).value
}

export function validateAndUpdate(
    event: FormEvent<HTMLFormElement>,
    form: FormDefinition,
    callback: Dispatch<SetStateAction<FormDefinition>>,
): boolean {

    const input: HTMLInputElement = (event.target as HTMLInputElement)
    const inputDef: TextInputModel = form[input.name]

    inputDef.dirty = true
    inputDef.error = undefined
    inputDef.validators
        .forEach(validator => {
            if (!inputDef.error) {
                inputDef.error = validator(input.value)
            }
        })

    callback({ ...form })
    const formIsNotValid: boolean = Object.keys(form)
        .map(key => form[key])
        .some(i => !!i.error)
    return !formIsNotValid
}

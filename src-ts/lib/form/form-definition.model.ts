import { FormButton, FormGroup, FormInputModel, FormRadioButtonModel } from '.'

export type Field = FormInputModel | FormRadioButtonModel

export interface FormButtons {
    left: ReadonlyArray<FormButton>
    right: ReadonlyArray<FormButton>
}

export interface FormDefinition {
    readonly buttons: FormButtons
    readonly groups?: Array<FormGroup>
    readonly shortName?: string
    readonly subtitle?: string
    readonly successMessage?: string
    readonly tabIndexStart?: number
    readonly title?: string
}

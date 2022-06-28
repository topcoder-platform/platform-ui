import { FormButton } from './form-button.model'
import { FormInputModel } from './form-input.model'

export interface FormDefinition {
    readonly buttons: ReadonlyArray<FormButton>
    readonly inputs: ReadonlyArray<FormInputModel>
    readonly shortName?: string
    readonly subtitle?: string
    readonly successMessage?: string
    readonly tabIndexStart?: number
    readonly title?: string
}

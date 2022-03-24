import { FormButton } from './form-button.model'
import { FormInputModel } from './form-input.model'

export interface FormDefinition {
    readonly buttons: Array<FormButton>
    readonly inputs: Array<FormInputModel>
    readonly title: string
}

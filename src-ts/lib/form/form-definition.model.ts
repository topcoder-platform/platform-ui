import { FormButton } from './form-button.model'
import { FormFieldModel } from './form-field.model'
import { FormInputModel } from './form-input.model'
import { FormSectionModel } from './form-section.model'

export type Element = FormSectionModel | FormFieldModel

export interface FormDefinition {
    // Making the buttons for now optional. When the Bug hunt form is done and once the other places
    // where the forms are adjusted then this
    // prop will be retired
    readonly buttons?: ReadonlyArray<FormButton>
    // This will be used to display the sections and inputs will be part of this
    readonly elements: Array<Element>
    // Input are optional going forward and will be retired soon
    readonly inputs?: ReadonlyArray<FormInputModel>
    // These are buttons which are segragated between the left and right sections in the UI
    readonly leftButtons?: ReadonlyArray<FormButton>
    readonly rightButtons?: ReadonlyArray<FormButton>

    readonly shortName?: string
    readonly subtitle?: string
    readonly successMessage?: string
    readonly tabIndexStart?: number
    readonly title?: string
}

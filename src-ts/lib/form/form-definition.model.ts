import { FormButton, FormGroup } from '.'

export interface FormButtons {
    primaryGroup: ReadonlyArray<FormButton>
    secondaryGroup?: ReadonlyArray<FormButton>
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

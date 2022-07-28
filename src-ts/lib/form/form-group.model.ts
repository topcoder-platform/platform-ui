import { FormInputModel } from './form-input.model'

export interface FormGroup {
  readonly element?: JSX.Element
  inputs?: ReadonlyArray<FormInputModel>
  readonly instructions?: string
  readonly title?: string
}

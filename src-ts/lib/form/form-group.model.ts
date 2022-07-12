import { FormInputModel } from '.'

export interface FormGroup {
  readonly element?: JSX.Element
  fields?: Array<FormInputModel>
  readonly instructions?: string
  readonly title?: string
}

import { Field } from '.'

export interface FormGroup {
  readonly element?: JSX.Element
  fields?: Array<Field>
  readonly instructions?: string
  readonly title?: string
}

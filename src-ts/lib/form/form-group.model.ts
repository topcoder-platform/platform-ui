import { Field } from '.'

export interface FormGroup {
  readonly className?: string
  readonly description?: string
  readonly elements?: Array<JSX.Element>
  fields?: Array<Field>
  readonly title?: string
}

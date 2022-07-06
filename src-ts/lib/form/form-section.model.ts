import { Field } from './form-field.model'

export interface RenderingRule {
  width: 'full' | 'half'
}

export interface FormSectionModel {
  readonly className?: string
  readonly description?: string
  fields: Array<Field>
  readonly renderingRule: RenderingRule
  readonly title?: string
  readonly type: 'section'
}

import { FormInputModel } from '.'
import { FormBannerModel } from './form-banner.model'
import { FormOptionSelectorModel } from './form-option-selector.model'

export type StaticField = FormBannerModel

export type NonStaticField = FormInputModel | FormOptionSelectorModel

export type Field = NonStaticField | StaticField

export enum FormFieldType {
  field = 'field',
}

export interface FormFieldModel {
  field: Field
  readonly type: keyof typeof FormFieldType
}

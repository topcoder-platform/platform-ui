import { FormInputModel } from "./form-input.model";
import { FormOptionSelectorModel } from "./form-option-selector.model";

export type SectionType = {
  byFieldsNumber: 'SoloComponent' | 'MultiComponent'
  byWidth: 'FullWidth' | 'HalfWidth'
};

export interface Section {
  readonly type: SectionType
  readonly description?: string
  readonly title?: string
  readonly className?: string
  fields: Array<FormInputModel | FormOptionSelectorModel>
}
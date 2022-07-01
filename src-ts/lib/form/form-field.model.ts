import { FormInputModel } from ".";
import { FormBannerModel } from "./form-banner.model";
import { FormOptionSelectorModel } from "./form-option-selector.model";

export interface FormFieldModel {
  readonly type: 'field'
  field: FormInputModel | FormOptionSelectorModel | FormBannerModel
}
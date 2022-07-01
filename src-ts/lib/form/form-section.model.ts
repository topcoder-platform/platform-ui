import { FormBannerModel } from "./form-banner.model";
import { FormInputModel } from "./form-input.model";
import { FormOptionSelectorModel } from "./form-option-selector.model";

export type RenderingRule = {
  width: 'full' | 'half'
};

export interface FormSectionModel {
  readonly renderingRule: RenderingRule
  readonly type: 'section'
  readonly description?: string
  readonly title?: string
  readonly className?: string
  fields: Array<FormInputModel | FormOptionSelectorModel | FormBannerModel>
}
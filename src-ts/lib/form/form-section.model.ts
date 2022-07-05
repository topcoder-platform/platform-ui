import { FormBannerModel } from './form-banner.model';
import { FormInputModel } from './form-input.model';
import { FormOptionSelectorModel } from './form-option-selector.model';

export interface RenderingRule {
  width: 'full' | 'half'
};

export interface FormSectionModel {
  readonly className?: string
  readonly description?: string
  fields: Array<FormInputModel | FormOptionSelectorModel | FormBannerModel>
  readonly renderingRule: RenderingRule
  readonly title?: string
  readonly type: 'section'
}
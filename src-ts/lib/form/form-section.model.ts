import { FormInputModel } from "./form-input.model";

export enum SectionTypes {
  SoloComponentSection = 'SoloComponentSection',
  MultiComponentSection = 'MultiComponentSection'
}

export interface Section {
  readonly type: SectionTypes
  readonly description?: string
  readonly title?: string
  fields: Array<FormInputModel>
}
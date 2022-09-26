import { CSSProperties } from 'react'

import { FormInputModel } from './form-input.model'

export interface FormGroup {
  readonly element?: JSX.Element
  inputs?: ReadonlyArray<FormInputModel>
  readonly instructions?: string
  readonly title?: string
}

export interface FormGroupOptions {
  groupWrapStyles?: CSSProperties
  renderGroupDividers?: boolean
}

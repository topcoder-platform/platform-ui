import { ValidatorFn } from './validator-functions'

export interface FormRadioButtonOption {
  checked: boolean
  children: React.FC
  readonly className?: string
  id: string
}

export enum FormRadioButtonTypes {
  radio = 'radio',
  checkbox = 'checkbox',
}

export interface FormRadioButtonModel {
  readonly className?: string
  readonly dependentFields?: Array<string>
  dirty?: boolean
  error?: string
  readonly name: string
  readonly notTabbable: boolean
  onChange?: (optionId: string, checked: boolean) => void
  options: Array<FormRadioButtonOption>
  touched?: boolean
  readonly type: keyof typeof FormRadioButtonTypes
  readonly validators?: ReadonlyArray<ValidatorFn>
  value: boolean
}

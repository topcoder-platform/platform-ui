import { ValidatorFn } from './validator-functions'

export interface OptionSelectorOption {
  checked: boolean
  children: React.FC
  readonly className?: string
  id: string
}

export interface FormOptionSelectorModel {
  readonly className?: string
  readonly dependentFields?: Array<string>
  dirty?: boolean
  error?: string
  readonly isStatic?: boolean
  readonly name: string
  readonly notTabbable: boolean
  onChange?: (optionId: string, checked: boolean) => void
  options: Array<OptionSelectorOption>
  touched?: boolean
  readonly type: 'radio' | 'checkbox'
  readonly validators?: ReadonlyArray<ValidatorFn>
  value: boolean
}

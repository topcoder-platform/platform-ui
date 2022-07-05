export interface OptionSelectorOption {
  checked: boolean
  children: React.FC
  readonly className?: string
  id: string
}

export interface FormOptionSelectorModel {
  readonly className?: string
  readonly name?: string
  onChange?: (optionId: string, checked: boolean) => void
  options: Array<OptionSelectorOption>
  readonly type: 'radio' | 'checkbox'
}
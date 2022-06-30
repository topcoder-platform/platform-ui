export interface OptionSelectorOption {
  children: React.FC
  checked: boolean
  readonly className?: string
}

export interface FormOptionSelectorModel {
  type: 'radio' | 'checkbox'
  options: Array<OptionSelectorOption>
  onChange: (checked: boolean) => void
  readonly className?: string
}
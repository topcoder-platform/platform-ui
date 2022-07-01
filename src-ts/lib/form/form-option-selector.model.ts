export interface OptionSelectorOption {
  children: React.FC
  checked: boolean
  readonly className?: string
}

export interface FormOptionSelectorModel {
  readonly type: 'radio' | 'checkbox'
  readonly name?: string 
  options: Array<OptionSelectorOption>
  onChange?: (checked: boolean) => void
  readonly className?: string
}
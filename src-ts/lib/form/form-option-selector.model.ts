export interface OptionSelectorOption {
  children: React.FC
  id: string
  checked: boolean
  readonly className?: string
}

export interface FormOptionSelectorModel {
  readonly type: 'radio' | 'checkbox'
  readonly name?: string 
  options: Array<OptionSelectorOption>
  onChange?: (optionId: string, checked: boolean) => void
  readonly className?: string
}
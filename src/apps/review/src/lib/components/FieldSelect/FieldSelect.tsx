/**
 * Field Select.
 */
import { ChangeEvent, FC, FocusEvent } from 'react'
import { GroupBase, OptionsOrGroups } from 'react-select'
import classNames from 'classnames'

import { InputSelectOption, InputSelectReact } from '~/libs/ui'

import styles from './FieldSelect.module.scss'

interface Props {
    readonly className?: string
    readonly classNameWrapper?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly onInputChange?: (newValue: string) => void
    readonly options: OptionsOrGroups<unknown, GroupBase<unknown>>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: string
    readonly creatable?: boolean
    readonly createLabel?: (inputValue: string) => string
    readonly onCreateOption?: (inputValue: string) => void
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly openMenuOnClick?: boolean
    readonly openMenuOnFocus?: boolean
    readonly filterOption?: (
        option: InputSelectOption,
        value: string,
    ) => boolean
}

export const FieldSelect: FC<Props> = (props: Props) => (
    <InputSelectReact
        {...props}
        classNameWrapper={classNames(styles.container, props.classNameWrapper)}
    />
)

export default FieldSelect

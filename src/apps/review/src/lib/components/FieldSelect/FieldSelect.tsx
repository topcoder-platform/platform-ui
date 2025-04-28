/**
 * Field Select.
 */
import { FC, FocusEvent } from 'react'
import _ from 'lodash'
import Select from 'react-select'
import classNames from 'classnames'

import { SelectOption } from '../../models'

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
    readonly onChange: (newValue: unknown) => void
    readonly onInputChange?: (newValue: string) => void
    readonly options: SelectOption[]
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: SelectOption | string
    readonly creatable?: boolean
    readonly createLabel?: (inputValue: string) => string
    readonly onCreateOption?: (inputValue: string) => void
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly openMenuOnClick?: boolean
    readonly openMenuOnFocus?: boolean
    readonly filterOption?: (option: SelectOption, value: string) => boolean
}

export const FieldSelect: FC<Props> = (props: Props) => (
    <div className={props.classNameWrapper}>
        {props.label && <label>{props.label}</label>}
        <Select
            {..._.omit(props, ['classNameWrapper', 'label', 'error'])}
            className={classNames(
                'react-select-container',
                props.error ? 'error' : '',
            )}
            classNamePrefix='select'

        />
    </div>
)

export default FieldSelect

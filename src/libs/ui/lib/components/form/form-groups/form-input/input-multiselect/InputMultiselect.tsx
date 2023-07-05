import {
    ChangeEvent,
    FC,
    ReactNode,
} from 'react'
import { noop } from 'lodash'
import { components } from 'react-select'
import AsyncSelect from 'react-select/async'

import { InputWrapper } from '../input-wrapper'
import { IconSolid } from '../../../../svgs'

import styles from './InputMultiselect.module.scss'

export interface InputMultiselectOption {
    label?: ReactNode
    value: string
}

interface InputMultiselectProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly options?: ReadonlyArray<InputMultiselectOption>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: string
    readonly onFetchOptions?: (query: string) => Promise<InputMultiselectOption[]>
}

const MultiValueRemove: FC = (props: any) => (
    <components.MultiValueRemove {...props}>
        <IconSolid.XCircleIcon />
    </components.MultiValueRemove>
)

const InputMultiselect: FC<InputMultiselectProps> = (props: InputMultiselectProps) => {

    function handleOnChange(options: readonly InputMultiselectOption[]): void {
        props.onChange({
            target: { value: options },
        } as unknown as ChangeEvent<HTMLInputElement>)
    }

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={(props.label || props.name) ?? 'Select Option'}
            hideInlineErrors={props.hideInlineErrors}
            type='text'
        >
            <AsyncSelect
                className={styles.multiselect}
                classNamePrefix={styles.ms}
                unstyled
                isMulti
                cacheOptions
                autoFocus
                defaultOptions
                placeholder={props.placeholder}
                loadOptions={props.onFetchOptions}
                name={props.name}
                onChange={handleOnChange}
                onBlur={noop}
                blurInputOnSelect={false}
                components={{
                    // MultiValueLabel: () =>
                    MultiValueRemove,
                }}
            />
        </InputWrapper>
    )
}

export default InputMultiselect

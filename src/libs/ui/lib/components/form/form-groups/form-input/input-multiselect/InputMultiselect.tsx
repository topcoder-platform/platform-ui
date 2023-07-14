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
    verified?: boolean
}

interface InputMultiselectProps {
    readonly dirty?: boolean
    readonly loading?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly limit?: number
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly options?: ReadonlyArray<InputMultiselectOption>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: InputMultiselectOption[]
    readonly onFetchOptions?: (query: string) => Promise<InputMultiselectOption[]>
}

const MultiValueRemove: FC = (props: any) => (
    <components.MultiValueRemove {...props}>
        {props.data.verified ? (
            <span title='Topcoder Verified'>
                <IconSolid.CheckCircleIcon />
            </span>
        ) : (
            <IconSolid.XCircleIcon />
        )}
    </components.MultiValueRemove>
)

const InputMultiselect: FC<InputMultiselectProps> = (props: InputMultiselectProps) => {

    function handleOnChange(options: readonly InputMultiselectOption[]): void {
        props.onChange({
            target: { value: options },
        } as unknown as ChangeEvent<HTMLInputElement>)
    }

    function isOptionDisabled(): boolean {
        return !!props.limit && (props.value?.length as number) >= props.limit
    }

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={(props.label || props.name) ?? 'Select Option'}
            hideInlineErrors={props.hideInlineErrors}
            type='text'
            hint={props.limit ? ` (max ${props.limit})` : undefined}
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
                isLoading={props.loading}
                isOptionDisabled={isOptionDisabled}
                isSearchable={!isOptionDisabled()}
                components={{ MultiValueRemove }}
                value={props.value}
            />
        </InputWrapper>
    )
}

export default InputMultiselect

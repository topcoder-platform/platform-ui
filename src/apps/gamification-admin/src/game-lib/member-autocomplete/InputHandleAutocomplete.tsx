import { get } from 'lodash'
import { FC, FocusEvent } from 'react'
import { MultiValue, StylesConfig } from 'react-select'
import AsyncSelect from 'react-select/async'

import { InputWrapper } from '~/libs/ui'

import { membersAutocompete, MembersAutocompeteResult } from './input-handle-functions'
import styles from './InputHandleAutocomplete.module.scss'

export interface InputHandleAutocompleteProps {
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string | JSX.Element
    readonly name: string
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly onChange: (newValue: Array<MembersAutocompeteResult>) => void
    readonly placeholder?: string
    readonly tabIndex: number
    readonly value?: Array<MembersAutocompeteResult>
}

const InputHandleAutocomplete: FC<InputHandleAutocompleteProps> = (props: InputHandleAutocompleteProps) => {
    const customStyles: StylesConfig<any> = {
        control: provided => ({
            ...provided,
            border: 'none',
            boxShadow: 'none',
        }),
        input: provided => ({
            ...provided,
            color: 'inherit',
            fontSize: 16,
        }),
        multiValue: provided => ({
            ...provided,
            borderRadius: 50,
        }),
        multiValueLabel: provided => ({
            ...provided,
            fontSize: 12,
        }),
        option: provided => ({
            ...provided,
            borderBottom: '1px solid #E9E9E9',
            color: 'inherit',
            fontSize: 16,
            fontWeight: 400,
            padding: 16,
        }),
        placeholder: provided => ({
            ...provided,
            color: 'inherit',
            fontSize: 16,
            fontWeight: 400,
        }),
        valueContainer: provided => ({
            ...provided,
            padding: 0,
        }),
    }

    function getUserProp(key: string): (d: unknown) => string {
        return d => get(d, key)
    }

    function handleChange(newValue: MultiValue<MembersAutocompeteResult>): void {
        props.onChange(newValue as Array<MembersAutocompeteResult>)
    }

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={props.label || props.name}
            hideInlineErrors={props.hideInlineErrors}
            type='text'
        >
            <AsyncSelect
                className={styles.memberSelect}
                cacheOptions
                getOptionLabel={getUserProp('handle')}
                getOptionValue={getUserProp('userId')}
                isMulti
                key={props.value?.length}
                loadOptions={membersAutocompete}
                styles={customStyles}
                placeholder={props.placeholder}
                onBlur={props.onBlur}
                onChange={handleChange}
                value={props.value}
                isDisabled={props.disabled}
            />
        </InputWrapper>
    )
}

export default InputHandleAutocomplete

import { FC, useCallback, useMemo } from 'react'
import {
    useController,
    UseControllerReturn,
    useFormContext,
} from 'react-hook-form'
import AsyncCreatableSelect from 'react-select/async-creatable'
import AsyncSelect from 'react-select/async'
import CreatableSelect from 'react-select/creatable'
import Select from 'react-select'

import { FormFieldWrapper } from '../FormFieldWrapper'

import styles from './FormSelectField.module.scss'

export interface FormSelectOption {
    [key: string]: unknown
    label: string
    value: string
}

type SelectValue = FormSelectOption | FormSelectOption[] | undefined

interface LoadOptionsCallback {
    (inputValue: string): Promise<FormSelectOption[]>
}

export interface FormSelectFieldProps {
    className?: string
    disabled?: boolean
    fromFieldValue?: (
        value: unknown,
        options: FormSelectOption[],
    ) => SelectValue
    hint?: string
    isAsync?: boolean
    isCreatable?: boolean
    isMulti?: boolean
    label: string
    loadOptions?: LoadOptionsCallback
    name: string
    options?: FormSelectOption[]
    placeholder?: string
    required?: boolean
    toFieldValue?: (selected: SelectValue) => unknown
}

function defaultToFieldValue(
    selected: SelectValue,
    isMulti: boolean,
): unknown {
    if (isMulti) {
        return (selected as FormSelectOption[]).map(option => option.value)
    }

    return (selected as FormSelectOption | undefined)?.value || ''
}

function findOptionByValue(
    options: FormSelectOption[],
    value: string,
): FormSelectOption | undefined {
    return options.find(option => option.value === value)
}

function defaultFromFieldValue(
    value: unknown,
    options: FormSelectOption[],
    isMulti: boolean,
): SelectValue {
    if (isMulti) {
        if (!Array.isArray(value)) {
            return []
        }

        return value
            .map(item => {
                if (typeof item === 'string') {
                    return findOptionByValue(options, item) || {
                        label: item,
                        value: item,
                    }
                }

                if (typeof item === 'object' && item && 'value' in item) {
                    return item as FormSelectOption
                }

                return undefined
            })
            .filter((item): item is FormSelectOption => !!item)
    }

    if (typeof value === 'string') {
        return findOptionByValue(options, value)
    }

    if (typeof value === 'object' && value && 'value' in value) {
        return value as FormSelectOption
    }

    return undefined
}

function getSelectComponent(
    isAsync: boolean,
    isCreatable: boolean,
): any {
    if (isAsync && isCreatable) {
        return AsyncCreatableSelect
    }

    if (isAsync) {
        return AsyncSelect
    }

    if (isCreatable) {
        return CreatableSelect
    }

    return Select
}

export const FormSelectField: FC<FormSelectFieldProps> = (props: FormSelectFieldProps) => {
    const formContext = useFormContext()
    const {
        field,
        fieldState,
    }: UseControllerReturn = useController({
        control: formContext.control,
        name: props.name,
    })

    const isAsync = !!props.isAsync
    const isCreatable = !!props.isCreatable
    const isMulti = !!props.isMulti
    const options = props.options || []

    const SelectComponent = useMemo(
        () => getSelectComponent(isAsync, isCreatable),
        [isAsync, isCreatable],
    )

    const menuPortalTarget = useMemo(
        () => (typeof document === 'undefined' ? undefined : document.body),
        [],
    )

    const mappedValue = props.fromFieldValue
        ? props.fromFieldValue(field.value, options)
        : defaultFromFieldValue(field.value, options, isMulti)

    const handleSelectChange = useCallback(
        (selectedValue: SelectValue): void => {
            const normalizedValue = props.toFieldValue
                ? props.toFieldValue(selectedValue)
                : defaultToFieldValue(selectedValue, isMulti)

            field.onChange(normalizedValue)
        },
        [field, isMulti, props],
    )

    return (
        <FormFieldWrapper
            className={props.className}
            error={fieldState.error?.message}
            hint={props.hint}
            label={props.label}
            name={props.name}
            required={props.required}
        >
            <SelectComponent
                className={styles.select}
                classNamePrefix='challenge-select'
                defaultOptions={isAsync}
                id={props.name}
                isDisabled={props.disabled}
                isMulti={isMulti}
                loadOptions={props.loadOptions}
                menuPortalTarget={menuPortalTarget}
                onBlur={field.onBlur}
                onChange={handleSelectChange}
                options={options}
                placeholder={props.placeholder}
                value={mappedValue}
            />
        </FormFieldWrapper>
    )
}

export default FormSelectField

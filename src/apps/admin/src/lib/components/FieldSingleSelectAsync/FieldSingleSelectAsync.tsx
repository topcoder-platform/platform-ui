/**
 * Single Select Field With Async Search.
 */
import { FC, FocusEvent, MutableRefObject, ReactNode, useMemo, useRef } from 'react'
import { components, SingleValue } from 'react-select'
import _ from 'lodash'
import AsyncSelect from 'react-select/async'
import classNames from 'classnames'

import { IconOutline, InputWrapper, LoadingSpinner } from '~/libs/ui'

import { SelectOption } from '../../models'

import styles from './FieldSingleSelectAsync.module.scss'

interface Props {
    label?: string
    className?: string
    classNameWrapper?: string
    placeholder?: string
    readonly value?: SelectOption | null
    readonly onChange?: (event: SelectOption) => void
    readonly disabled?: boolean
    readonly loadOptions?: (
        queryTerm: string,
        callback: (options: SelectOption[]) => void,
    ) => void
    readonly dirty?: boolean
    readonly hint?: string
    readonly hideInlineErrors?: boolean
    readonly error?: string
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly isLoading?: boolean
}

// eslint-disable-next-line react/function-component-definition
const dropdownIndicator
    = (dropdownIcon: ReactNode): FC => function dropdownUI(props: any) {
        return (
            <components.DropdownIndicator
                className={styles.DropdownIndicator}
                {...props}
            >
                {dropdownIcon}
            </components.DropdownIndicator>
        )
    }

export const FieldSingleSelectAsync: FC<Props> = (props: Props) => {
    const wrapRef = useRef<HTMLDivElement>()
    const fetchDatasDebounce = useMemo(
        () => (props.loadOptions ? _.debounce(props.loadOptions, 300) : undefined),
        [props.loadOptions],
    )
    const asyncSelectComponents = useMemo(
        () => ({
            DropdownIndicator: dropdownIndicator(
                <span className={styles['selected-icon']}>
                    <IconOutline.ChevronDownIcon />
                </span>,
            ),
        }),
        [],
    )

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled || (props.isLoading ?? false)}
            hint={props.hint}
            label={props.label ?? ''}
            type='text'
            className={styles['select-input-wrapper']}
            hideInlineErrors={props.hideInlineErrors}
            ref={wrapRef as MutableRefObject<HTMLDivElement>}
        >
            <AsyncSelect
                components={asyncSelectComponents}
                className={classNames(props.className, styles.select)}
                placeholder={props.placeholder ?? 'Enter'}
                menuPortalTarget={document.body}
                classNames={{
                    container: () => styles.select,
                    menuPortal: () => styles.selectUserHandlesDropdownContainer,
                }}
                classNamePrefix={styles.sel}
                onChange={function onChange(value: SingleValue<SelectOption>) {
                    if (value) {
                        props.onChange?.(value)
                    }
                }}
                value={props.value}
                loadOptions={fetchDatasDebounce}
                isDisabled={props.disabled || props.isLoading}
                onBlur={props.onBlur}
            />
            {props.isLoading && (
                <div className={styles.blockActionLoading}>
                    <LoadingSpinner className={styles.spinner} />
                </div>
            )}
        </InputWrapper>
    )
}

export default FieldSingleSelectAsync

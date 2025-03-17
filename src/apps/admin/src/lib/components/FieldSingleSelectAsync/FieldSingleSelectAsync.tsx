/**
 * Input handles selector.
 */
import { FC, MutableRefObject, ReactNode, useMemo, useRef } from 'react'
import { components, SingleValue } from 'react-select'
import _ from 'lodash'
import AsyncSelect from 'react-select/async'
import classNames from 'classnames'

import { IconOutline, InputWrapper } from '~/libs/ui'

import { SelectOption } from '../../models'

import styles from './FieldSingleSelectAsync.module.scss'

interface Props {
    label?: string
    className?: string
    placeholder?: string
    readonly value?: SelectOption
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
            disabled={!!props.disabled}
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
                isDisabled={props.disabled}
            />
        </InputWrapper>
    )
}

export default FieldSingleSelectAsync

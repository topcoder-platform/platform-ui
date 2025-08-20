/**
 * Fidle Single Select.
 */
import {
    FC,
    FocusEvent,
    MutableRefObject,
    ReactNode,
    useMemo,
    useRef,
} from 'react'
import { components, SingleValue } from 'react-select'
import CreatableReactSelect from 'react-select/creatable'
import classNames from 'classnames'

import { IconOutline, InputWrapper, LoadingSpinner } from '~/libs/ui'

import { SelectOption } from '../../models'
import ReactSelect from '../common/ReactSelectExport'

import styles from './FieldSingleSelect.module.scss'

interface Props {
    label?: string
    className?: string
    placeholder?: string
    readonly value?: SelectOption | null
    readonly onChange?: (event: SelectOption) => void
    readonly disabled?: boolean
    readonly dirty?: boolean
    readonly hint?: string
    readonly hideInlineErrors?: boolean
    readonly error?: string
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly options: SelectOption[]
    readonly isLoading?: boolean
    readonly classNameWrapper?: string
    readonly onSearchChange?: (value: string) => void
    readonly creatable?: boolean
    readonly createLabel?: (inputValue: string) => string
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

export const FieldSingleSelect: FC<Props> = (props: Props) => {
    const wrapRef = useRef<HTMLDivElement>()
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

    const Input = useMemo(() => (
        props.creatable ? CreatableReactSelect : ReactSelect
    ), [props.creatable])

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
            <Input
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
                defaultValue={props.value}
                isDisabled={props.disabled || props.isLoading}
                onBlur={props.onBlur}
                options={props.options}
                onInputChange={props.onSearchChange}
                createOptionPosition='first'
                formatCreateLabel={props.createLabel}
            />
            {props.isLoading && (
                <div className={styles.blockActionLoading}>
                    <LoadingSpinner className={styles.spinner} />
                </div>
            )}
        </InputWrapper>
    )
}

export default FieldSingleSelect

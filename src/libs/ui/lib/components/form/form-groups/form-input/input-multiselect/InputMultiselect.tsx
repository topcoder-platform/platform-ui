import {
    ChangeEvent,
    FC,
    KeyboardEvent,
    ReactNode,
    Ref,
    useEffect,
    useMemo,
    useRef,
} from 'react'
import { get, noop } from 'lodash'
import { components, SelectInstance } from 'react-select'
import AsyncSelect from 'react-select/async'
import classNames from 'classnames'

import { InputWrapper } from '../input-wrapper'
import { IconSolid } from '../../../../svgs'

import styles from './InputMultiselect.module.scss'

export interface InputMultiselectOption {
    label?: ReactNode
    value: string
    verified?: boolean
}

export type InputMultiselectThemes = 'tc-green' | 'clear'

export interface InputMultiselectProps {
    readonly autoFocus?: boolean
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly dropdownIcon?: ReactNode
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly limit?: number
    readonly loading?: boolean
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly onFetchOptions?: (query: string) => Promise<InputMultiselectOption[]>
    readonly options?: ReadonlyArray<InputMultiselectOption>
    readonly placeholder?: string
    readonly additionalPlaceholder?: string
    readonly tabIndex?: number
    readonly theme?: InputMultiselectThemes
    readonly useWrapper?: boolean
    readonly value?: InputMultiselectOption[]
    readonly onSubmit?: () => void
    readonly inputRef?: Ref<any>
    // Custom method to filter whether an option should be displayed in the menu
    readonly filterOption?: SelectInstance['filterOption']
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

const Input: FC = (props: any) => {
    const placeholder = props.hasValue && props.selectProps.isSearchable
        ? props.selectProps.placeholder
        : ''

    return (
        <components.Input {...props} placeholder={placeholder} />
    )
}

// eslint-disable-next-line react/function-component-definition
const dropdownIndicator = (dropdownIcon: ReactNode): FC => (props: any) => (
    <components.DropdownIndicator {...props}>
        {dropdownIcon}
    </components.DropdownIndicator>
)

const InputMultiselect: FC<InputMultiselectProps> = props => {
    // we need to create a portal to append our menus so they are always visible
    const menuPortalTarget = useMemo(() => {
        const el = document.getElementById('input-ms-menu-target-portal') ?? document.createElement('div')
        el.id = 'input-ms-menu-target-portal'

        if (!document.body.contains(el)) {
            document.body.append(el)
        }

        return el
    }, [])

    const asynSelectRef = useRef<any>()
    const placeholder = useMemo(() => (
        (props.value?.length as number) > 0 ? props.additionalPlaceholder ?? 'Add more...' : props.placeholder
    ), [props.additionalPlaceholder, props.placeholder, props.value?.length])

    function handleOnChange(options: readonly InputMultiselectOption[]): void {
        props.onChange({
            target: { value: options },
        } as unknown as ChangeEvent<HTMLInputElement>)
    }

    function handleKeyPress(ev: KeyboardEvent<HTMLDivElement>): void {
        const state = (get(props.inputRef ?? asynSelectRef, 'current.state') ?? {}) as SelectInstance['state']
        const isSelectingOptionItem = state.focusedOption
        const hasValue = state.selectValue?.length > 0
        if (ev.key !== 'Enter' || isSelectingOptionItem || !hasValue) {
            return
        }

        props.onSubmit?.()
    }

    const isSearchable = useMemo((): boolean => (
        !props.limit || (props.value?.length as number) < props.limit
    ), [props.limit, props.value?.length])

    // scroll to bottom when the value is loaded / updated
    useEffect(() => {
        if (!asynSelectRef.current) {
            return
        }

        const valueContainerRef: HTMLDivElement = asynSelectRef.current.controlRef.firstChild
        if (valueContainerRef) {
            valueContainerRef.scrollTop = valueContainerRef.scrollHeight
        }
    }, [props.value])

    const selectInputElement = (
        <AsyncSelect
            className={
                classNames(
                    props.className,
                    styles.multiselect,
                    styles[`theme-${props.theme ? props.theme : 'tc-green'}`],
                    props.useWrapper === false && styles.multiSelectWrap,
                )
            }
            classNames={{ valueContainer: () => 'ms--value-container' }}
            ref={props.inputRef ?? asynSelectRef}
            classNamePrefix={styles.ms}
            unstyled
            isMulti
            cacheOptions
            autoFocus={props.autoFocus}
            defaultOptions
            placeholder={placeholder}
            loadOptions={props.onFetchOptions}
            name={props.name}
            onChange={handleOnChange}
            onBlur={noop}
            blurInputOnSelect={false}
            isLoading={props.loading}
            isSearchable={isSearchable}
            components={{
                DropdownIndicator: dropdownIndicator(props.dropdownIcon),
                Input,
                MultiValueRemove,
            }}
            value={props.value}
            openMenuOnClick={false}
            onKeyDown={handleKeyPress}
            filterOption={props.filterOption}
            menuPortalTarget={menuPortalTarget}
        />
    )

    return (props.useWrapper || props.useWrapper === undefined) ? (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            label={(props.label || props.name) ?? 'Select Option'}
            hideInlineErrors={props.hideInlineErrors}
            type='text'
            hint={props.limit ? ` (max ${props.limit})` : undefined}
        >
            {selectInputElement}
        </InputWrapper>
    ) : selectInputElement
}

export default InputMultiselect

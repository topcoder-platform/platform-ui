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

// eslint-disable-next-line react/function-component-definition
const dropdownIndicator = (dropdownIcon: ReactNode): FC => (props: any) => (
    <components.DropdownIndicator {...props}>
        {dropdownIcon}
    </components.DropdownIndicator>
)

// eslint-disable-next-line react/function-component-definition
const valueContainer = (additionalPlaceholder: string): FC => (props: any) => (
    <components.ValueContainer {...props}>
        {props.children}
        {props.hasValue && additionalPlaceholder && (
            <span className={classNames('body-small', styles.additionalPlaceholder)}>
                {additionalPlaceholder}
            </span>
        )}
    </components.ValueContainer>
)

const InputMultiselect: FC<InputMultiselectProps> = props => {
    const asynSelectRef = useRef<any>()

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

    function isOptionDisabled(): boolean {
        return !!props.limit && (props.value?.length as number) >= props.limit
    }

    const ValueContainer = useMemo(() => (
        valueContainer(props.additionalPlaceholder ?? 'Add more...')
    ), [props.additionalPlaceholder])

    // scroll to bottom when the value is loaded / updated
    useEffect(() => {
        if (!asynSelectRef.current) {
            return
        }

        const controlRef: HTMLDivElement = asynSelectRef.current.controlRef
        controlRef.scrollTop = controlRef.scrollHeight
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
            ref={props.inputRef ?? asynSelectRef}
            classNamePrefix={styles.ms}
            unstyled
            isMulti
            cacheOptions
            autoFocus={props.autoFocus}
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
            components={{
                DropdownIndicator: dropdownIndicator(props.dropdownIcon),
                MultiValueRemove,
                ValueContainer,
            }}
            value={props.value}
            openMenuOnClick={false}
            onKeyDown={handleKeyPress}
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

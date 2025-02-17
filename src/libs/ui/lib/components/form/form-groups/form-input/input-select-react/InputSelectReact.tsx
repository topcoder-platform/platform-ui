import {
    ChangeEvent,
    FC,
    FocusEvent,
    MutableRefObject,
    ReactNode,
    useMemo,
    useRef,
} from 'react'
import { find } from 'lodash'
import CreatableSelect from 'react-select/creatable'
import ReactSelect, { GroupBase, OptionsOrGroups } from 'react-select'
import classNames from 'classnames'

import { InputWrapper } from '../input-wrapper'

import styles from './InputSelectReact.module.scss'

export interface InputSelectOption {
    label?: ReactNode
    value: string
}

interface InputSelectReactProps {
    readonly className?: string
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly onInputChange?: (newValue: string) => void
    readonly options: OptionsOrGroups<unknown, GroupBase<unknown>>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: string
    readonly creatable?: boolean
    readonly createLabel?: (inputValue: string) => string
    readonly onCreateOption?: (inputValue: string) => void
    readonly onBlur?: (event: FocusEvent<HTMLInputElement>) => void
    readonly openMenuOnClick?: boolean
    readonly openMenuOnFocus?: boolean
    readonly filterOption?: (option: InputSelectOption, value: string) => boolean
}

/**
 * Finds the nearest ancestor <form> element starting from the given element.
 *
 * @param {HTMLElement} el - The HTML element from which to start searching for the <form> ancestor.
 * @returns {HTMLElement | undefined} The nearest ancestor <form> element, or undefined if not found.
 */
const findParentFrom = (el: HTMLElement): HTMLFormElement | undefined => {
    // If the current element has no parent, return undefined
    if (!el.parentElement) {
        return undefined
    }

    // If the parent element is a <form>, return it
    if (el.parentElement.nodeName === 'FORM') {
        return el.parentElement as HTMLFormElement
    }

    // Recursively search for the <form> ancestor in the parent's hierarchy
    return findParentFrom(el.parentElement)
}

/**
 * Form component that uses <react-select> for rendering,
 * but also accomodates the utilities of the Form under the @ui library
 *
 * Recommended to use this instead of <input-select /> which is not implemented properly
 * (lacks focus on tab, filter options when typing, select option using keyeboard, etc)
 */
const InputSelectReact: FC<InputSelectReactProps> = props => {
    const wrapRef = useRef<HTMLDivElement>()

    // this is the selected option, memoize it once found
    const selected = useMemo(() => {
        if (props.value) {
            return find(props.options, { value: props.value }) as InputSelectOption
        }
        return null; // return null when no valid value is provided
    }, [props.options, props.value])

    // we need to create a portal to append our menus so they are always visible
    const menuPortalTarget = useMemo(() => {
        const el = document.getElementById('input-select-menu-target-portal') ?? document.createElement('div')
        el.id = 'input-select-menu-target-portal'

        if (!document.body.contains(el)) {
            document.body.append(el)
        }

        return el
    }, [])

    // throw the proper event type to the form handler (needs name & form element on target)
    function handleSelect(option: unknown): void {
        props.onChange({
            target: {
                form: findParentFrom(wrapRef.current as HTMLDivElement),
                name: props.name,
                value: (option as InputSelectOption).value,
            },
        } as ChangeEvent<HTMLInputElement>)
    }

    function handleBlur(): void {
        props.onBlur?.({
            target: {
                form: findParentFrom(wrapRef.current as HTMLDivElement) as HTMLFormElement,
                name: props.name,
                value: selected?.value,
            },
        } as FocusEvent<HTMLInputElement>)
    }

    const Input = useMemo(() => (
        props.creatable ? CreatableSelect : ReactSelect
    ), [props.creatable])

    return (
        <InputWrapper
            {...props}
            dirty={!!props.dirty}
            disabled={!!props.disabled}
            hint={props.hint ?? ''}
            label={props.label ?? ''}
            type='text'
            className={styles['select-input-wrapper']}
            hideInlineErrors={props.hideInlineErrors}
            ref={wrapRef as MutableRefObject<HTMLDivElement>}
        >
            <Input
                {...props}
                className={
                    classNames(
                        props.className,
                        styles.select,
                    )
                }
                onChange={handleSelect}
                onInputChange={props.onInputChange}
                menuPortalTarget={menuPortalTarget}
                classNamePrefix={styles.sel}
                tabIndex={props.tabIndex}
                value={selected}
                formatCreateLabel={props.createLabel}
                onCreateOption={props.onCreateOption}
                onBlur={handleBlur}
                backspaceRemovesValue
                isDisabled={props.disabled}
                filterOption={props.filterOption}
            />
        </InputWrapper>
    )
}

export default InputSelectReact

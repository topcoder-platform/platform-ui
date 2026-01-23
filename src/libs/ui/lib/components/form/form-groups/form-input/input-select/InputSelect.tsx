import {
    ChangeEvent,
    Dispatch,
    FC,
    FocusEvent,
    KeyboardEvent,
    MouseEvent,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useEffect,
    useRef,
    useState,
} from 'react'
import { usePopper } from 'react-popper'
import classNames from 'classnames'

import { beforeWrite } from '@popperjs/core/lib'
import { useClickOutside } from '~/libs/shared/lib/hooks'

import { IconOutline } from '../../../../svgs'
import { InputWrapper } from '../input-wrapper'
import { Portal } from '../../../../portal'

import styles from './InputSelect.module.scss'

export interface InputSelectOption {
    label?: ReactNode
    value: string
}

interface InputSelectProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly hint?: string
    readonly label?: string
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly options: ReadonlyArray<InputSelectOption>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly value?: string
    readonly classNameWrapper?: string
    readonly preventAutoFocus?: boolean
}

const sameWidthModifier = {
    effect: ({ state }: any) => {
        state.elements.popper.style.width = `${state.elements.reference.offsetWidth}px`
    },
    enabled: true,
    fn: ({ state }: any) => {
        state.styles.popper.width = `${state.rects.reference.width}px`
        return state
    },
    name: 'sameWidth',
    phase: beforeWrite,
    requires: ['computeStyles'],
}
const modifiers = [sameWidthModifier]

const InputSelect: FC<InputSelectProps> = (props: InputSelectProps) => {
    const hasFocus = useRef<boolean>(false)
    const triggerRef: MutableRefObject<any> = useRef(undefined)
    const popperRef: MutableRefObject<any> = useRef(undefined)
    const buttonRef: MutableRefObject<HTMLButtonElement | null> = useRef(null)
    const [menuIsVisible, setMenuIsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)
    const [isFocus, setIsFocus]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const popper = usePopper(triggerRef.current?.firstChild, popperRef.current, {
        modifiers,
        strategy: 'fixed',
    })

    const selectedOption: InputSelectOption | undefined = props.options.find(option => option.value === props.value)

    const label: (option: InputSelectOption) => ReactNode = (option?: InputSelectOption) => (
        option ? option.label ?? option.value : ''
    )

    const toggleMenu = (toggle?: boolean): void => {
        setTimeout(setMenuIsVisible, 150, (wasVisible: boolean) => {
            const isVisible = typeof toggle === 'boolean' ? toggle : !wasVisible
            if (!isVisible) {
                hasFocus.current = true
                buttonRef.current?.focus()
            }

            return isVisible
        })
    }

    const select: (option: InputSelectOption) => (event: MouseEvent<HTMLDivElement>) => void
    = (option: InputSelectOption) => (
        event: MouseEvent<HTMLDivElement>,
    ) => {
        event.stopPropagation()
        event.preventDefault()
        props.onChange({
            target: { value: option.value },
        } as unknown as ChangeEvent<HTMLInputElement>)
        toggleMenu(false)
    }

    function toggleIfNotDisabled(event:
        MouseEvent<HTMLButtonElement>
        | FocusEvent<HTMLButtonElement>
        | KeyboardEvent<HTMLButtonElement>
        | undefined, toggle?: boolean)
    : void {
        event?.stopPropagation()
        event?.preventDefault()
        if (props.disabled) {
            return
        }

        toggleMenu(toggle)
    }

    useClickOutside(triggerRef.current, () => setMenuIsVisible(false), menuIsVisible)

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement> | undefined): void {
        if (event?.key === 'Enter') {
            toggleIfNotDisabled(event)
        }
    }

    useEffect(() => {
        if (menuIsVisible) {
            popper.update?.()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuIsVisible])

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
            ref={triggerRef}
            forceFocusStyle={menuIsVisible || isFocus}
        >
            <button
                tabIndex={props.tabIndex}
                className={styles.selected}
                onMouseDown={toggleIfNotDisabled}
                onKeyDown={handleKeyDown}
                type='button'
                disabled={!!props.disabled}
                onFocus={function onFocus(event: FocusEvent<HTMLButtonElement> | undefined) {
                    if (hasFocus.current || props.preventAutoFocus) {
                        return
                    }

                    hasFocus.current = true
                    setIsFocus(true)
                    toggleIfNotDisabled(event, true)
                }}
                onBlur={function onBlur() {
                    hasFocus.current = false
                    setIsFocus(false)
                }}
                ref={buttonRef}
            >
                <span className={classNames('body-small', styles.textSelected)}>
                    {selectedOption ? label(selectedOption) : ''}
                </span>
                <span className={classNames('body-small', styles.textSelected)}>
                    {!selectedOption && !!props.placeholder
                        ? props.placeholder
                        : ''}
                </span>
                <span className={styles['selected-icon']}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </button>

            <Portal>
                <div
                    className={styles['menu-wrap']}
                    ref={popperRef}
                    style={popper.styles.popper}
                    {...popper.attributes.popper}
                    tabIndex={-1}
                >
                    {menuIsVisible && (
                        <div className={styles['select-menu']}>
                            {props.options.map(option => (
                                <div
                                    className={
                                        classNames(
                                            styles['select-option'],
                                            'body-main',
                                            selectedOption === option && 'selected',
                                        )
                                    }
                                    onClick={select(option)}
                                    key={option.value}
                                >
                                    {label(option)}
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Portal>

        </InputWrapper>
    )
}

export default InputSelect

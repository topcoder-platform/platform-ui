/* eslint-disable react/jsx-no-bind */
import {
    FC,
    FocusEvent,
    KeyboardEvent,
    MouseEvent,
    MutableRefObject,
    useEffect,
    useLayoutEffect,
    useMemo,
    useRef,
    useState,
} from 'react'
import { usePopper } from 'react-popper'
import classNames from 'classnames'

import { beforeWrite } from '@popperjs/core/lib'
import { useClickOutsideMultipleElements } from '~/libs/shared/lib/hooks'
import { IconOutline, InputCheckbox, InputWrapper, Portal } from '~/libs/ui'

import styles from './FilterCheckboxMultiselect.module.scss'

export interface FilterCheckboxMultiselectOption {
    label: string
    value: string
}

interface FilterCheckboxMultiselectProps {
    readonly className?: string
    readonly displayValueInTrigger?: boolean
    readonly label: string
    readonly name: string
    readonly onChange: (values: string[]) => void
    readonly options: ReadonlyArray<FilterCheckboxMultiselectOption>
    readonly placeholder?: string
    readonly tabIndex?: number
    readonly values: string[]
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

function getDisplayText(
    options: ReadonlyArray<FilterCheckboxMultiselectOption>,
    values: string[],
    displayValueInTrigger: boolean = false,
): string {
    if (options.length === 0) {
        return ''
    }

    if (values.length === 0) {
        return ''
    }

    if (values.length === options.length) {
        return 'All'
    }

    if (values.length === 1) {
        const option = options.find(item => item.value === values[0])

        if (!option) {
            return ''
        }

        if (displayValueInTrigger) {
            return option.value ?? option.label ?? ''
        }

        return option.label ?? option.value ?? ''
    }

    return `${values.length} selected`
}

const FilterCheckboxMultiselect: FC<FilterCheckboxMultiselectProps> = (props: FilterCheckboxMultiselectProps) => {
    const hasFocus = useRef(false)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const triggerRef: MutableRefObject<any> = useRef(undefined)
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const popperRef: MutableRefObject<any> = useRef(undefined)
    const buttonRef = useRef<HTMLButtonElement | null>(null)
    const [menuIsVisible, setMenuIsVisible] = useState(false)
    const [isFocus, setIsFocus] = useState(false)
    const [clickOutsideElements, setClickOutsideElements] = useState<HTMLElement[]>([])

    const popper = usePopper(triggerRef.current?.firstElementChild, popperRef.current, {
        modifiers,
        strategy: 'fixed',
    })

    const allValues = useMemo(
        () => props.options.map(option => option.value),
        [props.options],
    )
    const allSelected = props.options.length > 0 && props.values.length === props.options.length
    const displayText = getDisplayText(
        props.options,
        props.values,
        props.displayValueInTrigger,
    )
    const triggerLabel = displayText || (props.placeholder ?? props.label)

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

    function toggleIfNotDisabled(
        event: MouseEvent<HTMLButtonElement>
        | FocusEvent<HTMLButtonElement>
        | KeyboardEvent<HTMLButtonElement>
        | undefined,
        toggle?: boolean,
    ): void {
        event?.stopPropagation()
        event?.preventDefault()
        toggleMenu(toggle)
    }

    useLayoutEffect(() => {
        if (!menuIsVisible) {
            setClickOutsideElements([])
            return
        }

        const elements: HTMLElement[] = []
        if (triggerRef.current) {
            elements.push(triggerRef.current)
        }

        if (popperRef.current) {
            elements.push(popperRef.current)
        }

        setClickOutsideElements(elements)
    }, [menuIsVisible])

    useClickOutsideMultipleElements(
        clickOutsideElements,
        () => setMenuIsVisible(false),
        menuIsVisible,
    )

    function handleKeyDown(event: KeyboardEvent<HTMLButtonElement> | undefined): void {
        if (event?.key === 'Enter') {
            toggleIfNotDisabled(event)
        }
    }

    function handleSelectAllChange(): void {
        props.onChange(allSelected ? [] : [...allValues])
    }

    function toggleOption(value: string): void {
        if (props.values.includes(value)) {
            props.onChange(props.values.filter(selected => selected !== value))

            return
        }

        props.onChange([...props.values, value])
    }

    useEffect(() => {
        if (menuIsVisible) {
            popper.update?.()
        }
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [menuIsVisible])

    return (
        <InputWrapper
            dirty
            disabled={false}
            hint=''
            label={props.label}
            type='text'
            className={classNames(styles.wrapper, props.className)}
            hideInlineErrors
            ref={triggerRef}
            forceFocusStyle={menuIsVisible || isFocus}
        >
            <button
                tabIndex={props.tabIndex}
                className={styles.trigger}
                onMouseDown={toggleIfNotDisabled}
                onKeyDown={handleKeyDown}
                type='button'
                onFocus={function onFocus(event: FocusEvent<HTMLButtonElement> | undefined) {
                    if (hasFocus.current) {
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
                <span className={classNames('body-small', styles.triggerText)}>
                    {triggerLabel}
                </span>
                <span className={styles.triggerIcon}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </button>

            <Portal>
                <div
                    className={styles.menuWrap}
                    ref={popperRef}
                    style={popper.styles.popper}
                    {...popper.attributes.popper}
                    tabIndex={-1}
                >
                    {menuIsVisible && (
                        <div
                            className={styles.menu}
                            onMouseDown={function onMouseDown(event: MouseEvent<HTMLDivElement>) {
                                event.preventDefault()
                                event.stopPropagation()
                            }}
                            onClick={function onClick(event: MouseEvent<HTMLDivElement>) {
                                event.stopPropagation()
                            }}
                        >
                            <div className={classNames(styles.menuOption, 'body-main')}>
                                <InputCheckbox
                                    name={`${props.name}-select-all`}
                                    label='Select All'
                                    checked={allSelected}
                                    onChange={handleSelectAllChange}
                                />
                            </div>
                            {props.options.map(option => (
                                <div
                                    key={option.value}
                                    className={classNames(styles.menuOption, 'body-main')}
                                >
                                    <InputCheckbox
                                        name={`${props.name}-${option.value}`}
                                        label={option.label}
                                        checked={props.values.includes(option.value)}
                                        onChange={() => toggleOption(option.value)}
                                    />
                                </div>
                            ))}
                        </div>
                    )}
                </div>
            </Portal>
        </InputWrapper>
    )
}

export default FilterCheckboxMultiselect

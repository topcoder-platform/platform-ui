/* eslint-disable ordered-imports/ordered-imports, react/jsx-no-bind */
import classNames from 'classnames'
import {
    FC,
    KeyboardEvent,
    useEffect,
    useId,
    useRef,
    useState,
} from 'react'

import { ReactComponent as ChevronDownIcon } from '../assets/chevron-down.svg'
import styles from './OpportunityFiltersPanel.module.scss'

interface OpportunityRoleOption {
    label: string
    value: string
}

interface OpportunityRoleSelectProps {
    describedBy: string
    onChange: (value: string) => void
    options: OpportunityRoleOption[]
    value: string
}

/**
 * Renders the authored role combobox and its 234-by-160 custom option menu.
 *
 * The control keeps focus on the combobox so pointer, Escape, arrow, Enter,
 * and Space interactions use one predictable selection model.
 *
 * @param props controlled value, available API roles, helper ID, and change callback.
 * @returns accessible role combobox with an in-flow Figma-styled listbox.
 * @throws Does not throw.
 */
export const OpportunityRoleSelect: FC<OpportunityRoleSelectProps> = props => {
    const id = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const selectedIndex = props.options.findIndex(option => option.value === props.value)
    const [activeIndex, setActiveIndex] = useState(Math.max(0, selectedIndex))
    const selected = props.options[selectedIndex]

    useEffect(() => {
        /** Closes the menu when a pointer action begins outside the combobox. */
        const closeOnOutsidePointer = (event: MouseEvent): void => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }

        document.addEventListener('mousedown', closeOnOutsidePointer)
        return () => document.removeEventListener('mousedown', closeOnOutsidePointer)
    }, [])

    /**
     * Commits one role and returns focus behavior to the closed combobox.
     *
     * @param option selected role option.
     * @returns void.
     * @throws Does not throw.
     */
    const selectOption = (option: OpportunityRoleOption): void => {
        props.onChange(option.value)
        setActiveIndex(props.options.indexOf(option))
        setOpen(false)
    }

    /**
     * Implements the WAI-ARIA single-select keyboard interaction on the control.
     *
     * @param event combobox keyboard event.
     * @returns void.
     * @throws Does not throw.
     */
    const handleKeyDown = (event: KeyboardEvent<HTMLButtonElement>): void => {
        if (event.key === 'Escape') {
            setOpen(false)
            return
        }

        if (event.key === 'ArrowDown' || event.key === 'ArrowUp') {
            event.preventDefault()
            const direction = event.key === 'ArrowDown' ? 1 : -1
            setActiveIndex(current => (current + direction + props.options.length) % props.options.length)
            setOpen(true)
            return
        }

        if ((event.key === 'Enter' || event.key === ' ') && open) {
            event.preventDefault()
            selectOption(props.options[activeIndex])
        }
    }

    return (
        <div className={styles.select} ref={rootRef}>
            <button
                aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
                aria-controls={`${id}-listbox`}
                aria-describedby={props.describedBy}
                aria-expanded={open}
                aria-haspopup='listbox'
                aria-label='Role'
                className={classNames(styles.selectControl, {
                    [styles.placeholder]: !selected,
                })}
                onClick={() => setOpen(current => !current)}
                onKeyDown={handleKeyDown}
                role='combobox'
                type='button'
            >
                <span>{selected?.label ?? 'Select option'}</span>
                <ChevronDownIcon aria-hidden='true' />
            </button>
            {open && (
                <div className={styles.roleMenu} id={`${id}-listbox`} role='listbox'>
                    {props.options.map((option, index) => (
                        <button
                            aria-selected={option.value === props.value}
                            className={classNames(styles.roleOption, {
                                [styles.activeRoleOption]: index === activeIndex,
                            })}
                            id={`${id}-option-${index}`}
                            key={option.value}
                            onClick={() => selectOption(option)}
                            onMouseEnter={() => setActiveIndex(index)}
                            role='option'
                            type='button'
                        >
                            {option.label}
                        </button>
                    ))}
                </div>
            )}
        </div>
    )
}

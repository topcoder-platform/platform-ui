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

import { OpportunitySortOption } from '../utils/opportunity-listing.utils'

import { ReactComponent as ChevronDownIcon } from '../assets/chevron-down.svg'
import styles from './OpportunitySortSelect.module.scss'

interface OpportunitySortSelectProps {
    onChange: (value: string) => void
    options: OpportunitySortOption[]
    value: string
}

/**
 * Renders a controlled sort combobox whose authored menu spacing is consistent
 * across browsers.
 *
 * @param props selected sort, available choices, and change callback.
 * @returns accessible single-select sort listbox.
 * @throws Does not throw.
 */
export const OpportunitySortSelect: FC<OpportunitySortSelectProps> = props => {
    const id = useId()
    const rootRef = useRef<HTMLDivElement>(null)
    const [open, setOpen] = useState(false)
    const selectedIndex = Math.max(0, props.options.findIndex(option => option.value === props.value))
    const [activeIndex, setActiveIndex] = useState(selectedIndex)
    const selected = props.options[selectedIndex]

    useEffect(() => {
        /** Closes the sort menu when a pointer action begins outside it. */
        const closeOnOutsidePointer = (event: MouseEvent): void => {
            if (!rootRef.current?.contains(event.target as Node)) setOpen(false)
        }

        document.addEventListener('mousedown', closeOnOutsidePointer)
        return () => document.removeEventListener('mousedown', closeOnOutsidePointer)
    }, [])

    useEffect(() => setActiveIndex(selectedIndex), [selectedIndex])

    /** Commits one sort option and closes the menu. */
    const selectOption = (option: OpportunitySortOption): void => {
        props.onChange(option.value)
        setActiveIndex(props.options.indexOf(option))
        setOpen(false)
    }

    /** Implements pointer-equivalent keyboard behavior for the listbox. */
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
        <div className={styles.root} ref={rootRef}>
            <button
                aria-activedescendant={open ? `${id}-option-${activeIndex}` : undefined}
                aria-controls={`${id}-listbox`}
                aria-expanded={open}
                aria-haspopup='listbox'
                aria-label='Sort opportunities'
                className={styles.control}
                onClick={() => {
                    setActiveIndex(selectedIndex)
                    setOpen(current => !current)
                }}
                onKeyDown={handleKeyDown}
                role='combobox'
                type='button'
            >
                <span>{selected?.label ?? 'Select sort'}</span>
                <ChevronDownIcon aria-hidden='true' />
            </button>
            {open && (
                <div className={styles.menu} id={`${id}-listbox`} role='listbox'>
                    {props.options.map((option, index) => (
                        <button
                            aria-selected={option.value === props.value}
                            className={classNames(styles.option, {
                                [styles.activeOption]: index === activeIndex,
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

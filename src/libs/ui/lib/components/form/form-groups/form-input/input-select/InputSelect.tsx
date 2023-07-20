import {
    ChangeEvent,
    Dispatch,
    FC,
    FocusEvent,
    MouseEvent,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useRef,
    useState,
} from 'react'
import classNames from 'classnames'

import { useClickOutside } from '~/libs/shared/lib/hooks'

import { IconOutline } from '../../../../svgs'
import { InputWrapper } from '../input-wrapper'

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
}

const InputSelect: FC<InputSelectProps> = (props: InputSelectProps) => {
    const triggerRef: MutableRefObject<any> = useRef(undefined)
    const [menuIsVisible, setMenuIsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const selectedOption: InputSelectOption | undefined = props.options.find(option => option.value === props.value)

    const label: (option: InputSelectOption) => ReactNode = (option?: InputSelectOption) => (
        option ? option.label ?? option.value : ''
    )

    const toggleMenu: () => void = () => setMenuIsVisible(wasVisible => !wasVisible)

    const select: (option: InputSelectOption) => (event: MouseEvent<HTMLDivElement>) => void
    = (option: InputSelectOption) => (
        event: MouseEvent<HTMLDivElement>,
    ) => {
        event.stopPropagation()
        event.preventDefault()
        props.onChange({
            target: { value: option.value },
        } as unknown as ChangeEvent<HTMLInputElement>)
        toggleMenu()
    }

    function toggleIfNotDisabled(): void {
        if (props.disabled) {
            return
        }

        toggleMenu()
    }

    useClickOutside(triggerRef.current, () => setMenuIsVisible(false))

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
            forceFocusStyle={menuIsVisible}
        >
            <button
                tabIndex={props.tabIndex}
                className={styles.selected}
                onClick={toggleIfNotDisabled}
                type='button'
                disabled={!!props.disabled}
                onFocus={function onFocus(event: FocusEvent<HTMLButtonElement> | undefined) {
                    event?.stopPropagation()
                    event?.preventDefault()
                    setMenuIsVisible(true)
                }}
            >
                <span className='body-small'>{selectedOption ? label(selectedOption) : ''}</span>
                <span className='body-small'>{!selectedOption && !!props.placeholder ? props.placeholder : ''}</span>
                <span className={styles['selected-icon']}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </button>

            <div className={styles['menu-wrap']}>
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

        </InputWrapper>
    )
}

export default InputSelect

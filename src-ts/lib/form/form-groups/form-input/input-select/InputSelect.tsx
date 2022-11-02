import classNames from 'classnames'
import {
    ChangeEvent,
    Dispatch,
    FC,
    MutableRefObject,
    ReactNode,
    SetStateAction,
    useRef,
    useState,
} from 'react'

import { useClickOutside } from '../../../../hooks'
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

    const toggleMenu: () => void = () => setMenuIsVisible((wasVisible) => !wasVisible)

    const select: (option: InputSelectOption) => () => void = (option: InputSelectOption) => () => {
        props.onChange({
            target: {value: option.value} ,
        } as unknown as ChangeEvent<HTMLInputElement>)
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
        >
            <div className={styles['selected']} onClick={() => !props.disabled && toggleMenu()}>
                <span className='body-small'>{selectedOption ? label(selectedOption) : ''}</span>
                <span className={styles['selected-icon']}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </div>

            <div className={styles['menu-wrap']}>
                {menuIsVisible && (
                    <div className={styles['select-menu']}>
                        {props.options.map((option) => (
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

import classNames from 'classnames'
import {
    ChangeEvent,
    FC,
    ReactNode,
    useState,
    Dispatch,
    SetStateAction,
    MutableRefObject,
    useRef,
} from 'react'
import { useClickOutside } from '../../../../hooks'
import { IconOutline } from '../../../../svgs'
import { InputWrapper } from '../input-wrapper'

import styles from './InputSelect.module.scss'

export interface InputSelectOption {
    value: string
    label?: ReactNode
}

interface InputSelectProps {
    readonly dirty?: boolean
    readonly disabled?: boolean
    readonly error?: string
    readonly hideInlineErrors?: boolean
    readonly name: string
    readonly onChange: (event: ChangeEvent<HTMLInputElement>) => void
    readonly tabIndex?: number
    readonly value?: string
    readonly options: Array<InputSelectOption>
    readonly label?: string
    readonly hint?: string
}

const InputSelect: FC<InputSelectProps> = (props: InputSelectProps) => {
    const triggerRef: MutableRefObject<any> = useRef(undefined)
    const [menuIsVisible, setMenuIsVisible]: [boolean, Dispatch<SetStateAction<boolean>>] = useState(false)

    const selectedOption = props.options.find(option => option.value === props.value);

    const label = (option?: InputSelectOption) => option ? option.label ?? option.value : ''

    const toggleMenu = () => setMenuIsVisible((wasVisible) => !wasVisible)

    const select = (option: InputSelectOption) => () => {
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
            <div className={styles['selected']} onClick={toggleMenu}>
                <span className='body-small'>{label(selectedOption)}</span>
                <span className={styles['selected-icon']}>
                    <IconOutline.ChevronDownIcon />
                </span>
            </div>

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

        </InputWrapper>
    )
}

export default InputSelect

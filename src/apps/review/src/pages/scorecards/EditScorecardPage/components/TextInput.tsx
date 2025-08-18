import { ChangeEventHandler, FC } from 'react'
import classNames from 'classnames'

import styles from './TextInput.module.scss'
import { InputWrapper } from '~/libs/ui'

interface TextInputProps {
    label?: string
    type?: 'password' | 'text' | 'number'
    value?: string
    onChange?: ChangeEventHandler<HTMLInputElement>
    placeholder?: string
}

const TextInput: FC<TextInputProps> = props => {
    const type = props.type ?? 'text'
    return (
        <InputWrapper
            type={type}
            className={styles.inputWrapper}
        >
            <input
                className={classNames(styles.inputText, 'body-small')}
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                type={type}
            />
        </InputWrapper>
    )
}

export default TextInput

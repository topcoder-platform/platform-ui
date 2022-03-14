import classNames from 'classnames'
import { FC } from 'react'

import styles from './Text-Input.module.scss'

interface TextInputProps {
    defaultValue?: string
    name: string
    props: { [attr: string]: string | boolean }
    styleName?: string
}

const TextInput: FC<TextInputProps> = (props: TextInputProps) => {
    return (
        <input
            className={classNames(styles['form-input-text'], props.styleName || '')}
            name={props.name}
            type='text'
            {...props.props}
        />
    )
}

export default TextInput

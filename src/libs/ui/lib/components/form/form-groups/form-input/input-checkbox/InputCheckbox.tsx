import { FC, useRef } from 'react'
import { uniqueId } from 'lodash'
import CheckBox from 'rc-checkbox'
import classNames from 'classnames'

import styles from './InputCheckbox.module.scss'

interface InputCheckboxProps {
    readonly accent?: 'blue' | 'green'
    readonly checked?: boolean
    readonly disabled?: boolean
    readonly name: string
    readonly onChange: (event: Event) => void
    readonly value?: string
    readonly id?: string
    readonly label?: string
    readonly onClick?: () => void
}

const InputCheckbox: FC<InputCheckboxProps> = props => {
    const uid = useRef(uniqueId())

    if (props.id && props.id !== uid.current) {
        uid.current = props.id
    }

    return (
        <div className={styles.container}>
            <CheckBox
                checked={props.checked}
                disabled={!!props.disabled}
                name={props.name}
                onChange={props.onChange}
                value={props.value}
                id={uid.current}
                className={classNames(styles.checkbox, styles[`${props.accent ?? 'green'}Accent`])}
                onClick={props.onClick}
            />
            {props.label && (
                <label className='body-small' htmlFor={uid.current}>{props.label}</label>
            )}
        </div>
    )
}

export default InputCheckbox

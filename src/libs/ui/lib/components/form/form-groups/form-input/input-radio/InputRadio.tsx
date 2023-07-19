import { FC, FocusEvent } from 'react'

import styles from './InputRadio.module.scss'

interface InputRadioProps {
    readonly checked?: boolean
    readonly disabled?: boolean
    readonly name: string
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
    readonly value: string
    readonly id: string
    readonly label?: string
}

const InputRadio: FC<InputRadioProps> = (props: InputRadioProps) => (
    <div className={styles.container}>
        <input
            checked={props.checked}
            disabled={!!props.disabled}
            name={props.name}
            onChange={props.onChange}
            type='radio'
            value={props.value}
            id={props.id}
        />
        {
            props.label && (
                <label htmlFor={props.id}>{props.label}</label>
            )
        }
    </div>
)

export default InputRadio

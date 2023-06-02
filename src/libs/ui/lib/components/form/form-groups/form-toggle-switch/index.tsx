import React, { FocusEvent } from 'react'
import classNames from 'classnames'

import styles from './FormToggleSwitch.module.scss'

interface FormToggleSwitchProps {
    readonly disabled?: boolean
    readonly name: string
    readonly onChange: (event: FocusEvent<HTMLInputElement>) => void
    readonly value: boolean
}

const FormToggleSwitch: React.FC<FormToggleSwitchProps> = (props: FormToggleSwitchProps) => (
    <div className={classNames(styles.formToggle, props.disabled ? styles.disabled : '')}>
        <input
            className={styles.checkbox}
            disabled={props.disabled}
            type='checkbox'
            name={props.name}
            onChange={props.onChange}
            value={props.value ? 'on' : 'off'}
            checked={props.value}
            id={`${props.name}-id`}
        />
        <label className={styles.label} htmlFor={`${props.name}-id`}>
            <span className={styles.inner} />
            <span className={styles.switch} />
        </label>
    </div>
)

export default FormToggleSwitch

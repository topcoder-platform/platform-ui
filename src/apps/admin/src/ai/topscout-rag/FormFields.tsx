/**
 * Field primitives for this page.
 *
 * The platform's `InputText`/`InputSelect` render their label *inside* the
 * bordered box (InputWrapper puts it in the `<label>` above the control), which
 * is not the look this page's design calls for — labels belong above the box.
 * `InputSelect` can be silenced with `label=''`, but `InputText` falls back to
 * `label || name` and would print the field's `name` instead, so text inputs
 * here compose `InputWrapper` with a plain `<input>` directly.
 */
import { ChangeEvent, FC, PropsWithChildren } from 'react'
import classNames from 'classnames'

import { InputWrapper } from '~/libs/ui'

import styles from './FormFields.module.scss'

interface FieldProps {
    label: string
    /** Optional helper text rendered under the control. */
    hint?: string
}

/** Wraps any control with an external label, e.g. an `InputSelect label=''`. */
export const Field: FC<PropsWithChildren<FieldProps>> = props => (
    <div className={styles.field}>
        <span className={styles.fieldLabel}>{props.label}</span>
        {props.children}
        {props.hint && <span className={styles.fieldHint}>{props.hint}</span>}
    </div>
)

interface TextFieldProps extends FieldProps {
    value: string
    onChange: (event: ChangeEvent<HTMLInputElement>) => void
    placeholder?: string
    disabled?: boolean
}

export const TextField: FC<TextFieldProps> = props => (
    <Field label={props.label} hint={props.hint}>
        <InputWrapper dirty={false} disabled={!!props.disabled} label='' type='text'>
            <input
                className={classNames(styles.input, 'body-small')}
                type='text'
                value={props.value}
                onChange={props.onChange}
                placeholder={props.placeholder}
                disabled={props.disabled}
            />
        </InputWrapper>
    </Field>
)

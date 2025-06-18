/**
 * Input Text.
 */
import { FC } from 'react'
import classNames from 'classnames'

import { InputText } from '~/libs/ui'
import { InputTextProps } from '~/libs/ui/lib/components/form/form-groups/form-input/input-text/InputText'

import styles from './InputTextAdmin.module.scss'

export const InputTextAdmin: FC<InputTextProps> = (props: InputTextProps) => (
    <InputText
        {...props}
        onChange={props.onChange as any}
        classNameWrapper={classNames(
            props.classNameWrapper,
            styles.container,
        )}
    />
)

export default InputTextAdmin

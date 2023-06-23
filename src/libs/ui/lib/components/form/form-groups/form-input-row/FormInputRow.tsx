import { ReactNode } from 'react'
import classNames from 'classnames'

import { FormInputModel } from '../../form-input.model'
import '../../../../styles/index.scss'

import styles from './FormInputRow.module.scss'

interface FormInputRowProps {
    children: ReactNode
    index: number
    input: FormInputModel
}

const FormInputRow: (props: FormInputRowProps) => JSX.Element
= (props: FormInputRowProps) => {

    // if there is no title or instructions, just return the children
    if (!props.input.instructions && !props.input.title) {
        return (
            <>
                {props.children}
            </>
        )
    }

    const title: JSX.Element = !props.input.title
        ? <></>
        : (
            <h4 className={styles[`input-title-${props.index}`]}>
                {props.input.title}
            </h4>
        )

    const inputRow: JSX.Element = !props.input.instructions
        ? (
            <div>
                {props.children}
            </div>
        )
        : (
            <div className={styles['input-row']}>
                <div className={classNames(
                    styles['input-instructions'],
                    styles[props.input.type],
                    'body-small',
                    'font-black-40',
                )}
                >
                    {props.input.instructions}
                </div>
                <div className={styles.input}>
                    {props.children}
                </div>
            </div>
        )

    return (
        <div className={styles['row-wrap']}>
            {title}
            {inputRow}
        </div>
    )
}

export default FormInputRow

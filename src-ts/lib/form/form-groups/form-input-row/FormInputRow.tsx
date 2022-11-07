import classNames from 'classnames'
import { ReactNode } from 'react'

import "../../../styles/index.scss"
import { FormInputModel } from '../../form-input.model'

import styles from './FormInputRow.module.scss'

interface FormInputRowProps {
    children: ReactNode
    index: number
    input: FormInputModel
}

const FormInputRow: (props: FormInputRowProps) => JSX.Element = (props: FormInputRowProps) => {

    const { children, index, input }: FormInputRowProps = props

    // if there is no title or instructions, just return the children
    if (!input.instructions && !input.title) {
        return (
            <>
                {children}
            </>
        )
    }

    const title: JSX.Element = !input.title
        ? <></>
        : (
            <h4 className={styles[`input-title-${index}`]}>
                {input.title}
            </h4>
        )

    const inputRow: JSX.Element = !input.instructions
        ? (
            <div>
                {children}
            </div>
        )
        : (
            <div className={styles['input-row']}>
                <div className={classNames(
                    styles['input-instructions'],
                    styles[input.type],
                    'body-small',
                    'font-black-40'
                )}>
                    {input.instructions}
                </div>
                <div className={styles.input}>
                    {children}
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

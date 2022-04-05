import { ReactNode } from 'react'

import '../../../../lib/styles/index.scss'
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

    const inputElement: JSX.Element = <div>{children}</div>

    const inputRow: JSX.Element = !input.instructions
        ? inputElement
        : (
            <div className={styles['input-row']}>
                <div className={'body-small font-black-40'}>
                    {input.instructions}
                </div>
                {inputElement}
            </div>
        )

    return (
        <div>
            {title}
            {inputRow}
        </div>
    )
}

export default FormInputRow

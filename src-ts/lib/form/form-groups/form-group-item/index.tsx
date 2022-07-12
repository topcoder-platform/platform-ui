import cn from 'classnames'
import React from 'react'

import { Field, FormGroup } from '../..'

import styles from './FormGroupItem.module.scss'

interface FormGroupItemProps {
    group: FormGroup
    renderFormInput: (input: Field, index: number) => JSX.Element | undefined
}

const FromGroupItem: React.FC<FormGroupItemProps> = ({group, renderFormInput}: FormGroupItemProps) => {
    const { instructions, title, fields }: FormGroup = group

    const inputFields: Array<JSX.Element | undefined> = fields?.map((field: Field, index: number) => renderFormInput(field as Field, index)) || []

    const isMultiFieldGroup: boolean = !!(title || instructions)

    return (
        <div className={cn(styles['form-group-item'], !isMultiFieldGroup && styles['single-field'])}>
            {
                isMultiFieldGroup && (
                    <div className={styles['left']}>
                        <div className={styles['title']}>
                            {title}
                        </div>
                        <div className={styles['group-item-instruction']} dangerouslySetInnerHTML={{__html: instructions || ''}}/>
                    </div>
                )
            }
            <div className={cn(styles['right'])}>
                {inputFields}
            </div>
        </div>
    )
}

export default FromGroupItem

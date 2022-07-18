import cn from 'classnames'
import React from 'react'

import { FormGroup } from '../../form-group.model'
import { FormInputModel } from '../../form-input.model'

import styles from './FormGroupItem.module.scss'

interface FormGroupItemProps {
    group: FormGroup
    renderFormInput: (input: FormInputModel, index: number) => JSX.Element | undefined
}

const FromGroupItem: React.FC<FormGroupItemProps> = ({group, renderFormInput}: FormGroupItemProps) => {
    const { instructions, title, inputs }: FormGroup = group

    const formInputs: Array<JSX.Element | undefined> = inputs?.map((field: FormInputModel, index: number) => renderFormInput(field as FormInputModel, index)) || []

    const isMultiFieldGroup: boolean = !!(title || instructions)

    return (
        <div className={cn(styles['form-group-item'], !isMultiFieldGroup && styles['single-field'])}>
            {
                isMultiFieldGroup && (
                    <div className={styles['left']}>
                        <h3 className={cn(styles['title'])}>
                            {title}
                        </h3>
                        <div className={styles['group-item-instructions']} dangerouslySetInnerHTML={{__html: instructions || ''}}/>
                    </div>
                )
            }
            <div className={cn(styles['right'])}>
                {formInputs}
            </div>
        </div>
    )
}

export default FromGroupItem

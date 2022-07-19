import cn from 'classnames'
import React from 'react'

import { FormGroup } from '../../form-group.model'
import { FormInputModel } from '../../form-input.model'

import styles from './FormGroupItem.module.scss'

interface FormGroupItemProps {
    group: FormGroup
    renderFormInput: (input: FormInputModel, index: number) => JSX.Element | undefined
}

interface ItemRowProps {
    formInputs: Array<JSX.Element | undefined>,
    instructions?: string | undefined,
    isMultiFieldGroup: boolean,
    title?: string,
}

const TwoColumnItem: React.FC<ItemRowProps> = ({formInputs, instructions, isMultiFieldGroup, title}: ItemRowProps) => {
    return (
        <div className={cn(styles['form-group-item'], !isMultiFieldGroup && styles['single-field'])}>
            {
                isMultiFieldGroup && (
                    <div className={styles['left']}>
                        <h3 className={styles['title']}>
                            {title}
                        </h3>
                        <div className={styles['group-item-instructions']} dangerouslySetInnerHTML={{__html: instructions || ''}}/>
                    </div>
                )
            }
            <div className={styles['right']}>
                {formInputs}
            </div>
        </div>
    )
}

const SingleColumnItem: React.FC<ItemRowProps> = ({formInputs, instructions, isMultiFieldGroup, title}: ItemRowProps) => {
    return (
        <div className={cn(styles['form-group-item'], styles['full-width-container'])}>
            <div>
            {
                isMultiFieldGroup && (
                    <>
                        <h3 className={styles['title']}>
                            {title}
                        </h3>
                        <div className={styles['group-item-instructions']} dangerouslySetInnerHTML={{__html: instructions || ''}}/>
                    </>
                )
            }
                <div className={styles['full-width-items']}>{formInputs}</div>
            </div>
        </div>
    )
}

const FromGroupItem: React.FC<FormGroupItemProps> = ({group, renderFormInput}: FormGroupItemProps) => {
    const { instructions, title, inputs }: FormGroup = group

    const formInputs: Array<JSX.Element | undefined> = inputs?.map((field: FormInputModel, index: number) => renderFormInput(field as FormInputModel, index)) || []
    const isMultiFieldGroup: boolean = !!(title || instructions)
    const isCardSet: boolean = !!(inputs && inputs.every(input => typeof input.cards !== 'undefined'))

    return isCardSet ?
    <SingleColumnItem instructions={instructions} isMultiFieldGroup={isMultiFieldGroup} formInputs={formInputs} title={title} /> :
    <TwoColumnItem instructions={instructions} isMultiFieldGroup={isMultiFieldGroup} formInputs={formInputs} title={title} />
}

export default FromGroupItem

import cn from 'classnames'
import React from 'react'

import { PageDivider } from '../../../page-divider'
import { FormGroup } from '../../form-group.model'
import { FormInputModel } from '../../form-input.model'

import styles from './FormGroupItem.module.scss'

interface FormGroupItemProps {
    group: FormGroup
    renderDividers?: boolean
    renderFormInput: (input: FormInputModel, index: number) => JSX.Element | undefined
    totalGroupCount: number
}

interface ItemRowProps {
    element?: JSX.Element,
    formInputs: Array<JSX.Element | undefined>,
    hasMultipleGroups: boolean,
    instructions?: string | undefined,
    isMultiFieldGroup: boolean,
    renderDividers?: boolean
    title?: string,
}

const TwoColumnItem: React.FC<ItemRowProps> = ({ element, formInputs, hasMultipleGroups, instructions, isMultiFieldGroup, title, renderDividers }: ItemRowProps) => (
    <>
        <div className={cn(styles['form-group-item'], !isMultiFieldGroup && styles['single-field'])}>
            {
                isMultiFieldGroup && (
                    <div className={styles.left}>
                        <h3 className={styles.title}>
                            {title}
                        </h3>
                        <div className={styles['group-item-instructions']} dangerouslySetInnerHTML={{ __html: instructions || '' }} />
                    </div>
                )
            }
            {element}
            <div className={styles.right}>
                {formInputs}
            </div>
        </div>
        {
            renderDividers !== false && <PageDivider styleNames={[!hasMultipleGroups ? 'spacingSmall' : '']} />
        }
    </>
)

const SingleColumnItem: React.FC<ItemRowProps> = ({ formInputs, hasMultipleGroups, instructions, isMultiFieldGroup, title }: ItemRowProps) => (
    <>
        <div className={cn(styles['form-group-item'], styles['full-width-container'])}>
            {
                isMultiFieldGroup && (
                    <>
                        <h3 className={styles.title}>
                            {title}
                        </h3>
                        <div className={styles['group-item-instructions']} dangerouslySetInnerHTML={{ __html: instructions || '' }} />
                    </>
                )
            }
            <div className={styles['full-width-items']}>{formInputs}</div>
        </div>
        <PageDivider styleNames={[!hasMultipleGroups ? 'spacingSmall' : '']} />
    </>
)

const FormGroupItem: React.FC<FormGroupItemProps> = ({ group, renderDividers, renderFormInput, totalGroupCount }: FormGroupItemProps) => {
    const { instructions, title, inputs, element }: FormGroup = group

    const formInputs: Array<JSX.Element | undefined> = inputs?.map((field: FormInputModel, index: number) => renderFormInput(field as FormInputModel, index)) || []
    const hasMultipleGroups: boolean = totalGroupCount > 1
    const isMultiFieldGroup: boolean = !!(title || instructions)
    const isCardSet: boolean = !!(inputs && inputs.every(input => typeof input.cards !== 'undefined'))

    return isCardSet ?
        <SingleColumnItem hasMultipleGroups={hasMultipleGroups} instructions={instructions} isMultiFieldGroup={isMultiFieldGroup} formInputs={formInputs} title={title} /> :
        <TwoColumnItem hasMultipleGroups={hasMultipleGroups} element={element} instructions={instructions} isMultiFieldGroup={isMultiFieldGroup} formInputs={formInputs} title={title} renderDividers={renderDividers} />
}

export default FormGroupItem

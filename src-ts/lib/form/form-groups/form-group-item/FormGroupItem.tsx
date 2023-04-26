import React, { FC, ReactElement } from 'react'
import cn from 'classnames'

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
    // eslint-disable-next-line react/no-unused-prop-types
    element?: JSX.Element,
    formInputs: Array<JSX.Element | undefined>,
    hasMultipleGroups: boolean,
    instructions?: string | undefined,
    isMultiFieldGroup: boolean,
    // eslint-disable-next-line react/no-unused-prop-types
    renderDividers?: boolean
    title?: string,
}

const SingleColumnItem: React.FC<ItemRowProps> = (props: ItemRowProps) => (
    <>
        <div className={cn(styles['form-group-item'], styles['full-width-container'])}>
            {
                props.isMultiFieldGroup && (
                    <>
                        <h3 className={styles.title}>
                            {props.title}
                        </h3>
                        <div
                            className={styles['group-item-instructions']}
                            dangerouslySetInnerHTML={{ __html: props.instructions || '' }}
                        />
                    </>
                )
            }
            <div className={styles['full-width-items']}>{props.formInputs}</div>
        </div>
        <PageDivider styleNames={[!props.hasMultipleGroups ? 'spacingSmall' : '']} />
    </>
)

const TwoColumnItem: React.FC<ItemRowProps> = (props: ItemRowProps) => (
    <>
        <div className={cn(styles['form-group-item'], !props.isMultiFieldGroup && styles['single-field'])}>
            {
                props.isMultiFieldGroup && (
                    <div className={styles.left}>
                        <h3 className={styles.title}>
                            {props.title}
                        </h3>
                        <div
                            className={styles['group-item-instructions']}
                            dangerouslySetInnerHTML={{ __html: props.instructions || '' }}
                        />
                    </div>
                )
            }
            {props.element}
            <div className={styles.right}>
                {props.formInputs}
            </div>
        </div>
        {
            props.renderDividers !== false && (
                <PageDivider styleNames={[!props.hasMultipleGroups ? 'spacingSmall' : '']} />
            )
        }
    </>
)

const FormGroupItem: FC<FormGroupItemProps> = (props: FormGroupItemProps) => {
    const { instructions, title, inputs, element }: FormGroup = props.group

    const formInputs: Array<JSX.Element | undefined>
        = inputs?.map((field: FormInputModel, index: number) => (
            props.renderFormInput(field as FormInputModel, index)
        )) || []
    const hasMultipleGroups: boolean = props.totalGroupCount > 1
    const isMultiFieldGroup: boolean = !!(title || instructions)
    const isCardSet: boolean = !!(inputs && inputs.every(input => typeof input.cards !== 'undefined'))

    function renderSingleColumnItem(): ReactElement<any, any> | null {
        return (
            <SingleColumnItem
                hasMultipleGroups={hasMultipleGroups}
                instructions={instructions}
                isMultiFieldGroup={isMultiFieldGroup}
                formInputs={formInputs}
                title={title}
            />
        )
    }

    function renderTwoColumnItem(): ReactElement<any, any> | null {
        return (
            <TwoColumnItem
                hasMultipleGroups={hasMultipleGroups}
                element={element}
                instructions={instructions}
                isMultiFieldGroup={isMultiFieldGroup}
                formInputs={formInputs}
                title={title}
                renderDividers={props.renderDividers}
            />
        )
    }

    return isCardSet ? renderSingleColumnItem() : renderTwoColumnItem()
}

export default FormGroupItem

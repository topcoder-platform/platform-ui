import React from 'react'

import { Field, NonStaticField } from '../../form-field.model'
import { FormSectionModel } from '../../form-section.model'

import styles from './FormSection.module.scss'

interface FormSection {
    renderFormInput: (input: NonStaticField, index: number) => JSX.Element | undefined
    section: FormSectionModel
}

const FormSection: React.FC<FormSection> = ({section, renderFormInput}: FormSection) => {
    const { description, title, fields }: FormSectionModel = section

    const inputFields: Array<JSX.Element | undefined> = fields.map((field: Field, index: number) => renderFormInput(field as NonStaticField, index))

    return (
        <div className={styles['form-section']}>
            <div className={styles['left']}>
                <div className={styles['title']}>
                    {title}
                </div>
                <div className={styles['section-description']} dangerouslySetInnerHTML={{__html: description || ''}}/>
            </div>
            <div className={styles['right']}>
                {inputFields}
            </div>
        </div>
    )
}

export default FormSection

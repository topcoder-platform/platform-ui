import React, { Dispatch, SetStateAction, useState } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel } from '../../../../../lib'

import { BugHuntFormConfig, FormInputNames } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'

const BugHuntIntakeForm: React.FC = () => {

    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })
    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const projectTitle: string = formGetInputModel(inputs, FormInputNames.projectTitle).value as string
        const featuresToTest: string = formGetInputModel(inputs, FormInputNames.featuresToTest).value as string
        const deliveryType: string = formGetInputModel(inputs, FormInputNames.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, FormInputNames.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, FormInputNames.websiteURL).value as string
        const bugHuntGoals: string = formGetInputModel(inputs, FormInputNames.bugHuntGoals).value as string
        return {
            bugHuntGoals,
            deliveryType,
            featuresToTest,
            projectTitle,
            repositoryLink,
            websiteURL,
        }
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        // const 
        return new Promise(() => {}).then(() => {})
    }

    return (
        <div className={styles['bug-hunt-wrapper']}>
            <Form formDef={formDef} requestGenerator={requestGenerator} save={onSave} />
        </div>
    )
}

export default BugHuntIntakeForm

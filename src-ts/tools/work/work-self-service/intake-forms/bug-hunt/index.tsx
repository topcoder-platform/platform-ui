import React from 'react'

import { Form } from '../../../../../lib'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'

const BugHuntIntakeForm: React.FC = () => {

    const requestGenerator: () => void = () => {}

    const onSave: (val: any) => Promise<void> = (val: any) => new Promise(() => {}).then(() => {})

    return (
        <div className={styles['bug-hunt-wrapper']}>
            <Form formDef={BugHuntFormConfig} requestGenerator={requestGenerator} save={onSave} />
        </div>
    )
}

export default BugHuntIntakeForm

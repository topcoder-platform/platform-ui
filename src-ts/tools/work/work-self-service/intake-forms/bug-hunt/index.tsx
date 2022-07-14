import React from 'react'

import { Form, InfoCard, PageDivider } from '../../../../../lib'
import { workBugHuntConfig } from '../../../work-lib'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

const BugHuntIntakeForm: React.FC = () => {

    const requestGenerator: () => void = () => { }

    const onSave: (val: any) => Promise<void> = (val: any) => new Promise(() => { }).then(() => { })

    return (
        <div className={styles['bug-hunt-wrapper']}>
            <DeliverablesInfoCard />
            <InfoCard
                color='success'
                isCollapsible
                title={`About ${workBugHuntConfig.type}`}
            >
                {workBugHuntConfig.about}
            </InfoCard>
            <PageDivider />
            <Form formDef={BugHuntFormConfig} requestGenerator={requestGenerator} save={onSave} />
        </div>
    )
}

export default BugHuntIntakeForm

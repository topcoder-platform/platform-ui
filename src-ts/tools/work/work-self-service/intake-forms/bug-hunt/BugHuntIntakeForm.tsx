import React, { Dispatch, SetStateAction, useState } from 'react'

import { Form, FormDefinition, formGetInputModel, FormInputModel, IconOutline, InfoCard, PageDivider } from '../../../../../lib'
import { useCheckIsMobile } from '../../../../../lib/hooks'
import { workBugHuntConfig } from '../../../work-lib'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig, FormInputNames } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

const BugHuntIntakeForm: React.FC = () => {

    const isMobile: boolean = useCheckIsMobile()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })
    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const projectTitle: string = formGetInputModel(inputs, FormInputNames.title).value as string
        const featuresToTest: string = formGetInputModel(inputs, FormInputNames.features).value as string
        const deliveryType: string = formGetInputModel(inputs, FormInputNames.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, FormInputNames.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, FormInputNames.websiteURL).value as string
        const bugHuntGoals: string = formGetInputModel(inputs, FormInputNames.goals).value as string
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
        return new Promise(() => { }).then(() => { })
    }

    return (
        <>
            <WorkTypeBanner
                title={workBugHuntConfig.title}
                subTitle={workBugHuntConfig.subtitle}
                workType={workBugHuntConfig.type}
            />
            <WorkServicePrice
                duration={workBugHuntConfig.duration}
                hideTitle
                icon={<IconOutline.BadgeCheckIcon width={48} height={48} />}
                price={1599} // TODO in PROD-2446 - Budget/Pricing. Matching Figma mockup until then.
                serviceType={workBugHuntConfig.type}
                showIcon
            />
            <div className={styles['bug-hunt-wrapper']}>
                <DeliverablesInfoCard isMobile={isMobile} />
                <InfoCard
                    color='success'
                    defaultOpen={!isMobile}
                    isCollapsible
                    title={`About ${workBugHuntConfig.type}`}
                >
                    {workBugHuntConfig.about}
                </InfoCard>
                <PageDivider />
                <Form formDef={BugHuntFormConfig} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>
    )
}

export default BugHuntIntakeForm

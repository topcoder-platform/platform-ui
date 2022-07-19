import React, { Dispatch, SetStateAction, useEffect, useState } from 'react'

import {
    Form,
    FormDefinition,
    formGetInputModel,
    FormInputModel,
    IconOutline,
    InfoCard,
    PageDivider,
    useCheckIsMobile
} from '../../../../../lib'
import { Challenge, workBugHuntConfig, workCreateAsync, WorkType } from '../../../work-lib'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig, FormInputNames } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

interface BugHuntIntakeFormProps {
    workId?: string
}

const BugHuntIntakeForm: React.FC<BugHuntIntakeFormProps> = ({ workId }) => {

    const isMobile: boolean = useCheckIsMobile()

    const [selectedPackage, setSelectedPackage]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('standard')

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    useEffect(() => {
        const useEffectAsync: () => Promise<void> = async () => {
            if (!workId) {
                // create challenge
                const response: any = await workCreateAsync(WorkType.bugHunt)
                setChallenge(response)
            } else {
                // TODO: fetch challenge using workId
            }
        }

        useEffectAsync()
    }, [workId])

    const requestGenerator: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        const projectTitle: string = formGetInputModel(inputs, FormInputNames.title).value as string
        const featuresToTest: string = formGetInputModel(inputs, FormInputNames.features).value as string
        const deliveryType: string = formGetInputModel(inputs, FormInputNames.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, FormInputNames.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, FormInputNames.websiteURL).value as string
        const bugHuntGoals: string = formGetInputModel(inputs, FormInputNames.goals).value as string
        const packageType: string = formGetInputModel(inputs, FormInputNames.packageType).value as string
        console.log(packageType)
        return {
            bugHuntGoals,
            deliveryType,
            featuresToTest,
            packageType,
            projectTitle,
            repositoryLink,
            websiteURL,
        }
    }

    const onChange: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        console.log('Custom OnChange called')
        console.log(inputs)
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        return new Promise(() => { }).then(() => { })
    }

    const defaultValues: object = {
        packageType: 'standard',
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
                <Form onChange={onChange} formDef={formDef} formValues={defaultValues} requestGenerator={requestGenerator} save={onSave} />
            </div>
        </>
    )
}

export default BugHuntIntakeForm

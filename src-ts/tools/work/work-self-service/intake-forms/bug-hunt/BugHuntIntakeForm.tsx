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
import {
    Challenge,
    ChallengeMetadataName,
    workBugHuntConfig,
    workCreateAsync,
    WorkType,
    workUpdateAsync
} from '../../../work-lib'
import { WorkServicePrice } from '../../../work-service-price'
import { WorkTypeBanner } from '../../../work-type-banner'

import { BugHuntFormConfig } from './bug-hunt.form.config'
import styles from './BugHunt.module.scss'
import { DeliverablesInfoCard } from './deliverables-info-card'

interface BugHuntIntakeFormProps {
    workId?: string
}

const BugHuntIntakeForm: React.FC<BugHuntIntakeFormProps> = ({ workId }) => {

    const isMobile: boolean = useCheckIsMobile()

    const [challenge, setChallenge]: [Challenge | undefined, Dispatch<SetStateAction<Challenge | undefined>>] = useState()
    const [formDef, setFormDef]: [FormDefinition, Dispatch<SetStateAction<FormDefinition>>]
        = useState<FormDefinition>({ ...BugHuntFormConfig })

    // TODO: if viewing existing challege, pull from challenge metadata
    const [selectedPackage, setSelectedPackage]: [string, Dispatch<SetStateAction<string>>]
        = useState<string>('standard')

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
        const projectTitle: string = formGetInputModel(inputs, ChallengeMetadataName.projectTitle).value as string
        const featuresToTest: string = formGetInputModel(inputs, ChallengeMetadataName.featuresToTest).value as string
        const deliveryType: string = formGetInputModel(inputs, ChallengeMetadataName.deliveryType).value as string
        const repositoryLink: string = formGetInputModel(inputs, ChallengeMetadataName.repositoryLink).value as string
        const websiteURL: string = formGetInputModel(inputs, ChallengeMetadataName.websiteURL).value as string
        const goals: string = formGetInputModel(inputs, ChallengeMetadataName.goals).value as string
        const packageType: string = formGetInputModel(inputs, ChallengeMetadataName.packageType).value as string
        return {
            deliveryType,
            featuresToTest,
            goals,
            packageType,
            projectTitle,
            repositoryLink,
            websiteURL,
        }
    }

    const onChange: (inputs: ReadonlyArray<FormInputModel>) => void = (inputs) => {
        console.log('Custom OnChange called')
        console.log(inputs)
        const packageType: string = formGetInputModel(inputs, ChallengeMetadataName.packageType).value as string
        console.log(packageType)
        if (packageType !== selectedPackage) {
            setSelectedPackage(packageType)
        }
    }

    const onSave: (val: any) => Promise<void> = (val: any) => {
        if (!challenge) { return Promise.resolve() }

        return workUpdateAsync(WorkType.bugHunt, challenge, val)
            .then(() => {
                // TODO: Navigate to a different page (review, back to dashboard, etc)
            })
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
                price={workBugHuntConfig.priceConfig.getPrice(workBugHuntConfig.priceConfig, selectedPackage)}
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
